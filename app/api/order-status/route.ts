import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_SYNC_COOLDOWN_MS =
  15_000;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
  };
}

function getDevelopmentErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown order-status error.";
}

function normalizeBaseUrl(
  value:
    | string
    | undefined,
) {
  return value
    ?.trim()
    .replace(/\/+$/, "") ?? "";
}

function shouldTriggerProfileSync({
  paymentStatus,
  status,
  esimStatus,
  esimOrderId,
  profileLastCheckedAt,
}: {
  paymentStatus: string;
  status: string;
  esimStatus: string;
  esimOrderId:
    | string
    | null;
  profileLastCheckedAt:
    | Date
    | null;
}) {
  if (
    paymentStatus !== "PAID" ||
    status !== "PROCESSING" ||
    esimStatus !== "PROCESSING" ||
    !esimOrderId
  ) {
    return false;
  }

  if (!profileLastCheckedAt) {
    return true;
  }

  return (
    Date.now() -
      profileLastCheckedAt.getTime() >=
    PROFILE_SYNC_COOLDOWN_MS
  );
}

async function triggerFulfillmentSync(
  request: NextRequest,
) {
  const fulfillmentSecret =
    process.env
      .FULFILLMENT_SECRET
      ?.trim();

  if (!fulfillmentSecret) {
    console.error(
      "ORDER STATUS API: FULFILLMENT_SECRET is missing.",
    );

    return;
  }

  const configuredBaseUrl =
    normalizeBaseUrl(
      process.env
        .FULFILLMENT_BASE_URL,
    ) ||
    normalizeBaseUrl(
      process.env
        .NEXT_PUBLIC_BASE_URL,
    );

  const baseUrl =
    configuredBaseUrl ||
    request.nextUrl.origin;

  const syncUrl =
    `${baseUrl}/api/esim/sync`;

  try {
    const response =
      await fetch(
        syncUrl,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${fulfillmentSecret}`,

            "Content-Type":
              "application/json",
          },

          cache:
            "no-store",
        },
      );

    const responseText =
      await response.text();

    if (!response.ok) {
      console.error(
        "ORDER STATUS API: Automatic eSIM sync failed.",
        {
          status:
            response.status,

          statusText:
            response.statusText,

          response:
            responseText.slice(
              0,
              1500,
            ),
        },
      );

      return;
    }

    console.info(
      "ORDER STATUS API: Automatic eSIM sync completed.",
      {
        status:
          response.status,

        response:
          responseText.slice(
            0,
            1500,
          ),
      },
    );
  } catch (error) {
    console.error(
      "ORDER STATUS API: Unable to trigger automatic eSIM sync.",
      {
        error:
          getDevelopmentErrorMessage(
            error,
          ),
      },
    );
  }
}

async function getCustomerOrder({
  reference,
  userId,
}: {
  reference: string;
  userId: string;
}) {
  return prisma.order.findFirst({
    where: {
      referenceNumber:
        reference,

      userId,
    },

    select: {
      id:
        true,

      referenceNumber:
        true,

      status:
        true,

      paymentStatus:
        true,

      esimStatus:
        true,

      planName:
        true,

      packageCode:
        true,

      createdAt:
        true,

      paidAt:
        true,

      completedAt:
        true,

      amountPhpCentavos:
        true,

      qrCode:
        true,

      qrCodeUrl:
        true,

      activationCode:
        true,

      smdpAddress:
        true,

      smdpStatus:
        true,

      iccid:
        true,

      apn:
        true,

      supplierEsimStatus:
        true,

      lastError:
        true,

      esimOrderId:
        true,

      profileLastCheckedAt:
        true,
    },
  });
}

export async function GET(
  request: NextRequest,
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must sign in to view this order.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const reference =
      request.nextUrl.searchParams
        .get("reference")
        ?.trim();

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing order reference.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    console.info(
      "ORDER STATUS API: Looking up order",
      {
        reference,
        userId:
          session.user.id,
      },
    );

    let order =
      await getCustomerOrder({
        reference,

        userId:
          session.user.id,
      });

    if (!order) {
      console.warn(
        "ORDER STATUS API: Order not found for current user",
        {
          reference,

          userId:
            session.user.id,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Order not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const triggerSync =
      shouldTriggerProfileSync({
        paymentStatus:
          order.paymentStatus,

        status:
          order.status,

        esimStatus:
          order.esimStatus,

        esimOrderId:
          order.esimOrderId,

        profileLastCheckedAt:
          order
            .profileLastCheckedAt,
      });

    if (triggerSync) {
      console.info(
        "ORDER STATUS API: Triggering automatic eSIM profile sync.",
        {
          reference:
            order.referenceNumber,

          supplierOrderPresent:
            Boolean(
              order.esimOrderId,
            ),
        },
      );

      await triggerFulfillmentSync(
        request,
      );

      const refreshedOrder =
        await getCustomerOrder({
          reference,

          userId:
            session.user.id,
        });

      if (refreshedOrder) {
        order =
          refreshedOrder;
      }
    }

    return NextResponse.json(
      {
        success:
          true,

        referenceNumber:
          order.referenceNumber,

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,

        esimStatus:
          order.esimStatus,

        planName:
          order.planName,

        packageCode:
          order.packageCode,

        createdAt:
          order.createdAt.toISOString(),

        paidAt:
          order.paidAt
            ?.toISOString() ??
          null,

        completedAt:
          order.completedAt
            ?.toISOString() ??
          null,

        amountPhpCentavos:
          order
            .amountPhpCentavos,

        qrCode:
          order.qrCode,

        qrCodeUrl:
          order.qrCodeUrl,

        activationCode:
          order.activationCode,

        smdpAddress:
          order.smdpAddress,

        smdpStatus:
          order.smdpStatus,

        iccid:
          order.iccid,

        apn:
          order.apn,

        supplierEsimStatus:
          order
            .supplierEsimStatus,

        lastError:
          order.lastError,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ORDER STATUS API ERROR:",
      error,
    );

    const developmentMessage =
      getDevelopmentErrorMessage(
        error,
      );

    return NextResponse.json(
      {
        success: false,

        error:
          process.env.NODE_ENV ===
          "development"
            ? developmentMessage
            : "Unable to retrieve the order status.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}