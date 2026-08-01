import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import {
  queryEsimProfiles,
  type EsimProfile,
} from "@/app/services/esimQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ORDERS_PER_RUN = 10;

type SyncResult = {
  orderId: string;
  referenceNumber: string;
  result:
    | "ISSUED"
    | "PENDING"
    | "SKIPPED"
    | "FAILED";
  message?: string;
};

function isAuthorized(request: Request) {
  const configuredSecret =
    process.env.FULFILLMENT_SECRET?.trim();

  if (!configuredSecret) {
    console.error("FULFILLMENT_SECRET is missing.");
    return false;
  }

  const authorization =
    request.headers.get("authorization");

  return authorization === `Bearer ${configuredSecret}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1500);
  }

  return "Unknown eSIM query error.";
}

function normalizeOptionalValue(
  value: string | undefined,
) {
  const normalized = value?.trim();
  return normalized || null;
}

function getProfileRawData(profile: EsimProfile) {
  return JSON.stringify(profile).slice(0, 20000);
}

async function syncOrder(order: {
  id: string;
  referenceNumber: string;
  esimOrderId: string | null;
}) {
  const baseResult: SyncResult = {
    orderId: order.id,
    referenceNumber: order.referenceNumber,
    result: "PENDING",
  };

  if (!order.esimOrderId) {
    return {
      ...baseResult,
      result: "SKIPPED" as const,
      message: "Supplier order number is missing.",
    };
  }

  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      profileLastCheckedAt: new Date(),
      profileCheckAttempts: {
        increment: 1,
      },
    },
  });

  try {
    const queryResult = await queryEsimProfiles(
      order.esimOrderId,
    );

    if (
      queryResult.pending ||
      !queryResult.ready ||
      !queryResult.primaryProfile
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "PROCESSING",
          esimStatus: "PROCESSING",
          esimRawResponse: JSON.stringify(
            queryResult.rawResponse,
          ).slice(0, 20000),
          lastError: null,
        },
      });

      return {
        ...baseResult,
        result: "PENDING" as const,
        message:
          "The supplier is still allocating the eSIM profile.",
      };
    }

    const profile = queryResult.primaryProfile;

    const activationCode =
      normalizeOptionalValue(profile.ac);

    const qrCodeUrl =
      normalizeOptionalValue(profile.qrCodeUrl);

    const iccid =
      normalizeOptionalValue(profile.iccid);

    if (!activationCode || !qrCodeUrl || !iccid) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "PROCESSING",
          esimStatus: "PROCESSING",
          esimRawResponse: JSON.stringify(
            queryResult.rawResponse,
          ).slice(0, 20000),
          lastError:
            "The supplier returned a profile without complete installation details.",
        },
      });

      return {
        ...baseResult,
        result: "PENDING" as const,
        message:
          "The profile exists, but installation details are incomplete.",
      };
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PROCESSING",
        paymentStatus: "PAID",
        esimStatus: "ISSUED",

        esimTranNo:
          normalizeOptionalValue(profile.esimTranNo),

        iccid,
        activationCode,
        qrCodeUrl,

        smdpStatus:
          normalizeOptionalValue(profile.smdpStatus),

        supplierEsimStatus:
          normalizeOptionalValue(profile.esimStatus),

        apn:
          normalizeOptionalValue(profile.apn),

        profileIssuedAt: new Date(),
        esimIssuedAt: new Date(),
        profileLastCheckedAt: new Date(),

        esimRawResponse:
          getProfileRawData(profile),

        lastError: null,
      },
    });

    console.info("ESIM PROFILE ISSUED:", {
      orderId: order.id,
      referenceNumber: order.referenceNumber,
      supplierOrderNo: order.esimOrderId,
      esimTranNo: profile.esimTranNo,
      iccid: profile.iccid,
    });

    return {
      ...baseResult,
      result: "ISSUED" as const,
      message:
        "The eSIM profile and QR details were saved.",
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error("ESIM PROFILE SYNC FAILED:", {
      orderId: order.id,
      referenceNumber: order.referenceNumber,
      supplierOrderNo: order.esimOrderId,
      error: errorMessage,
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PROCESSING",
        esimStatus: "PROCESSING",
        lastError: errorMessage,
        profileLastCheckedAt: new Date(),
      },
    });

    return {
      ...baseResult,
      result: "FAILED" as const,
      message: errorMessage,
    };
  }
}

async function runProfileSync() {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: "PROCESSING",
      esimStatus: "PROCESSING",
      esimOrderId: {
        not: null,
      },
    },
    select: {
      id: true,
      referenceNumber: true,
      esimOrderId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: MAX_ORDERS_PER_RUN,
  });

  const results: SyncResult[] = [];

  for (const order of orders) {
    const result = await syncOrder(order);
    results.push(result);
  }

  return {
    checked: orders.length,
    issued: results.filter(
      (item) => item.result === "ISSUED",
    ).length,
    pending: results.filter(
      (item) => item.result === "PENDING",
    ).length,
    failed: results.filter(
      (item) => item.result === "FAILED",
    ).length,
    skipped: results.filter(
      (item) => item.result === "SKIPPED",
    ).length,
    results,
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const summary = await runProfileSync();

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error("ESIM SYNC ROUTE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Use an authorized POST request to synchronize processing eSIM orders.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    },
  );
}