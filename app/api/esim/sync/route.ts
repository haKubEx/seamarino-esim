import {
  randomUUID,
  timingSafeEqual,
} from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

import {
  queryEsimProfiles,
  type EsimProfile,
} from "@/app/services/esimQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ORDERS_PER_RUN = 10;
const PROFILE_POLL_COOLDOWN_MS = 15_000;
const PROFILE_SYNC_LEASE_MS = 45_000;
const MAX_STORED_RESPONSE_LENGTH = 20_000;
const MAX_ERROR_MESSAGE_LENGTH = 1_500;

type SyncResultStatus =
  | "ISSUED"
  | "PENDING"
  | "TERMINAL"
  | "SKIPPED"
  | "FAILED";

type SyncResult = {
  orderId: string;
  referenceNumber: string;
  result: SyncResultStatus;
  message?: string;
};

type SyncCandidate = {
  id: string;
  referenceNumber: string;
  esimOrderId: string | null;
  profileLastCheckedAt: Date | null;
  profileSyncLeaseUntil: Date | null;
};

type ActivationDetails = {
  activationCode: string;
  smdpAddress: string | null;
  matchingId: string | null;
};

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers
      .get("authorization")
      ?.trim();

  if (!authorization) {
    return null;
  }

  const match =
    /^Bearer\s+(.+)$/i.exec(
      authorization,
    );

  const token =
    match?.[1]?.trim();

  return token || null;
}

function secureCompare(
  left: string,
  right: string,
): boolean {
  const leftBuffer =
    Buffer.from(left, "utf8");

  const rightBuffer =
    Buffer.from(right, "utf8");

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
): boolean {
  const configuredSecret =
    process.env
      .FULFILLMENT_SECRET
      ?.trim();

  if (!configuredSecret) {
    console.error(
      "ESIM SYNC: FULFILLMENT_SECRET is missing.",
    );

    return false;
  }

  const bearerToken =
    getBearerToken(request);

  if (!bearerToken) {
    return false;
  }

  return secureCompare(
    bearerToken,
    configuredSecret,
  );
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      MAX_ERROR_MESSAGE_LENGTH,
    );
  }

  return "Unknown eSIM profile query error.";
}

function normalizeOptionalValue(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function safeSerialize(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
    ).slice(
      0,
      MAX_STORED_RESPONSE_LENGTH,
    );
  } catch {
    return JSON.stringify({
      error:
        "The supplier response could not be serialized.",
    });
  }
}

function parseActivationCode(
  value:
    | string
    | null
    | undefined,
): ActivationDetails | null {
  const activationCode =
    normalizeOptionalValue(value);

  if (!activationCode) {
    return null;
  }

  const parts =
    activationCode.split("$");

  const prefix =
    parts[0]?.trim().toUpperCase();

  if (
    prefix !== "LPA:1" ||
    parts.length < 3
  ) {
    return {
      activationCode,
      smdpAddress: null,
      matchingId: null,
    };
  }

  return {
    activationCode,

    smdpAddress:
      normalizeOptionalValue(
        parts[1],
      ),

    matchingId:
      normalizeOptionalValue(
        parts.slice(2).join("$"),
      ),
  };
}

function createBaseResult(
  order: SyncCandidate,
): SyncResult {
  return {
    orderId:
      order.id,

    referenceNumber:
      order.referenceNumber,

    result:
      "PENDING",
  };
}

async function claimOrder({
  order,
  claimId,
}: {
  order: SyncCandidate;
  claimId: string;
}): Promise<boolean> {
  const now =
    new Date();

  const leaseUntil =
    new Date(
      now.getTime() +
        PROFILE_SYNC_LEASE_MS,
    );

  const claimResult =
    await prisma.order.updateMany({
      where: {
        id:
          order.id,

        paymentStatus:
          "PAID",

        status:
          "PROCESSING",

        esimStatus:
          "PROCESSING",

        esimOrderId:
          order.esimOrderId,

        OR: [
          {
            profileSyncLeaseUntil:
              null,
          },
          {
            profileSyncLeaseUntil: {
              lte: now,
            },
          },
        ],
      },

      data: {
        profileSyncClaimId:
          claimId,

        profileSyncClaimedAt:
          now,

        profileSyncLeaseUntil:
          leaseUntil,

        profileLastCheckedAt:
          now,

        profileCheckAttempts: {
          increment: 1,
        },

        lastError:
          null,
      },
    });

  return claimResult.count === 1;
}

