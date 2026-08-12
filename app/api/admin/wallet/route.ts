import {
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { logAdminActivity } from "@/app/lib/adminActivity";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAXIMUM_PAGE_SIZE = 100;
const MAXIMUM_ADJUSTMENT_PHP_CENTAVOS =
  10_000_000;

type AdjustmentBody = {
  userId?: unknown;
  direction?: unknown;
  amountPhp?: unknown;
  reason?: unknown;
};

type BalanceFilter =
  | "all"
  | "positive"
  | "zero";

type SortOption =
  | "newest"
  | "highest"
  | "lowest"
  | "transactions";

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

  if (!configuredKey) {
    console.error(
      "ADMIN WALLET: ADMIN_API_KEY is missing.",
    );

    return false;
  }

  if (!suppliedKey) {
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

function normalizeString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function formatPhp(
  amountPhpCentavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    amountPhpCentavos / 100,
  );
}

function normalizeBalanceFilter(
  value: string | null,
): BalanceFilter {
  switch (
    value
      ?.trim()
      .toLowerCase()
  ) {
    case "positive":
      return "positive";

    case "zero":
      return "zero";

    default:
      return "all";
  }
}

function normalizeSortOption(
  value: string | null,
): SortOption {
  switch (
    value
      ?.trim()
      .toLowerCase()
  ) {
    case "highest":
      return "highest";

    case "lowest":
      return "lowest";

    case "transactions":
      return "transactions";

    default:
      return "newest";
  }
}

function getOrderBy(
  sort: SortOption,
) {
  switch (sort) {
    case "highest":
      return [
        {
          storeCreditPhpCentavos:
            "desc" as const,
        },
        {
          createdAt:
            "desc" as const,
        },
      ];

    case "lowest":
      return [
        {
          storeCreditPhpCentavos:
            "asc" as const,
        },
        {
          createdAt:
            "desc" as const,
        },
      ];

    case "transactions":
      return [
        {
          storeCreditTransactions: {
            _count:
              "desc" as const,
          },
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

function serializeTransaction(
  transaction: {
    id: string;
    type: string;
    amountPhpCentavos: number;
    balanceBeforePhpCentavos: number;
    balanceAfterPhpCentavos: number;
    description: string | null;
    createdAt: Date;
    order: {
      referenceNumber: string;
      planName: string;
    } | null;
    referral: {
      referralCode: string;
    } | null;
  },
) {
  return {
    id:
      transaction.id,

    type:
      transaction.type,

    amountPhpCentavos:
      transaction.amountPhpCentavos,

    balanceBeforePhpCentavos:
      transaction.balanceBeforePhpCentavos,

    balanceAfterPhpCentavos:
      transaction.balanceAfterPhpCentavos,

    description:
      transaction.description,

    createdAt:
      transaction.createdAt.toISOString(),

    order:
      transaction.order,

    referral:
      transaction.referral,
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

    const search =
      url.searchParams
        .get("search")
        ?.trim() ?? "";

    const balance =
      normalizeBalanceFilter(
        url.searchParams.get(
          "balance",
        ),
      );

    const sort =
      normalizeSortOption(
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
      role:
        "CUSTOMER" as const,

      ...(balance ===
      "positive"
        ? {
            storeCreditPhpCentavos: {
              gt: 0,
            },
          }
        : balance ===
            "zero"
          ? {
              storeCreditPhpCentavos:
                0,
            }
          : {}),

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
                referralCode: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const total =
      await prisma.user.count({
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
      customers,
      totals,
      customersWithCredit,
    ] = await Promise.all([
      prisma.user.findMany({
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
          name: true,
          email: true,
          referralCode: true,
          storeCreditPhpCentavos:
            true,
          createdAt: true,

          _count: {
            select: {
              orders: true,
              referralsCreated:
                true,
              storeCreditTransactions:
                true,
            },
          },

          storeCreditTransactions: {
            orderBy: {
              createdAt:
                "desc",
            },

            take: 8,

            select: {
              id: true,
              type: true,
              amountPhpCentavos:
                true,
              balanceBeforePhpCentavos:
                true,
              balanceAfterPhpCentavos:
                true,
              description: true,
              createdAt: true,

              order: {
                select: {
                  referenceNumber:
                    true,
                  planName:
                    true,
                },
              },

              referral: {
                select: {
                  referralCode:
                    true,
                },
              },
            },
          },
        },
      }),

      prisma.user.aggregate({
        where: {
          role:
            "CUSTOMER",
        },

        _sum: {
          storeCreditPhpCentavos:
            true,
        },

        _count: {
          id: true,
        },
      }),

      prisma.user.count({
        where: {
          role:
            "CUSTOMER",

          storeCreditPhpCentavos: {
            gt: 0,
          },
        },
      }),
    ]);

    const totalCustomers =
      totals._count.id;

    const totalOutstandingPhpCentavos =
      totals._sum
        .storeCreditPhpCentavos ??
      0;

    return NextResponse.json(
      {
        success: true,

        filters: {
          search,
          balance,
          sort,
        },

        summary: {
          totalCustomers,

          customersWithCredit,

          zeroBalanceCustomers:
            Math.max(
              0,
              totalCustomers -
                customersWithCredit,
            ),

          totalOutstandingPhpCentavos,

          averageBalancePhpCentavos:
            totalCustomers > 0
              ? Math.round(
                  totalOutstandingPhpCentavos /
                    totalCustomers,
                )
              : 0,
        },

        customers:
          customers.map(
            (customer) => ({
              id:
                customer.id,

              name:
                customer.name,

              email:
                customer.email,

              referralCode:
                customer.referralCode,

              storeCreditPhpCentavos:
                customer.storeCreditPhpCentavos,

              createdAt:
                customer.createdAt.toISOString(),

              counts: {
                orders:
                  customer._count.orders,

                referrals:
                  customer._count
                    .referralsCreated,

                transactions:
                  customer._count
                    .storeCreditTransactions,
              },

              recentTransactions:
                customer
                  .storeCreditTransactions
                  .map(
                    serializeTransaction,
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
      "ADMIN WALLET GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load customer wallets.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

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
          "Admin session required.",
      },
      {
        status: 401,
        headers:
          noStoreHeaders(),
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        AdjustmentBody;

    const userId =
      normalizeString(
        body.userId,
      );

    const direction =
      normalizeString(
        body.direction,
      ).toUpperCase();

    const reason =
      normalizeString(
        body.reason,
      );

    const amountPhp =
      typeof body.amountPhp ===
      "number"
        ? body.amountPhp
        : Number(
            normalizeString(
              body.amountPhp,
            ),
          );

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer is required.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      direction !== "ADD" &&
      direction !== "DEDUCT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Choose ADD or DEDUCT.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !Number.isFinite(
        amountPhp,
      ) ||
      amountPhp <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid positive amount.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const amountPhpCentavos =
      Math.round(
        amountPhp * 100,
      );

    if (
      amountPhpCentavos <= 0 ||
      amountPhpCentavos >
        MAXIMUM_ADJUSTMENT_PHP_CENTAVOS
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The adjustment amount is outside the allowed range.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      reason.length < 5 ||
      reason.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a reason between 5 and 500 characters.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const signedAmount =
      direction === "ADD"
        ? amountPhpCentavos
        : -amountPhpCentavos;

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const customer =
            await transaction.user.findUnique({
              where: {
                id:
                  userId,
              },

              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                storeCreditPhpCentavos:
                  true,
              },
            });

          if (
            !customer ||
            customer.role !==
              "CUSTOMER"
          ) {
            throw new Error(
              "CUSTOMER_NOT_FOUND",
            );
          }

          const balanceBefore =
            customer
              .storeCreditPhpCentavos;

          const balanceAfter =
            balanceBefore +
            signedAmount;

          if (balanceAfter < 0) {
            throw new Error(
              "INSUFFICIENT_BALANCE",
            );
          }

          const updated =
            await transaction.user.updateMany({
              where: {
                id:
                  customer.id,

                storeCreditPhpCentavos:
                  balanceBefore,
              },

              data: {
                storeCreditPhpCentavos:
                  balanceAfter,
              },
            });

          if (
            updated.count !== 1
          ) {
            throw new Error(
              "BALANCE_CHANGED",
            );
          }

          const ledgerEntry =
            await transaction
              .storeCreditTransaction
              .create({
                data: {
                  userId:
                    customer.id,

                  type:
                    "MANUAL_ADJUSTMENT",

                  amountPhpCentavos:
                    signedAmount,

                  balanceBeforePhpCentavos:
                    balanceBefore,

                  balanceAfterPhpCentavos:
                    balanceAfter,

                  description:
                    `Admin ${direction === "ADD" ? "credit" : "debit"}: ${reason}`,
                },

                select: {
                  id: true,
                  type: true,
                  amountPhpCentavos:
                    true,
                  balanceBeforePhpCentavos:
                    true,
                  balanceAfterPhpCentavos:
                    true,
                  description: true,
                  createdAt: true,

                  order: {
                    select: {
                      referenceNumber:
                        true,
                      planName:
                        true,
                    },
                  },

                  referral: {
                    select: {
                      referralCode:
                        true,
                    },
                  },
                },
              });

          return {
            customer: {
              id:
                customer.id,

              name:
                customer.name,

              email:
                customer.email,

              storeCreditPhpCentavos:
                balanceAfter,
            },

            transaction:
              serializeTransaction(
                ledgerEntry,
              ),

            audit: {
              balanceBeforePhpCentavos:
                balanceBefore,

              balanceAfterPhpCentavos:
                balanceAfter,

              signedAmountPhpCentavos:
                signedAmount,

              reason,
            },
          };
        },
        {
          isolationLevel:
            "Serializable",
        },
      );

    await logAdminActivity({
      adminId:
        session.user.id,

      action:
        direction === "ADD"
          ? "WALLET_CREDIT_ADDED"
          : "WALLET_CREDIT_DEDUCTED",

      module:
        "WALLET",

      entityType:
        "User",

      entityId:
        result.customer.id,

      description:
        direction === "ADD"
          ? `Added ${formatPhp(
              amountPhpCentavos,
            )} wallet credit to ${result.customer.email}. Reason: ${reason}`
          : `Deducted ${formatPhp(
              amountPhpCentavos,
            )} wallet credit from ${result.customer.email}. Reason: ${reason}`,

      oldValue: {
        balancePhpCentavos:
          result.audit
            .balanceBeforePhpCentavos,
      },

      newValue: {
        balancePhpCentavos:
          result.audit
            .balanceAfterPhpCentavos,

        adjustmentPhpCentavos:
          result.audit
            .signedAmountPhpCentavos,

        reason:
          result.audit.reason,
      },

      success:
        true,
    });

    return NextResponse.json(
      {
        success: true,

        message:
          direction === "ADD"
            ? "Credit added successfully."
            : "Credit deducted successfully.",

        ...result,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    await logAdminActivity({
      adminId:
        session.user.id,

      action:
        "WALLET_ADJUSTMENT_FAILED",

      module:
        "WALLET",

      description:
        "A manual wallet adjustment failed.",

      success:
        false,

      errorMessage:
        message ||
        "Unknown wallet adjustment error.",
    });

    if (
      message ===
      "CUSTOMER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      message ===
      "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The customer does not have enough credit for this deduction.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      message ===
      "BALANCE_CHANGED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The wallet balance changed. Refresh and try again.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    console.error(
      "ADMIN WALLET POST ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update the customer wallet.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}