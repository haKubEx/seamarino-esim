import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
  };
}

function getAdminKey(
  request: NextRequest,
) {
  return (
    request.headers
      .get("x-admin-key")
      ?.trim() || ""
  );
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const suppliedAdminKey =
      getAdminKey(request);

    const expectedAdminKey =
      process.env.ADMIN_API_KEY?.trim();

    if (
      !expectedAdminKey ||
      suppliedAdminKey !== expectedAdminKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
          headers: noStoreHeaders(),
        },
      );
    }

    const { id } = await context.params;

    const customerId =
      id.trim();

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing customer ID.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const customer =
      await prisma.user.findUnique({
        where: {
          id: customerId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,

          orders: {
            orderBy: {
              createdAt: "desc",
            },

            select: {
              id: true,
              referenceNumber: true,
              packageCode: true,
              planName: true,
              customerName: true,
              customerEmail: true,
              customerPhone: true,
              sellingPriceUsd: true,
              amountPhpCentavos: true,
              usdToPhpRate: true,
              currency: true,
              status: true,
              paymentStatus: true,
              esimStatus: true,
              paymentMethod: true,
              paidAt: true,
              iccid: true,
              esimOrderId: true,
              supplierEsimStatus: true,
              completedAt: true,
              createdAt: true,
            },
          },
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer not found.",
        },
        {
          status: 404,
          headers: noStoreHeaders(),
        },
      );
    }

    const paidOrders =
      customer.orders.filter(
        (order) =>
          order.paymentStatus ===
          "PAID",
      );

    const totalSpentCentavos =
      paidOrders.reduce(
        (total, order) =>
          total +
          order.amountPhpCentavos,
        0,
      );

    const averageOrderCentavos =
      paidOrders.length > 0
        ? Math.round(
            totalSpentCentavos /
              paidOrders.length,
          )
        : 0;

    const deliveredOrders =
      customer.orders.filter(
        (order) =>
          order.esimStatus ===
          "DELIVERED",
      ).length;

    return NextResponse.json(
      {
        success: true,

        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,

          emailVerified:
            customer.emailVerified?.toISOString() ??
            null,

          createdAt:
            customer.createdAt.toISOString(),

          updatedAt:
            customer.updatedAt.toISOString(),

          stats: {
            totalOrders:
              customer.orders.length,

            paidOrders:
              paidOrders.length,

            deliveredOrders,

            totalSpentCentavos,

            averageOrderCentavos,
          },

          orders:
            customer.orders.map(
              (order) => ({
                ...order,

                paidAt:
                  order.paidAt?.toISOString() ??
                  null,

                completedAt:
                  order.completedAt?.toISOString() ??
                  null,

                createdAt:
                  order.createdAt.toISOString(),
              }),
            ),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN CUSTOMER DETAILS API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load customer details.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}