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
    Pragma: "no-cache",
    Expires: "0",
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

function isAuthorized(
  request: NextRequest,
) {
  const suppliedAdminKey =
    getAdminKey(request);

  const expectedAdminKey =
    process.env.ADMIN_API_KEY?.trim();

  return Boolean(
    expectedAdminKey &&
      suppliedAdminKey ===
        expectedAdminKey,
  );
}

function normalizeText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function startOfCurrentMonth() {
  const now =
    new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    if (
      !isAuthorized(request)
    ) {
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

    const search =
      normalizeText(
        request.nextUrl.searchParams.get(
          "search",
        ),
      );

    const customerWhere = {
      role:
        "CUSTOMER" as const,

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                email: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                phone: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                orders: {
                  some: {
                    referenceNumber: {
                      contains:
                        search,
                      mode:
                        "insensitive" as const,
                    },
                  },
                },
              },
              {
                orders: {
                  some: {
                    planName: {
                      contains:
                        search,
                      mode:
                        "insensitive" as const,
                    },
                  },
                },
              },
              {
                orders: {
                  some: {
                    packageCode: {
                      contains:
                        search,
                      mode:
                        "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [
      customers,
      totalCustomers,
      newThisMonth,
      revenue,
      paidOrdersByCustomer,
    ] = await Promise.all([
      prisma.user.findMany({
        where:
          customerWhere,

        orderBy: {
          createdAt:
            "desc",
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
              createdAt:
                "desc",
            },

            select: {
              id: true,
              referenceNumber:
                true,
              planName: true,
              packageCode: true,
              amountPhpCentavos:
                true,
              paymentStatus:
                true,
              esimStatus: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),

      prisma.user.count({
        where: {
          role:
            "CUSTOMER",
        },
      }),

      prisma.user.count({
        where: {
          role:
            "CUSTOMER",
          createdAt: {
            gte:
              startOfCurrentMonth(),
          },
        },
      }),

      prisma.order.aggregate({
        where: {
          paymentStatus:
            "PAID",
        },
        _sum: {
          amountPhpCentavos:
            true,
        },
      }),

      prisma.order.groupBy({
        by: [
          "userId",
        ],
        where: {
          paymentStatus:
            "PAID",
          userId: {
            not:
              null,
          },
        },
        _count: {
          _all:
            true,
        },
        _sum: {
          amountPhpCentavos:
            true,
        },
      }),
    ]);

    const paidStatsByUserId =
      new Map<
        string,
        {
          paidOrders: number;
          totalSpentCentavos: number;
        }
      >();

    for (
      const row of
        paidOrdersByCustomer
    ) {
      if (!row.userId) {
        continue;
      }

      paidStatsByUserId.set(
        row.userId,
        {
          paidOrders:
            row._count._all,
          totalSpentCentavos:
            row._sum
              .amountPhpCentavos ??
            0,
        },
      );
    }

    const repeatCustomers =
      paidOrdersByCustomer.filter(
        (row) =>
          row._count._all >= 2,
      ).length;

    const serializedCustomers =
      customers.map(
        (customer) => {
          const paidStats =
            paidStatsByUserId.get(
              customer.id,
            );

          const latestOrder =
            customer.orders[0] ??
            null;

          return {
            id:
              customer.id,
            name:
              customer.name,
            email:
              customer.email,
            phone:
              customer.phone,
            emailVerified:
              customer.emailVerified
                ?.toISOString() ??
              null,
            createdAt:
              customer.createdAt.toISOString(),
            updatedAt:
              customer.updatedAt.toISOString(),

            totalOrders:
              customer.orders.length,
            paidOrders:
              paidStats
                ?.paidOrders ??
              0,
            totalSpentCentavos:
              paidStats
                ?.totalSpentCentavos ??
              0,

            latestOrder:
              latestOrder
                ? {
                    id:
                      latestOrder.id,
                    referenceNumber:
                      latestOrder.referenceNumber,
                    planName:
                      latestOrder.planName,
                    packageCode:
                      latestOrder.packageCode,
                    amountPhpCentavos:
                      latestOrder.amountPhpCentavos,
                    paymentStatus:
                      latestOrder.paymentStatus,
                    esimStatus:
                      latestOrder.esimStatus,
                    status:
                      latestOrder.status,
                    createdAt:
                      latestOrder.createdAt.toISOString(),
                  }
                : null,
          };
        },
      );

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalCustomers,
          newThisMonth,
          repeatCustomers,
          totalRevenueCentavos:
            revenue._sum
              .amountPhpCentavos ??
            0,
        },
        customers:
          serializedCustomers,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN CUSTOMERS GET ERROR:",
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
        headers:
          noStoreHeaders(),
      },
    );
  }
}