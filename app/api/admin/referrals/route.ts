import {
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAXIMUM_PAGE_SIZE = 100;

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "QUALIFIED"
  | "REWARDED"
  | "CANCELLED";

type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "REWARDED_FIRST"
  | "HIGHEST_REWARD";

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

function getConfiguredAdminKey() {
  return (
    process.env.ADMIN_API_KEY?.trim() ||
    ""
  );
}

function isAuthorized(
  request: Request,
) {
  const configuredKey =
    getConfiguredAdminKey();

  const suppliedKey =
    request.headers
      .get("x-admin-key")
      ?.trim() ?? "";

  if (
    !configuredKey ||
    !suppliedKey
  ) {
    return false;
  }

  return secureCompare(
    suppliedKey,
    configuredKey,
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

function normalizeStatus(
  value: string | null,
): StatusFilter {
  switch (
    value
      ?.trim()
      .toUpperCase()
  ) {
    case "PENDING":
      return "PENDING";
    case "QUALIFIED":
      return "QUALIFIED";
    case "REWARDED":
      return "REWARDED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "ALL";
  }
}

function normalizeSort(
  value: string | null,
): SortOption {
  switch (
    value
      ?.trim()
      .toUpperCase()
  ) {
    case "OLDEST":
      return "OLDEST";
    case "REWARDED_FIRST":
      return "REWARDED_FIRST";
    case "HIGHEST_REWARD":
      return "HIGHEST_REWARD";
    default:
      return "NEWEST";
  }
}

function getOrderBy(
  sort: SortOption,
) {
  switch (sort) {
    case "OLDEST":
      return [
        {
          createdAt:
            "asc" as const,
        },
      ];

    case "REWARDED_FIRST":
      return [
        {
          rewardedAt:
            "desc" as const,
        },
        {
          createdAt:
            "desc" as const,
        },
      ];

    case "HIGHEST_REWARD":
      return [
        {
          referrerRewardPhpCentavos:
            "desc" as const,
        },
        {
          createdAt:
            "desc" as const,
        },
      ];

    default:
      return [
        {
          createdAt:
            "desc" as const,
        },
      ];
  }
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

    const search =
      url.searchParams
        .get("search")
        ?.trim() ?? "";

    const status =
      normalizeStatus(
        url.searchParams.get(
          "status",
        ),
      );

    const sort =
      normalizeSort(
        url.searchParams.get(
          "sort",
        ),
      );

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

    const where = {
      ...(status !== "ALL"
        ? {
            status,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                referralCode: {
                  contains:
                    search,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                referrer: {
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
              {
                referredUser: {
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
              {
                qualifyingOrder: {
                  is: {
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
                        planName: {
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

    const total =
      await prisma.referral.count({
        where,
      });

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

    const [
      referrals,
      groupedStatuses,
      rewardTotals,
      leaderboard,
    ] = await Promise.all([
      prisma.referral.findMany({
        where,
        orderBy:
          getOrderBy(sort),
        skip:
          (page - 1) *
          pageSize,
        take:
          pageSize,

        select: {
          id: true,
          referralCode: true,
          status: true,
          referrerRewardPhpCentavos:
            true,
          referredRewardPhpCentavos:
            true,
          qualifiedAt: true,
          rewardedAt: true,
          cancelledAt: true,
          createdAt: true,
          updatedAt: true,

          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
              referralCode:
                true,
            },
          },

          referredUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          qualifyingOrder: {
            select: {
              id: true,
              referenceNumber:
                true,
              planName: true,
              dataVolumeBytes:
                true,
              status: true,
              paymentStatus:
                true,
              esimStatus: true,
              completedAt: true,
            },
          },

          storeCreditTransactions: {
            where: {
              type:
                "REFERRAL_REWARD",
            },
            orderBy: {
              createdAt:
                "asc",
            },
            select: {
              id: true,
              userId: true,
              amountPhpCentavos:
                true,
              balanceBeforePhpCentavos:
                true,
              balanceAfterPhpCentavos:
                true,
              description: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),

      prisma.referral.groupBy({
        by: [
          "status",
        ],
        _count: {
          _all: true,
        },
      }),

      prisma.storeCreditTransaction.aggregate({
        where: {
          type:
            "REFERRAL_REWARD",
        },
        _sum: {
          amountPhpCentavos:
            true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.user.findMany({
        where: {
          role:
            "CUSTOMER",
          referralsCreated: {
            some: {},
          },
        },
        orderBy: {
          referralsCreated: {
            _count:
              "desc",
          },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
          _count: {
            select: {
              referralsCreated:
                true,
            },
          },
          referralsCreated: {
            select: {
              status: true,
              referrerRewardPhpCentavos:
                true,
            },
          },
        },
      }),
    ]);

    const countByStatus =
      new Map(
        groupedStatuses.map(
          (item) => [
            item.status,
            item._count._all,
          ],
        ),
      );

    const totalReferrals =
      Array.from(
        countByStatus.values(),
      ).reduce(
        (
          totalCount,
          count,
        ) =>
          totalCount +
          count,
        0,
      );

    return NextResponse.json(
      {
        success: true,

        summary: {
          totalReferrals,
          pending:
            countByStatus.get(
              "PENDING",
            ) ?? 0,
          qualified:
            countByStatus.get(
              "QUALIFIED",
            ) ?? 0,
          rewarded:
            countByStatus.get(
              "REWARDED",
            ) ?? 0,
          cancelled:
            countByStatus.get(
              "CANCELLED",
            ) ?? 0,
          totalRewardTransactions:
            rewardTotals._count.id,
          totalRewardsIssuedPhpCentavos:
            rewardTotals._sum
              .amountPhpCentavos ??
            0,
        },

        leaderboard:
          leaderboard.map(
            (user) => {
              const rewardedReferrals =
                user.referralsCreated.filter(
                  (referral) =>
                    referral.status ===
                    "REWARDED",
                );

              const rewardsEarnedPhpCentavos =
                rewardedReferrals.reduce(
                  (
                    totalReward,
                    referral,
                  ) =>
                    totalReward +
                    referral
                      .referrerRewardPhpCentavos,
                  0,
                );

              return {
                id:
                  user.id,
                name:
                  user.name,
                email:
                  user.email,
                referralCode:
                  user.referralCode,
                totalReferrals:
                  user._count
                    .referralsCreated,
                rewardedReferrals:
                  rewardedReferrals.length,
                rewardsEarnedPhpCentavos,
              };
            },
          ),

        referrals:
          referrals.map(
            (referral) => ({
              id:
                referral.id,
              referralCode:
                referral.referralCode,
              status:
                referral.status,
              referrerRewardPhpCentavos:
                referral
                  .referrerRewardPhpCentavos,
              referredRewardPhpCentavos:
                referral
                  .referredRewardPhpCentavos,
              qualifiedAt:
                referral.qualifiedAt
                  ?.toISOString() ??
                null,
              rewardedAt:
                referral.rewardedAt
                  ?.toISOString() ??
                null,
              cancelledAt:
                referral.cancelledAt
                  ?.toISOString() ??
                null,
              createdAt:
                referral.createdAt.toISOString(),
              updatedAt:
                referral.updatedAt.toISOString(),
              referrer:
                referral.referrer,
              referredUser:
                referral.referredUser,
              qualifyingOrder:
                referral.qualifyingOrder
                  ? {
                      ...referral.qualifyingOrder,
                      dataVolumeBytes:
                        referral
                          .qualifyingOrder
                          .dataVolumeBytes
                          ?.toString() ??
                        null,
                      completedAt:
                        referral
                          .qualifyingOrder
                          .completedAt
                          ?.toISOString() ??
                        null,
                    }
                  : null,
              rewardTransactions:
                referral.storeCreditTransactions.map(
                  (transaction) => ({
                    id:
                      transaction.id,
                    userId:
                      transaction.userId,
                    amountPhpCentavos:
                      transaction
                        .amountPhpCentavos,
                    balanceBeforePhpCentavos:
                      transaction
                        .balanceBeforePhpCentavos,
                    balanceAfterPhpCentavos:
                      transaction
                        .balanceAfterPhpCentavos,
                    description:
                      transaction.description,
                    createdAt:
                      transaction.createdAt.toISOString(),
                    user:
                      transaction.user,
                  }),
                ),
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
      "ADMIN REFERRALS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load referral data.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}