async function releaseClaim({
  orderId,
  claimId,
}: {
  orderId: string;
  claimId: string;
}): Promise<void> {
  await prisma.order.updateMany({
    where: {
      id:
        orderId,

      profileSyncClaimId:
        claimId,
    },

    data: {
      profileSyncClaimId:
        null,

      profileSyncClaimedAt:
        null,

      profileSyncLeaseUntil:
        null,
    },
  });
}

async function savePendingResult({
  order,
  claimId,
  rawResponse,
  errorMessage,
}: {
  order: SyncCandidate;
  claimId: string;
  rawResponse: unknown;
  errorMessage: string | null;
}): Promise<boolean> {
  const updateResult =
    await prisma.order.updateMany({
      where: {
        id:
          order.id,

        paymentStatus:
          "PAID",

        status:
          "PROCESSING",

        esimStatus:
          "PROCESSING",

        profileSyncClaimId:
          claimId,
      },

      data: {
        status:
          "PROCESSING",

        paymentStatus:
          "PAID",

        esimStatus:
          "PROCESSING",

        esimRawResponse:
          safeSerialize(
            rawResponse,
          ),

        lastError:
          errorMessage,

        profileLastCheckedAt:
          new Date(),

        profileSyncClaimId:
          null,

        profileSyncClaimedAt:
          null,

        profileSyncLeaseUntil:
          null,
      },
    });

  return updateResult.count === 1;
}

async function saveTerminalResult({
  order,
  claimId,
  rawResponse,
  message,
}: {
  order: SyncCandidate;
  claimId: string;
  rawResponse: unknown;
  message: string;
}): Promise<boolean> {
  const updateResult =
    await prisma.order.updateMany({
      where: {
        id:
          order.id,

        paymentStatus:
          "PAID",

        status:
          "PROCESSING",

        esimStatus:
          "PROCESSING",

        profileSyncClaimId:
          claimId,
      },

      data: {
        status:
          "FAILED",

        paymentStatus:
          "PAID",

        esimStatus:
          "FAILED",

        esimRawResponse:
          safeSerialize(
            rawResponse,
          ),

        lastError:
          message,

        profileLastCheckedAt:
          new Date(),

        profileSyncClaimId:
          null,

        profileSyncClaimedAt:
          null,

        profileSyncLeaseUntil:
          null,
      },
    });

  return updateResult.count === 1;
}

async function saveIssuedProfile({
  order,
  claimId,
  profile,
}: {
  order: SyncCandidate;
  claimId: string;
  profile: EsimProfile;
}): Promise<boolean> {
  const activationDetails =
    parseActivationCode(
      profile.ac,
    );

  const qrCodeUrl =
    normalizeOptionalValue(
      profile.qrCodeUrl,
    );

  const iccid =
    normalizeOptionalValue(
      profile.iccid,
    );

  if (
    !activationDetails ||
    !qrCodeUrl ||
    !iccid
  ) {
    return false;
  }

  const now =
    new Date();

  const updateResult =
    await prisma.order.updateMany({
      where: {
        id:
          order.id,

        paymentStatus:
          "PAID",

        status:
          "PROCESSING",

        esimStatus:
          "PROCESSING",

        esimOrderId:
          order.esimOrderId,

        profileSyncClaimId:
          claimId,
      },

      data: {
        status:
          "PROCESSING",

        paymentStatus:
          "PAID",

        esimStatus:
          "ISSUED",

        esimTranNo:
          normalizeOptionalValue(
            profile.esimTranNo,
          ),

        iccid,

        activationCode:
          activationDetails
            .activationCode,

        qrCodeUrl,

        smdpAddress:
          activationDetails
            .smdpAddress,

        matchingId:
          activationDetails
            .matchingId,

        smdpStatus:
          normalizeOptionalValue(
            profile.smdpStatus,
          ),

        supplierEsimStatus:
          normalizeOptionalValue(
            profile.esimStatus,
          ),

        apn:
          normalizeOptionalValue(
            profile.apn,
          ),

        profileIssuedAt:
          now,

        esimIssuedAt:
          now,

        profileLastCheckedAt:
          now,

        esimRawResponse:
          safeSerialize(
            profile,
          ),

        emailDeliveryStatus:
          "PENDING",

        profileSyncClaimId:
          null,

        profileSyncClaimedAt:
          null,

        profileSyncLeaseUntil:
          null,

        lastError:
          null,
      },
    });

  return updateResult.count === 1;
}

