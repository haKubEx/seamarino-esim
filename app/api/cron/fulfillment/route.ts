import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { sendEsimDeliveryEmail } from "@/app/services/esimEmail";
import {
  queryEsimProfiles,
  type EsimProfile,
} from "@/app/services/esimQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ORDERS_PER_RUN = 10;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error("CRON_SECRET is missing.");
    return false;
  }

  return (
    request.headers.get("authorization") ===
    `Bearer ${cronSecret}`
  );
}

function normalizeValue(value?: string) {
  const normalized = value?.trim();
  return normalized || null;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 1500)
    : "Unknown fulfillment error.";
}

function profileRawData(profile: EsimProfile) {
  return JSON.stringify(profile).slice(0, 20000);
}

async function synchronizeProfiles() {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: "PROCESSING",
      esimStatus: "PROCESSING",
      esimOrderId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: MAX_ORDERS_PER_RUN,
  });

  let issued = 0;
  let pending = 0;
  let failed = 0;

  for (const order of orders) {
    if (!order.esimOrderId) {
      continue;
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
      const result = await queryEsimProfiles(
        order.esimOrderId,
      );

      if (
        result.pending ||
        !result.ready ||
        !result.primaryProfile
      ) {
        pending += 1;

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            esimRawResponse: JSON.stringify(
              result.rawResponse,
            ).slice(0, 20000),
            lastError: null,
          },
        });

        continue;
      }

      const profile = result.primaryProfile;

      const iccid = normalizeValue(profile.iccid);
      const activationCode = normalizeValue(profile.ac);
      const qrCodeUrl = normalizeValue(
        profile.qrCodeUrl,
      );

      if (!iccid || !activationCode || !qrCodeUrl) {
        pending += 1;

        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            lastError:
              "The supplier profile is missing installation details.",
            esimRawResponse: JSON.stringify(
              result.rawResponse,
            ).slice(0, 20000),
          },
        });

        continue;
      }

      const now = new Date();

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          esimStatus: "ISSUED",
          status: "PROCESSING",

          esimTranNo: normalizeValue(
            profile.esimTranNo,
          ),
          iccid,
          activationCode,
          qrCodeUrl,
          smdpStatus: normalizeValue(
            profile.smdpStatus,
          ),
          supplierEsimStatus: normalizeValue(
            profile.esimStatus,
          ),
          apn: normalizeValue(profile.apn),

          profileIssuedAt: now,
          esimIssuedAt: now,
          profileLastCheckedAt: now,
          esimRawResponse: profileRawData(profile),
          lastError: null,
        },
      });

      issued += 1;
    } catch (error) {
      failed += 1;

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          lastError: errorMessage(error),
          profileLastCheckedAt: new Date(),
        },
      });
    }
  }

  return {
    checked: orders.length,
    issued,
    pending,
    failed,
  };
}

async function deliverIssuedProfiles() {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      esimStatus: "ISSUED",
      emailSent: false,
      iccid: {
        not: null,
      },
      activationCode: {
        not: null,
      },
      qrCodeUrl: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: MAX_ORDERS_PER_RUN,
  });

  let sent = 0;
  let failed = 0;

  for (const order of orders) {
    if (
      !order.iccid ||
      !order.activationCode ||
      !order.qrCodeUrl
    ) {
      continue;
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        emailAttempts: {
          increment: 1,
        },
        lastAttemptAt: new Date(),
      },
    });

    try {
      await sendEsimDeliveryEmail({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        referenceNumber: order.referenceNumber,
        planName: order.planName,
        iccid: order.iccid,
        activationCode: order.activationCode,
        qrCodeUrl: order.qrCodeUrl,
        apn: order.apn,
      });

      const now = new Date();

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "COMPLETED",
          paymentStatus: "PAID",
          esimStatus: "DELIVERED",
          emailSent: true,
          emailSentAt: now,
          completedAt: now,
          lastAttemptAt: now,
          lastError: null,
        },
      });

      sent += 1;
    } catch (error) {
      failed += 1;

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "PROCESSING",
          esimStatus: "ISSUED",
          emailSent: false,
          lastAttemptAt: new Date(),
          lastError: errorMessage(error),
        },
      });
    }
  }

  return {
    checked: orders.length,
    sent,
    failed,
  };
}

export async function GET(request: Request) {
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
    const sync = await synchronizeProfiles();
    const delivery = await deliverIssuedProfiles();

    return NextResponse.json({
      success: true,
      sync,
      delivery,
    });
  } catch (error) {
    console.error("FULFILLMENT CRON ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}