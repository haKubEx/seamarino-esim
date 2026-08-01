import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const VALID_ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

type ValidOrderStatus =
  (typeof VALID_ORDER_STATUSES)[number];

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.ADMIN_API_KEY?.trim();

  const suppliedKey =
    request.headers.get("x-admin-key")?.trim();

  if (!configuredKey || !suppliedKey) {
    return false;
  }

  return suppliedKey === configuredKey;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function isValidOrderStatus(
  value: string,
): value is ValidOrderStatus {
  return VALID_ORDER_STATUSES.includes(
    value as ValidOrderStatus,
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(request.url);

    const search =
      url.searchParams.get("search")?.trim() ?? "";

    const rawStatus =
      url.searchParams
        .get("status")
        ?.trim()
        .toUpperCase() ?? "";

    const page = parsePositiveInteger(
      url.searchParams.get("page"),
      1,
    );

    const requestedPageSize =
      parsePositiveInteger(
        url.searchParams.get("pageSize"),
        DEFAULT_PAGE_SIZE,
      );

    const pageSize = Math.min(
      requestedPageSize,
      MAX_PAGE_SIZE,
    );

    const statusFilter =
      isValidOrderStatus(rawStatus)
        ? rawStatus
        : undefined;

    const where = {
      ...(statusFilter
        ? {
            status: statusFilter,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                referenceNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                customerName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                customerEmail: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                customerPhone: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                packageCode: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                planName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [orders, total] =
      await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
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

            esimOrderId: true,
            esimTranNo: true,
            iccid: true,
            qrCodeUrl: true,
            activationCode: true,
            smdpAddress: true,
            smdpStatus: true,
            supplierEsimStatus: true,
            apn: true,

            emailSent: true,
            emailSentAt: true,
            emailAttempts: true,

            processingAttempts: true,
            profileCheckAttempts: true,

            lastError: true,

            createdAt: true,
            updatedAt: true,
            completedAt: true,
          },
        }),

        prisma.order.count({
          where,
        }),
      ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(
          1,
          Math.ceil(total / pageSize),
        ),
      },
    });
  } catch (error) {
    console.error(
      "ADMIN ORDERS API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve orders.",
      },
      {
        status: 500,
      },
    );
  }
}