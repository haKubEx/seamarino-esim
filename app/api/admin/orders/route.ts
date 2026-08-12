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
  const expectedAdminKey =
    process.env.ADMIN_API_KEY?.trim();

  const suppliedAdminKey =
    getAdminKey(request);

  return Boolean(
    expectedAdminKey &&
      suppliedAdminKey ===
        expectedAdminKey,
  );
}

function normalizeText(
  value: string | null,
) {
  return value?.trim() || "";
}

function normalizePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const numericValue =
    Number(value);

  return Number.isSafeInteger(
    numericValue,
  ) &&
    numericValue > 0
    ? numericValue
    : fallback;
}

function normalizeOrderStatus(
  value: string,
) {
  const allowed = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
  ] as const;

  return allowed.includes(
    value as
      (typeof allowed)[number],
  )
    ? value
    : "";
}

function normalizePaymentStatus(
  value: string,
) {
  const allowed = [
    "PENDING",
    "PAID",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
  ] as const;

  return allowed.includes(
    value as
      (typeof allowed)[number],
  )
    ? value
    : "";
}

function normalizeEsimStatus(
  value: string,
) {
  const allowed = [
    "NOT_ORDERED",
    "PROCESSING",
    "ISSUED",
    "DELIVERED",
    "FAILED",
  ] as const;

  return allowed.includes(
    value as
      (typeof allowed)[number],
  )
    ? value
    : "";
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

    const orderStatus =
      normalizeOrderStatus(
        normalizeText(
          request.nextUrl.searchParams.get(
            "status",
          ),
        ).toUpperCase(),
      );

    const paymentStatus =
      normalizePaymentStatus(
        normalizeText(
          request.nextUrl.searchParams.get(
            "paymentStatus",
          ),
        ).toUpperCase(),
      );

    const esimStatus =
      normalizeEsimStatus(
        normalizeText(
          request.nextUrl.searchParams.get(
            "esimStatus",
          ),
        ).toUpperCase(),
      );

    const page =
      normalizePositiveInteger(
        request.nextUrl.searchParams.get(
          "page",
        ),
        1,
      );

    const pageSize =
      Math.min(
        100,
        normalizePositiveInteger(
          request.nextUrl.searchParams.get(
            "pageSize",
          ),
          20,
        ),
      );

    const skip =
      (page - 1) *
      pageSize;

    const where = {
      ...(search
        ? {
            OR: [
              {
                referenceNumber: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                customerName: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                customerEmail: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                customerPhone: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                packageCode: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                planName: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                iccid: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },

              {
                esimOrderId: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(orderStatus
        ? {
            status:
              orderStatus as
                | "PENDING"
                | "PAID"
                | "PROCESSING"
                | "COMPLETED"
                | "FAILED"
                | "CANCELLED"
                | "REFUNDED",
          }
        : {}),

      ...(paymentStatus
        ? {
            paymentStatus:
              paymentStatus as
                | "PENDING"
                | "PAID"
                | "FAILED"
                | "CANCELLED"
                | "REFUNDED",
          }
        : {}),

      ...(esimStatus
        ? {
            esimStatus:
              esimStatus as
                | "NOT_ORDERED"
                | "PROCESSING"
                | "ISSUED"
                | "DELIVERED"
                | "FAILED",
          }
        : {}),
    };

    const startOfToday =
      new Date();

    startOfToday.setHours(
      0,
      0,
      0,
      0,
    );

    const [
      orders,
      totalOrders,
      todayOrders,
      pendingPayment,
      processingEsims,
      deliveredEsims,
      failedOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        skip,
        take:
          pageSize,

        select: {
          id:
            true,

          referenceNumber:
            true,

          customerName:
            true,

          customerEmail:
            true,

          customerPhone:
            true,

          packageCode:
            true,

          planName:
            true,

          selectedDays:
            true,

          subtotalPhpCentavos:
            true,

          discountPhpCentavos:
            true,

          amountPhpCentavos:
            true,

          currency:
            true,

          couponCodeSnapshot:
            true,

          status:
            true,

          paymentStatus:
            true,

          esimStatus:
            true,

          paymentMethod:
            true,

          paidAt:
            true,

          esimOrderId:
            true,

          iccid:
            true,

          supplierEsimStatus:
            true,

          emailDeliveryStatus:
            true,

          emailSent:
            true,

          completedAt:
            true,

          lastError:
            true,

          createdAt:
            true,

          updatedAt:
            true,
        },
      }),

      prisma.order.count({
        where,
      }),

      prisma.order.count({
        where: {
          createdAt: {
            gte:
              startOfToday,
          },
        },
      }),

      prisma.order.count({
        where: {
          paymentStatus:
            "PENDING",
        },
      }),

      prisma.order.count({
        where: {
          esimStatus:
            "PROCESSING",
        },
      }),

      prisma.order.count({
        where: {
          esimStatus:
            "DELIVERED",
        },
      }),

      prisma.order.count({
        where: {
          OR: [
            {
              status:
                "FAILED",
            },
            {
              paymentStatus:
                "FAILED",
            },
            {
              esimStatus:
                "FAILED",
            },
          ],
        },
      }),
    ]);

    const todayRevenueResult =
      await prisma.order.aggregate({
        where: {
          paymentStatus:
            "PAID",

          paidAt: {
            gte:
              startOfToday,
          },
        },

        _sum: {
          amountPhpCentavos:
            true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        stats: {
          todayOrders,

          todayRevenueCentavos:
            todayRevenueResult
              ._sum
              .amountPhpCentavos ??
            0,

          pendingPayment,
          processingEsims,
          deliveredEsims,
          failedOrders,
        },

        pagination: {
          page,
          pageSize,

          total:
            totalOrders,

          totalPages:
            Math.max(
              1,
              Math.ceil(
                totalOrders /
                  pageSize,
              ),
            ),
        },

        orders:
          orders.map(
            (order) => ({
              ...order,

              paidAt:
                order.paidAt
                  ?.toISOString() ??
                null,

              completedAt:
                order.completedAt
                  ?.toISOString() ??
                null,

              createdAt:
                order.createdAt
                  .toISOString(),

              updatedAt:
                order.updatedAt
                  .toISOString(),
            }),
          ),
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN ORDERS API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load orders.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}