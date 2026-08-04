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

function normalizeSearch(
  value: string | null,
) {
  return value?.trim() || "";
}

export async function GET(
  request: NextRequest,
) {
  try {
    const suppliedAdminKey =
      getAdminKey(request);

    const expectedAdminKey =
      process.env.ADMIN_API_KEY?.trim();

    if (
      !expectedAdminKey ||
      suppliedAdminKey !==
        expectedAdminKey
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

    const search =
      normalizeSearch(
        request.nextUrl.searchParams.get(
          "search",
        ),
      );

    const users =
      await prisma.user.findMany({
        where: search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  orders: {
                    some: {
                      referenceNumber: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : undefined,

        orderBy: {
          createdAt: "desc",
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
              planName: true,
              packageCode: true,
              amountPhpCentavos: true,
              paymentStatus: true,
              esimStatus: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

    const customers =
      users.map((user) => {
        const paidOrders =
          user.orders.filter(
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          emailVerified:
            user.emailVerified?.toISOString() ??
            null,
          createdAt:
            user.createdAt.toISOString(),
          updatedAt:
            user.updatedAt.toISOString(),

          totalOrders:
            user.orders.length,

          paidOrders:
            paidOrders.length,

          totalSpentCentavos,

          latestOrder:
            user.orders[0]
              ? {
                  ...user.orders[0],
                  createdAt:
                    user.orders[0].createdAt.toISOString(),
                }
              : null,
        };
      });

    const totalCustomers =
      customers.length;

    const repeatCustomers =
      customers.filter(
        (customer) =>
          customer.paidOrders > 1,
      ).length;

    const totalRevenueCentavos =
      customers.reduce(
        (total, customer) =>
          total +
          customer.totalSpentCentavos,
        0,
      );

    const startOfMonth =
      new Date();

    startOfMonth.setDate(1);
    startOfMonth.setHours(
      0,
      0,
      0,
      0,
    );

    const newThisMonth =
      users.filter(
        (user) =>
          user.createdAt >=
          startOfMonth,
      ).length;

    return NextResponse.json(
      {
        success: true,

        stats: {
          totalCustomers,
          newThisMonth,
          repeatCustomers,
          totalRevenueCentavos,
        },

        customers,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN CUSTOMERS API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load customers.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}