import {
  timingSafeEqual,
} from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MANILA_UTC_OFFSET_HOURS = 8;
const REVENUE_CHART_DAYS = 30;
const MAX_RECENT_ORDERS = 8;

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
): string {
  return (
    request.headers
      .get("x-admin-key")
      ?.trim() ?? ""
  );
}

function secureCompare(
  suppliedValue: string,
  expectedValue: string,
): boolean {
  const suppliedBuffer =
    Buffer.from(
      suppliedValue,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expectedValue,
      "utf8",
    );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    suppliedBuffer,
    expectedBuffer,
  );
}

function isAuthorized(
  request: NextRequest,
): boolean {
  const expectedAdminKey =
    process.env.ADMIN_API_KEY?.trim();

  if (!expectedAdminKey) {
    console.error(
      "ADMIN DASHBOARD: ADMIN_API_KEY is missing.",
    );

    return false;
  }

  const suppliedAdminKey =
    getAdminKey(request);

  if (!suppliedAdminKey) {
    return false;
  }

  return secureCompare(
    suppliedAdminKey,
    expectedAdminKey,
  );
}

/**
 * Manila is UTC+8 and does not observe
 * daylight-saving time.
 *
 * This converts a Manila calendar date into
 * the matching UTC instant.
 */
function createManilaDateUtc({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}): Date {
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      -MANILA_UTC_OFFSET_HOURS,
      0,
      0,
      0,
    ),
  );
}

function getManilaDateParts(
  value = new Date(),
) {
  const shiftedDate =
    new Date(
      value.getTime() +
        MANILA_UTC_OFFSET_HOURS *
          60 *
          60 *
          1000,
    );

  return {
    year:
      shiftedDate.getUTCFullYear(),

    month:
      shiftedDate.getUTCMonth(),

    day:
      shiftedDate.getUTCDate(),
  };
}

function getStartOfManilaTodayUtc(
  now = new Date(),
): Date {
  const parts =
    getManilaDateParts(now);

  return createManilaDateUtc(
    parts,
  );
}

function getStartOfNextManilaDayUtc(
  now = new Date(),
): Date {
  const startOfToday =
    getStartOfManilaTodayUtc(
      now,
    );

  return new Date(
    startOfToday.getTime() +
      24 * 60 * 60 * 1000,
  );
}

function getStartOfManilaMonthUtc(
  now = new Date(),
): Date {
  const parts =
    getManilaDateParts(now);

  return createManilaDateUtc({
    year: parts.year,
    month: parts.month,
    day: 1,
  });
}

function getManilaDateKey(
  value: Date,
): string {
  const shiftedDate =
    new Date(
      value.getTime() +
        MANILA_UTC_OFFSET_HOURS *
          60 *
          60 *
          1000,
    );

  const year =
    shiftedDate.getUTCFullYear();

  const month =
    String(
      shiftedDate.getUTCMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      shiftedDate.getUTCDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function createRevenueDays(
  numberOfDays: number,
  now = new Date(),
) {
  const startOfToday =
    getStartOfManilaTodayUtc(
      now,
    );

  return Array.from(
    {
      length: numberOfDays,
    },
    (_, index) => {
      const daysBeforeToday =
        numberOfDays -
        1 -
        index;

      const date =
        new Date(
          startOfToday.getTime() -
            daysBeforeToday *
              24 *
              60 *
              60 *
              1000,
        );

      return {
        date,
        dateKey:
          getManilaDateKey(
            date,
          ),
        revenueCentavos: 0,
        orderCount: 0,
      };
    },
  );
}

function calculatePercentage(
  numerator: number,
  denominator: number,
): number {
  if (
    denominator <= 0 ||
    numerator <= 0
  ) {
    return 0;
  }

  return Number(
    (
      (numerator /
        denominator) *
      100
    ).toFixed(1),
  );
}

function calculateAverageFulfillmentSeconds(
  orders: Array<{
    paidAt: Date | null;
    completedAt: Date | null;
  }>,
): number {
  const durations =
    orders
      .map((order) => {
        if (
          !order.paidAt ||
          !order.completedAt
        ) {
          return null;
        }

        const durationMs =
          order.completedAt.getTime() -
          order.paidAt.getTime();

        return durationMs >= 0
          ? durationMs
          : null;
      })
      .filter(
        (
          duration,
        ): duration is number =>
          duration !== null,
      );

  if (durations.length === 0) {
    return 0;
  }

  const totalDurationMs =
    durations.reduce(
      (total, duration) =>
        total + duration,
      0,
    );

  return Math.round(
    totalDurationMs /
      durations.length /
      1000,
  );
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1_500,
    );
  }

  return "Unknown dashboard error.";
}

