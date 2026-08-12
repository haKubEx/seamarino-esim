import {
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAXIMUM_RANGE_DAYS = 366;

type PaidOrder = {
  referenceNumber: string;
  planName: string;
  packageCode: string;
  amountPhpCentavos: number;
  subtotalPhpCentavos: number | null;
  discountPhpCentavos: number;
  storeCreditUsedPhpCentavos: number;
  paymentMethod: string | null;
  status: string;
  paymentStatus: string;
  esimStatus: string;
  paidAt: Date | null;
  completedAt: Date | null;
  customerEmail: string;
};

function secureCompare(
  left: string,
  right: string,
) {
  const leftBuffer =
    Buffer.from(
      left,
      "utf8",
    );

  const rightBuffer =
    Buffer.from(
      right,
      "utf8",
    );

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}

function isAuthorized(
  request: Request,
) {
  const expected =
    process.env.ADMIN_API_KEY?.trim() ??
    "";

  const supplied =
    request.headers
      .get("x-admin-key")
      ?.trim() ?? "";

  return Boolean(
    expected &&
      supplied &&
      secureCompare(
        supplied,
        expected,
      ),
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Invalid or missing admin key.",
    },
    {
      status: 401,
      headers:
        noStoreHeaders(),
    },
  );
}

function startOfDay(
  date: Date,
) {
  const value =
    new Date(date);

  value.setHours(
    0,
    0,
    0,
    0,
  );

  return value;
}

function endOfDay(
  date: Date,
) {
  const value =
    new Date(date);

  value.setHours(
    23,
    59,
    59,
    999,
  );

  return value;
}

function parseDate(
  value: string | null,
  fallback: Date,
) {
  if (!value) {
    return fallback;
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime(),
  )
    ? fallback
    : parsed;
}

function dateKey(
  value: Date,
) {
  return value
    .toISOString()
    .slice(0, 10);
}

function sumBy<T>(
  items: T[],
  selector: (
    item: T,
  ) => number,
) {
  return items.reduce(
    (
      total,
      item,
    ) =>
      total +
      selector(item),
    0,
  );
}

function percentageChange(
  current: number,
  previous: number,
) {
  if (
    previous === 0
  ) {
    return current === 0
      ? 0
      : 100;
  }

  return (
    ((current - previous) /
      previous) *
    100
  );
}

function buildDailyRevenue(
  start: Date,
  end: Date,
  paidOrders: PaidOrder[],
  refundedOrders: {
    amountPhpCentavos: number;
    refundedAt: Date | null;
  }[],
) {
  const paidByDay =
    new Map<string, number>();

  const refundedByDay =
    new Map<string, number>();

  for (
    const order of paidOrders
  ) {
    if (!order.paidAt) {
      continue;
    }

    const key =
      dateKey(
        order.paidAt,
      );

    paidByDay.set(
      key,
      (paidByDay.get(key) ??
        0) +
        order.amountPhpCentavos,
    );
  }

  for (
    const order of refundedOrders
  ) {
    if (!order.refundedAt) {
      continue;
    }

    const key =
      dateKey(
        order.refundedAt,
      );

    refundedByDay.set(
      key,
      (refundedByDay.get(
        key,
      ) ?? 0) +
        order.amountPhpCentavos,
    );
  }

  const result = [];

  const cursor =
    startOfDay(start);

  const last =
    startOfDay(end);

  while (
    cursor <= last
  ) {
    const key =
      dateKey(cursor);

    const gross =
      paidByDay.get(key) ??
      0;

    const refunds =
      refundedByDay.get(
        key,
      ) ?? 0;

    result.push({
      date: key,
      grossRevenuePhpCentavos:
        gross,
      refundedPhpCentavos:
        refunds,
      netRevenuePhpCentavos:
        gross - refunds,
    });

    cursor.setDate(
      cursor.getDate() + 1,
    );
  }

  return result;
}

