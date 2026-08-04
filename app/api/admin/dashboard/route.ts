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

function getStartOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}

function getStartOfDay(
  value: Date,
) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function getDateKey(
  value: Date,
) {
  const year =
    value.getFullYear();

  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createRevenueDays(
  numberOfDays: number,
) {
  const today =
    getStartOfToday();

  return Array.from(
    {
      length: numberOfDays,
    },
    (_, index) => {
      const date =
        new Date(today);

      date.setDate(
        today.getDate() -
          (numberOfDays - 1 - index),
      );

      return {
        date,
        dateKey:
          getDateKey(date),
        revenueCentavos: 0,
        orderCount: 0,
      };
    },
  );
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

    const startOfToday =
      getStartOfToday();

    const chartStartDate =
      new Date(startOfToday);

    chartStartDate.setDate(
      chartStartDate.getDate() -
        29,
    );

    const [
      todayOrders,
      pendingOrders,
      completedOrders,
      deliveredEsims,
      totalCustomers,
      recentOrders,
      chartOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },

        select: {
          amountPhpCentavos: true,
          paymentStatus: true,
        },
      }),

      prisma.order.count({
        where: {
          OR: [
            {
              status: "PENDING",
            },
            {
              paymentStatus:
                "PENDING",
            },
            {
              esimStatus:
                "NOT_ORDERED",
            },
            {
              esimStatus:
                "PROCESSING",
            },
          ],
        },
      }),

      prisma.order.count({
        where: {
          status: "COMPLETED",
        },
      }),

      prisma.order.count({
        where: {
          esimStatus:
            "DELIVERED",
        },
      }),

      prisma.user.count(),

      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: 8,

        select: {
          id: true,
          referenceNumber: true,
          customerName: true,
          customerEmail: true,
          planName: true,
          packageCode: true,
          amountPhpCentavos: true,
          paymentStatus: true,
          esimStatus: true,
          status: true,
          createdAt: true,
        },
      }),

      prisma.order.findMany({
        where: {
          paymentStatus: "PAID",

          paidAt: {
            gte:
              chartStartDate,
          },
        },

        select: {
          paidAt: true,
          amountPhpCentavos: true,
        },
      }),
    ]);

    const todayRevenueCentavos =
      todayOrders.reduce(
        (total, order) => {
          if (
            order.paymentStatus !==
            "PAID"
          ) {
            return total;
          }

          return (
            total +
            order.amountPhpCentavos
          );
        },
        0,
      );

    const revenueDays =
      createRevenueDays(30);

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

      const paidDate =
        getStartOfDay(
          order.paidAt,
        );

      const dateKey =
        getDateKey(
          paidDate,
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

      revenueDay.orderCount += 1;
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

    return NextResponse.json(
      {
        success: true,

        stats: {
          todayRevenueCentavos,

          todayOrders:
            todayOrders.length,

          pendingOrders,
          completedOrders,
          deliveredEsims,
          totalCustomers,
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
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load dashboard statistics.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}