async function syncOrder(
  order: SyncCandidate,
): Promise<SyncResult> {
  const baseResult =
    createBaseResult(order);

  if (!order.esimOrderId) {
    return {
      ...baseResult,

      result:
        "SKIPPED",

      message:
        "Supplier order number is missing.",
    };
  }

  const claimId =
    randomUUID();

  const claimed =
    await claimOrder({
      order,
      claimId,
    });

  if (!claimed) {
    return {
      ...baseResult,

      result:
        "SKIPPED",

      message:
        "The order is already being synchronized by another worker.",
    };
  }

  try {
    const queryResult =
      await queryEsimProfiles(
        order.esimOrderId,
      );

    if (
      queryResult.terminal
    ) {
      const terminalMessage =
        queryResult.statusMessage ||
        "The supplier profile entered a terminal state.";

      await saveTerminalResult({
        order,
        claimId,

        rawResponse:
          queryResult.rawResponse,

        message:
          terminalMessage,
      });

      console.error(
        "ESIM PROFILE ENTERED TERMINAL STATE:",
        {
          orderId:
            order.id,

          referenceNumber:
            order.referenceNumber,

          supplierOrderNo:
            order.esimOrderId,

          errorCode:
            queryResult.errorCode,

          esimStatus:
            queryResult
              .primaryProfile
              ?.esimStatus,

          smdpStatus:
            queryResult
              .primaryProfile
              ?.smdpStatus,

          message:
            terminalMessage,
        },
      );

      return {
        ...baseResult,

        result:
          "TERMINAL",

        message:
          terminalMessage,
      };
    }

    if (
      queryResult.pending ||
      !queryResult.ready ||
      !queryResult.primaryProfile
    ) {
      const pendingMessage =
        queryResult.statusMessage ||
        "The supplier is still allocating the eSIM profile.";

      await savePendingResult({
        order,
        claimId,

        rawResponse:
          queryResult.rawResponse,

        errorMessage:
          queryResult.errorCode
            ? pendingMessage
            : null,
      });

      return {
        ...baseResult,

        result:
          "PENDING",

        message:
          pendingMessage,
      };
    }

    const profile =
      queryResult.primaryProfile;

    const activationDetails =
      parseActivationCode(
        profile.ac,
      );

    const qrCodeUrl =
      normalizeOptionalValue(
        profile.qrCodeUrl,
      );

    const iccid =
      normalizeOptionalValue(
        profile.iccid,
      );

    if (
      !activationDetails ||
      !qrCodeUrl ||
      !iccid
    ) {
      const incompleteMessage =
        "The supplier returned a profile without complete ICCID, activation-code, or QR-code details.";

      await savePendingResult({
        order,
        claimId,

        rawResponse:
          queryResult.rawResponse,

        errorMessage:
          incompleteMessage,
      });

      return {
        ...baseResult,

        result:
          "PENDING",

        message:
          incompleteMessage,
      };
    }

    const profileWasSaved =
      await saveIssuedProfile({
        order,
        claimId,
        profile,
      });

    if (!profileWasSaved) {
      await releaseClaim({
        orderId:
          order.id,

        claimId,
      });

      return {
        ...baseResult,

        result:
          "SKIPPED",

        message:
          "The order was already issued, delivered, or changed by another worker.",
      };
    }

    console.info(
      "ESIM PROFILE ISSUED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        supplierOrderNo:
          order.esimOrderId,

        esimTranNo:
          profile.esimTranNo,

        iccid:
          profile.iccid,

        smdpAddress:
          activationDetails
            .smdpAddress,

        matchingIdPresent:
          Boolean(
            activationDetails
              .matchingId,
          ),

        esimStatus:
          profile.esimStatus,

        smdpStatus:
          profile.smdpStatus,
      },
    );

    return {
      ...baseResult,

      result:
        "ISSUED",

      message:
        "The eSIM profile and installation details were saved.",
    };
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "ESIM PROFILE SYNC FAILED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        supplierOrderNo:
          order.esimOrderId,

        claimId,

        error:
          errorMessage,
      },
    );

    const failureSaved =
      await savePendingResult({
        order,
        claimId,

        rawResponse: {
          error:
            errorMessage,
        },

        errorMessage,
      });

    if (!failureSaved) {
      await releaseClaim({
        orderId:
          order.id,

        claimId,
      });
    }

    return {
      ...baseResult,

      result:
        "FAILED",

      message:
        errorMessage,
    };
  }
}