function buildTopPlans(
  orders: PaidOrder[],
) {
  const grouped =
    new Map<
      string,
      {
        packageCode: string;
        planName: string;
        orders: number;
        revenuePhpCentavos: number;
      }
    >();

  for (
    const order of orders
  ) {
    const key =
      `${order.packageCode}::${order.planName}`;

    const current =
      grouped.get(key) ?? {
        packageCode:
          order.packageCode,
        planName:
          order.planName,
        orders: 0,
        revenuePhpCentavos:
          0,
      };

    current.orders += 1;
    current.revenuePhpCentavos +=
      order.amountPhpCentavos;

    grouped.set(
      key,
      current,
    );
  }

  return Array.from(
    grouped.values(),
  )
    .sort(
      (
        left,
        right,
      ) =>
        right.orders -
          left.orders ||
        right.revenuePhpCentavos -
          left.revenuePhpCentavos,
    )
    .slice(
      0,
      10,
    );
}

function buildPaymentMethods(
  orders: PaidOrder[],
) {
  const grouped =
    new Map<
      string,
      {
        paymentMethod: string;
        orders: number;
        revenuePhpCentavos: number;
      }
    >();

  for (
    const order of orders
  ) {
    const method =
      order.paymentMethod
        ?.trim() ||
      "Unknown";

    const current =
      grouped.get(method) ?? {
        paymentMethod:
          method,
        orders: 0,
        revenuePhpCentavos:
          0,
      };

    current.orders += 1;
    current.revenuePhpCentavos +=
      order.amountPhpCentavos;

    grouped.set(
      method,
      current,
    );
  }

  return Array.from(
    grouped.values(),
  ).sort(
    (
      left,
      right,
    ) =>
      right.orders -
      left.orders,
  );
}

async function loadPeriod(
  start: Date,
  end: Date,
) {
  const [
    paidOrders,
    refundedOrders,
    referralRewards,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus:
          "PAID",

        paidAt: {
          gte:
            start,
          lte:
            end,
        },
      },

      orderBy: {
        paidAt:
          "desc",
      },

      select: {
        referenceNumber:
          true,
        planName: true,
        packageCode: true,
        amountPhpCentavos:
          true,
        subtotalPhpCentavos:
          true,
        discountPhpCentavos:
          true,
        storeCreditUsedPhpCentavos:
          true,
        paymentMethod:
          true,
        status: true,
        paymentStatus:
          true,
        esimStatus: true,
        paidAt: true,
        completedAt: true,
        customerEmail:
          true,
      },
    }),

    prisma.order.findMany({
      where: {
        paymentStatus:
          "REFUNDED",

        refundedAt: {
          gte:
            start,
          lte:
            end,
        },
      },

      select: {
        amountPhpCentavos:
          true,
        refundedAt: true,
      },
    }),

    prisma.storeCreditTransaction.aggregate({
      where: {
        type:
          "REFERRAL_REWARD",

        createdAt: {
          gte:
            start,
          lte:
            end,
        },
      },

      _sum: {
        amountPhpCentavos:
          true,
      },

      _count: {
        id:
          true,
      },
    }),
  ]);

  const grossRevenuePhpCentavos =
    sumBy(
      paidOrders,
      (order) =>
        order.amountPhpCentavos,
    );

  const refundedPhpCentavos =
    sumBy(
      refundedOrders,
      (order) =>
        order.amountPhpCentavos,
    );

  const netRevenuePhpCentavos =
    grossRevenuePhpCentavos -
    refundedPhpCentavos;

  const completedSales =
    paidOrders.filter(
      (order) =>
        order.status ===
          "COMPLETED" &&
        order.esimStatus ===
          "DELIVERED",
    );

  const couponDiscountsPhpCentavos =
    sumBy(
      paidOrders,
      (order) =>
        order.discountPhpCentavos,
    );

  const walletUsedPhpCentavos =
    sumBy(
      paidOrders,
      (order) =>
        order.storeCreditUsedPhpCentavos,
    );

  return {
    paidOrders,
    refundedOrders,

    summary: {
      grossRevenuePhpCentavos,
      refundedPhpCentavos,
      netRevenuePhpCentavos,

      paidOrders:
        paidOrders.length,

      completedSales:
        completedSales.length,

      averageOrderValuePhpCentavos:
        paidOrders.length > 0
          ? Math.round(
              grossRevenuePhpCentavos /
                paidOrders.length,
            )
          : 0,

      couponDiscountsPhpCentavos,
      walletUsedPhpCentavos,

      referralRewardsIssuedPhpCentavos:
        referralRewards._sum
          .amountPhpCentavos ??
        0,

      referralRewardTransactions:
        referralRewards._count.id,
    },
  };
}

