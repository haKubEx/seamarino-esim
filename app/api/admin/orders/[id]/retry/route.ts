import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

import {
  fulfillPaidOrder,
} from "@/app/services/orderFulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma:
      "no-cache",
    Expires:
      "0",
  };
}

function isAuthorized(
  request: NextRequest,
) {
  const configuredKey =
    process.env.ADMIN_API_KEY
      ?.trim();

  const suppliedKey =
    request.headers
      .get("x-admin-key")
      ?.trim();

  return Boolean(
    configuredKey &&
    suppliedKey &&
    configuredKey ===
      suppliedKey,
  );
}

function getErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1500,
    );
  }

  return "Unable to retry eSIM fulfillment.";
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Unauthorized.",
      },
      {
        status: 401,
        headers:
          noStoreHeaders(),
      },
    );
  }

  try {
    const {
      id,
    } = await context.params;

    const orderId =
      id.trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order ID is required.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id:
            orderId,
        },

        select: {
          id: true,
          referenceNumber:
            true,
          paymentStatus:
            true,
          status:
            true,
          esimStatus:
            true,
          esimOrderId:
            true,
          selectedDays:
            true,
          lastError:
            true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order was not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      order.paymentStatus !==
      "PAID"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only paid orders can be retried.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      order.esimOrderId ||
      order.esimStatus ===
        "ISSUED" ||
      order.esimStatus ===
        "DELIVERED" ||
      order.status ===
        "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: true,
          alreadyFulfilled:
            true,
          message:
            "This order already has an eSIM fulfillment record.",
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      order.esimStatus ===
      "PROCESSING"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This order is already being processed.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      ![
        "FAILED",
        "NOT_ORDERED",
      ].includes(
        order.esimStatus,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This order is not eligible for fulfillment retry.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const result =
      await fulfillPaidOrder(
        order.id,
      );

    if (
      result.status ===
      "PROCESSING"
    ) {
      return NextResponse.json(
        {
          success: false,
          processing:
            true,
          error:
            "The order is already being processed by another request.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      result.status ===
      "ALREADY_FULFILLED"
    ) {
      return NextResponse.json(
        {
          success: true,
          alreadyFulfilled:
            true,

          message:
            "The order is already fulfilled.",

          supplierOrderNo:
            result
              .supplierOrderNo,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "eSIM fulfillment retry started successfully.",

        referenceNumber:
          result
            .referenceNumber,

        supplierOrderNo:
          result
            .supplierOrderNo,

        transactionId:
          result
            .transactionId,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "ADMIN ORDER RETRY ERROR:",
      {
        error:
          message,
      },
    );

    return NextResponse.json(
      {
        success: false,
        error:
          message,
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        "This endpoint accepts fulfillment retry requests using POST.",
    },
    {
      status: 405,
      headers: {
        ...noStoreHeaders(),
        Allow:
          "POST",
      },
    },
  );
}