async function runProfileSync() {
  const now =
    new Date();

  const pollBefore =
    new Date(
      now.getTime() -
        PROFILE_POLL_COOLDOWN_MS,
    );

  const orders =
    await prisma.order.findMany({
      where: {
        paymentStatus:
          "PAID",

        status:
          "PROCESSING",

        esimStatus:
          "PROCESSING",

        esimOrderId: {
          not: null,
        },

        AND: [
          {
            OR: [
              {
                profileLastCheckedAt:
                  null,
              },
              {
                profileLastCheckedAt: {
                  lte:
                    pollBefore,
                },
              },
            ],
          },
          {
            OR: [
              {
                profileSyncLeaseUntil:
                  null,
              },
              {
                profileSyncLeaseUntil: {
                  lte: now,
                },
              },
            ],
          },
        ],
      },

      select: {
        id:
          true,

        referenceNumber:
          true,

        esimOrderId:
          true,

        profileLastCheckedAt:
          true,

        profileSyncLeaseUntil:
          true,
      },

      orderBy: [
        {
          profileLastCheckedAt:
            "asc",
        },
        {
          createdAt:
            "asc",
        },
      ],

      take:
        MAX_ORDERS_PER_RUN,
    });

  const results:
    SyncResult[] = [];

  for (const order of orders) {
    const result =
      await syncOrder(order);

    results.push(result);
  }

  return {
    checked:
      orders.length,

    issued:
      results.filter(
        (item) =>
          item.result ===
          "ISSUED",
      ).length,

    pending:
      results.filter(
        (item) =>
          item.result ===
          "PENDING",
      ).length,

    terminal:
      results.filter(
        (item) =>
          item.result ===
          "TERMINAL",
      ).length,

    failed:
      results.filter(
        (item) =>
          item.result ===
          "FAILED",
      ).length,

    skipped:
      results.filter(
        (item) =>
          item.result ===
          "SKIPPED",
      ).length,

    results,
  };
}

export async function POST(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      {
        status: 401,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  try {
    const summary =
      await runProfileSync();

    return NextResponse.json(
      {
        success: true,
        ...summary,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "ESIM SYNC ROUTE ERROR:",
      {
        error:
          errorMessage,
      },
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage,
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,

      message:
        "Use an authorized POST request to synchronize processing eSIM orders.",
    },
    {
      status: 405,

      headers: {
        Allow: "POST",

        "Cache-Control":
          "no-store",
      },
    },
  );
}