export async function GET(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const url =
      new URL(request.url);

    const today =
      new Date();

    const defaultEnd =
      endOfDay(today);

    const defaultStart =
      startOfDay(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() -
            29,
        ),
      );

    const start =
      startOfDay(
        parseDate(
          url.searchParams.get(
            "start",
          ),
          defaultStart,
        ),
      );

    const end =
      endOfDay(
        parseDate(
          url.searchParams.get(
            "end",
          ),
          defaultEnd,
        ),
      );

    if (
      end < start
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "End date cannot be before start date.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const rangeMs =
      end.getTime() -
      start.getTime();

    const rangeDays =
      Math.floor(
        rangeMs /
          86_400_000,
      ) + 1;

    if (
      rangeDays >
      MAXIMUM_RANGE_DAYS
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Date range cannot exceed ${MAXIMUM_RANGE_DAYS} days.`,
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const previousEnd =
      new Date(
        start.getTime() -
          1,
      );

    const previousStart =
      new Date(
        previousEnd.getTime() -
          rangeDays *
            86_400_000 +
          1,
      );

    const [
      current,
      previous,
    ] = await Promise.all([
      loadPeriod(
        start,
        end,
      ),

      loadPeriod(
        previousStart,
        previousEnd,
      ),
    ]);

    const dailyRevenue =
      buildDailyRevenue(
        start,
        end,
        current.paidOrders,
        current.refundedOrders,
      );

    const topPlans =
      buildTopPlans(
        current.paidOrders,
      );

    const paymentMethods =
      buildPaymentMethods(
        current.paidOrders,
      );

    const orderRows =
      current.paidOrders.map(
        (order) => ({
          referenceNumber:
            order.referenceNumber,

          planName:
            order.planName,

          packageCode:
            order.packageCode,

          customerEmail:
            order.customerEmail,

          amountPhpCentavos:
            order.amountPhpCentavos,

          discountPhpCentavos:
            order.discountPhpCentavos,

          storeCreditUsedPhpCentavos:
            order.storeCreditUsedPhpCentavos,

          paymentMethod:
            order.paymentMethod,

          status:
            order.status,

          esimStatus:
            order.esimStatus,

          paidAt:
            order.paidAt
              ?.toISOString() ??
            null,

          completedAt:
            order.completedAt
              ?.toISOString() ??
            null,
        }),
      );

    return NextResponse.json(
      {
        success: true,

        period: {
          start:
            start.toISOString(),
          end:
            end.toISOString(),
          rangeDays,

          previousStart:
            previousStart.toISOString(),

          previousEnd:
            previousEnd.toISOString(),
        },

        summary: {
          ...current.summary,

          changes: {
            grossRevenuePercent:
              percentageChange(
                current.summary
                  .grossRevenuePhpCentavos,

                previous.summary
                  .grossRevenuePhpCentavos,
              ),

            netRevenuePercent:
              percentageChange(
                current.summary
                  .netRevenuePhpCentavos,

                previous.summary
                  .netRevenuePhpCentavos,
              ),

            paidOrdersPercent:
              percentageChange(
                current.summary
                  .paidOrders,

                previous.summary
                  .paidOrders,
              ),

            completedSalesPercent:
              percentageChange(
                current.summary
                  .completedSales,

                previous.summary
                  .completedSales,
              ),
          },
        },

        dailyRevenue,
        topPlans,
        paymentMethods,
        orderRows,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN REPORTS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load sales reports.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}