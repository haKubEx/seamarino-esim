import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(
  request: NextRequest,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must sign in to view this order.",
        },
        {
          status: 401,
          headers: noStoreHeaders(),
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
          headers: noStoreHeaders(),
        },
      );
    }

    console.info(
      "ORDER STATUS API: Looking up order",
      {
        reference,
        userId: session.user.id,
      },
    );

    const order =
      await prisma.order.findFirst({
        where: {
          referenceNumber: reference,
          userId: session.user.id,
        },

        select: {
          referenceNumber: true,

          status: true,
          paymentStatus: true,
          esimStatus: true,

          planName: true,
          packageCode: true,

          createdAt: true,
          paidAt: true,
          completedAt: true,

          amountPhpCentavos: true,

          qrCode: true,
          qrCodeUrl: true,

          activationCode: true,
          smdpAddress: true,
          smdpStatus: true,

          iccid: true,
          apn: true,

          supplierEsimStatus: true,
          lastError: true,
        },
      });

    if (!order) {
      console.warn(
        "ORDER STATUS API: Order not found for current user",
        {
          reference,
          userId: session.user.id,
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
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

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
          order.paidAt?.toISOString() ??
          null,

        completedAt:
          order.completedAt?.toISOString() ??
          null,

        amountPhpCentavos:
          order.amountPhpCentavos,

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
          order.supplierEsimStatus,

        lastError:
          order.lastError,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
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
        headers: noStoreHeaders(),
      },
    );
  }
}