export async function GET(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      {
        status: 401,
        headers:
          noStoreHeaders(),
      },
    );
  }

  try {
    const now =
      new Date();

    const startOfToday =
      getStartOfManilaTodayUtc(
        now,
      );

    const startOfTomorrow =
      getStartOfNextManilaDayUtc(
        now,
      );

    const startOfMonth =
      getStartOfManilaMonthUtc(
        now,
      );

    const revenueDays =
      createRevenueDays(
        REVENUE_CHART_DAYS,
        now,
      );

    const chartStartDate =
      revenueDays[0]?.date ??
      startOfToday;

    const [
      todayPaidOrders,
      monthPaidOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      failedOrders,
      deliveredEsims,
      totalCustomers,
      totalPaidOrders,
      recentOrders,
      chartOrders,
      fulfillmentOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          paymentStatus:
            "PAID",

          paidAt: {
            gte:
              startOfToday,

            lt:
              startOfTomorrow,
          },
        },

        select: {
          amountPhpCentavos:
            true,
        },
      }),

      prisma.order.findMany({
        where: {
          paymentStatus:
            "PAID",

          paidAt: {
            gte:
              startOfMonth,

            lt:
              startOfTomorrow,
          },
        },

        select: {
          amountPhpCentavos:
            true,
        },
      }),

      prisma.order.count({
        where: {
          OR: [
            {
              status:
                "PENDING",
            },
            {
              paymentStatus:
                "PENDING",
            },
            {
              esimStatus:
                "NOT_ORDERED",
            },
          ],
        },
      }),

      prisma.order.count({
        where: {
          OR: [
            {
              status:
                "PROCESSING",
            },
            {
              esimStatus:
                "PROCESSING",
            },
            {
              esimStatus:
                "ISSUED",
            },
            {
              emailDeliveryStatus:
                "PENDING",
            },
            {
              emailDeliveryStatus:
                "SENDING",
            },
          ],
        },
      }),

      prisma.order.count({
        where: {
          status:
            "COMPLETED",
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
            {
              emailDeliveryStatus:
                "FAILED",
            },
          ],
        },
      }),

      prisma.order.count({
        where: {
          esimStatus:
            "DELIVERED",
        },
      }),

      prisma.user.count({
        where: {
          role:
            "CUSTOMER",
        },
      }),

      prisma.order.count({
        where: {
          paymentStatus:
            "PAID",
        },
      }),

      prisma.order.findMany({
        orderBy: {
          createdAt:
            "desc",
        },

        take:
          MAX_RECENT_ORDERS,

        select: {
          id: true,
          referenceNumber:
            true,
          customerName:
            true,
          customerEmail:
            true,
          planName:
            true,
          packageCode:
            true,
          amountPhpCentavos:
            true,
          paymentStatus:
            true,
          esimStatus:
            true,
          status:
            true,
          createdAt:
            true,
        },
      }),

      prisma.order.findMany({
        where: {
          paymentStatus:
            "PAID",

          paidAt: {
            gte:
              chartStartDate,

            lt:
              startOfTomorrow,
          },
        },

        select: {
          paidAt:
            true,
          amountPhpCentavos:
            true,
        },
      }),

      prisma.order.findMany({
        where: {
          paymentStatus:
            "PAID",

          paidAt: {
            gte:
              chartStartDate,
          },

          completedAt: {
            not: null,
          },
        },

        select: {
          paidAt:
            true,
          completedAt:
            true,
        },
      }),
    ]);

    const todayRevenueCentavos =
      todayPaidOrders.reduce(
        (
          total,
          order,
        ) =>
          total +
          order.amountPhpCentavos,
        0,
      );

    const monthRevenueCentavos =
      monthPaidOrders.reduce(
        (
          total,
          order,
        ) =>
          total +
          order.amountPhpCentavos,
        0,
      );

    const revenueMap =
      new Map(
        revenueDays.map(
          (day) => [
            day.dateKey,
            day,
          ],
        ),
      );

    for (
      const order of
      chartOrders
    ) {
      if (!order.paidAt) {
        continue;
      }

      const dateKey =
        getManilaDateKey(
          order.paidAt,
        );

      const revenueDay =
        revenueMap.get(
          dateKey,
        );

      if (!revenueDay) {
        continue;
      }

      revenueDay.revenueCentavos +=
        order.amountPhpCentavos;

      revenueDay.orderCount +=
        1;
    }

    const revenueChart =
      revenueDays.map(
        (day) => ({
          date:
            day.date.toISOString(),

          dateKey:
            day.dateKey,

          revenueCentavos:
            day.revenueCentavos,

          orderCount:
            day.orderCount,
        }),
      );

    const deliverySuccessRate =
      calculatePercentage(
        deliveredEsims,
        totalPaidOrders,
      );

    const averageFulfillmentSeconds =
      calculateAverageFulfillmentSeconds(
        fulfillmentOrders,
      );

    return NextResponse.json(
      {
        success: true,

        timezone:
          "Asia/Manila",

        generatedAt:
          now.toISOString(),

        stats: {
          todayRevenueCentavos,

          monthRevenueCentavos,

          todayOrders:
            todayPaidOrders.length,

          monthPaidOrders:
            monthPaidOrders.length,

          pendingOrders,

          processingOrders,

          completedOrders,

          failedOrders,

          deliveredEsims,

          totalCustomers,

          deliverySuccessRate,

          averageFulfillmentSeconds,
        },

        recentOrders:
          recentOrders.map(
            (order) => ({
              ...order,

              createdAt:
                order.createdAt.toISOString(),
            }),
          ),

        revenueChart,
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
      "ADMIN DASHBOARD API ERROR:",
      {
        error: message,
      },
    );

    return NextResponse.json(
      {
        success: false,

        error:
          process.env.NODE_ENV ===
          "development"
            ? message
            : "Unable to load dashboard statistics.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}