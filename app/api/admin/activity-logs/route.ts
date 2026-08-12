import {
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 25;
const MAXIMUM_PAGE_SIZE = 100;
const MAXIMUM_RANGE_DAYS = 366;

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const parsed =
    Number.parseInt(
      value ?? "",
      10,
    );

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : fallback;
}

function parseDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
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

export async function GET(
  request: Request,
) {
  const session =
    await auth();

  if (
    !session?.user?.id ||
    session.user.role !==
      "ADMIN"
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

  try {
    const url =
      new URL(request.url);

    const search =
      url.searchParams
        .get("search")
        ?.trim() ?? "";

    const moduleFilter =
      url.searchParams
        .get("module")
        ?.trim() ?? "";

    const actionFilter =
      url.searchParams
        .get("action")
        ?.trim() ?? "";

    const successFilter =
      url.searchParams
        .get("success")
        ?.trim()
        .toLowerCase() ?? "";

    const requestedPage =
      parsePositiveInteger(
        url.searchParams.get(
          "page",
        ),
        1,
      );

    const requestedPageSize =
      parsePositiveInteger(
        url.searchParams.get(
          "pageSize",
        ),
        DEFAULT_PAGE_SIZE,
      );

    const pageSize =
      Math.min(
        requestedPageSize,
        MAXIMUM_PAGE_SIZE,
      );

    const start =
      parseDate(
        url.searchParams.get(
          "start",
        ),
      );

    const end =
      parseDate(
        url.searchParams.get(
          "end",
        ),
      );

    if (
      start &&
      end &&
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

    if (
      start &&
      end
    ) {
      const rangeDays =
        Math.floor(
          (end.getTime() -
            start.getTime()) /
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
    }

    const where = {
      ...(moduleFilter
        ? {
            module: {
              equals:
                moduleFilter,

              mode:
                "insensitive" as const,
            },
          }
        : {}),

      ...(actionFilter
        ? {
            action: {
              contains:
                actionFilter,

              mode:
                "insensitive" as const,
            },
          }
        : {}),

      ...(successFilter ===
      "true"
        ? {
            success:
              true,
          }
        : successFilter ===
            "false"
          ? {
              success:
                false,
            }
          : {}),

      ...(start || end
        ? {
            createdAt: {
              ...(start
                ? {
                    gte:
                      startOfDay(
                        start,
                      ),
                  }
                : {}),

              ...(end
                ? {
                    lte:
                      endOfDay(
                        end,
                      ),
                  }
                : {}),
            },
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                description: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },

              {
                action: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },

              {
                module: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },

              {
                entityId: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },

              {
                entityType: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },

              {
                admin: {
                  is: {
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
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [
      total,
      groupedModules,
      groupedActions,
      todayCount,
      weekCount,
      failedCount,
    ] = await Promise.all([
      prisma.adminActivityLog.count({
        where,
      }),

      prisma.adminActivityLog.groupBy({
        by: [
          "module",
        ],

        _count: {
          _all: true,
        },

        orderBy: {
          _count: {
            module:
              "desc",
          },
        },
      }),

      prisma.adminActivityLog.groupBy({
        by: [
          "action",
        ],

        _count: {
          _all: true,
        },

        orderBy: {
          _count: {
            action:
              "desc",
          },
        },

        take: 50,
      }),

      prisma.adminActivityLog.count({
        where: {
          createdAt: {
            gte:
              startOfDay(
                new Date(),
              ),
          },
        },
      }),

      prisma.adminActivityLog.count({
        where: {
          createdAt: {
            gte:
              new Date(
                Date.now() -
                  7 *
                    86_400_000,
              ),
          },
        },
      }),

      prisma.adminActivityLog.count({
        where: {
          success:
            false,
        },
      }),
    ]);

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / pageSize,
        ),
      );

    const page =
      Math.min(
        requestedPage,
        totalPages,
      );

    const logs =
      await prisma.adminActivityLog.findMany({
        where,

        orderBy: {
          createdAt:
            "desc",
        },

        skip:
          (page - 1) *
          pageSize,

        take:
          pageSize,

        select: {
          id: true,
          action: true,
          module: true,
          entityId: true,
          entityType: true,
          description: true,
          oldValue: true,
          newValue: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          errorMessage: true,
          createdAt: true,

          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        summary: {
          totalEvents:
            await prisma.adminActivityLog.count(),

          todayEvents:
            todayCount,

          lastSevenDays:
            weekCount,

          failedEvents:
            failedCount,
        },

        filters: {
          modules:
            groupedModules.map(
              (item) => ({
                value:
                  item.module,

                count:
                  item._count._all,
              }),
            ),

          actions:
            groupedActions.map(
              (item) => ({
                value:
                  item.action,

                count:
                  item._count._all,
              }),
            ),
        },

        logs:
          logs.map(
            (log) => ({
              ...log,

              createdAt:
                log.createdAt.toISOString(),
            }),
          ),

        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasPreviousPage:
            page > 1,
          hasNextPage:
            page < totalPages,
        },
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN ACTIVITY LOG GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load activity logs.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}