import {
  randomUUID,
  timingSafeEqual,
} from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

import {
  sendEsimDeliveryEmail,
} from "@/app/services/esimEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_EMAILS_PER_RUN = 10;
const EMAIL_RETRY_COOLDOWN_MS = 120_000;
const EMAIL_DELIVERY_LEASE_MS = 45_000;
const MAX_ERROR_MESSAGE_LENGTH = 1_500;

type DeliveryResultStatus =
  | "SENT"
  | "SKIPPED"
  | "FAILED";

type DeliveryResult = {
  orderId: string;
  referenceNumber: string;
  customerEmail: string;
  result: DeliveryResultStatus;
  message?: string;
  emailId?: string;
};

type DeliveryCandidate = {
  id: string;
  referenceNumber: string;
  planName: string;
  customerName: string;
  customerEmail: string;

  iccid: string | null;
  activationCode: string | null;
  qrCodeUrl: string | null;
  apn: string | null;

  emailDeliveryStatus:
    | "NOT_READY"
    | "PENDING"
    | "SENDING"
    | "SENT"
    | "FAILED";

  emailSent: boolean;
  emailSentAt: Date | null;

  emailIdempotencyKey: string | null;
  resendEmailId: string | null;

  emailClaimId: string | null;
  emailLeaseUntil: Date | null;
  emailLastAttemptAt: Date | null;
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
      "ESIM DELIVERY: FULFILLMENT_SECRET is missing.",
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

  return "Unknown email-delivery error.";
}

function normalizeRequiredValue(
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

function createIdempotencyKey(
  orderId: string,
): string {
  const safeOrderId =
    orderId
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-",
      )
      .slice(0, 220);

  if (!safeOrderId) {
    throw new Error(
      "A delivery email idempotency key could not be created.",
    );
  }

  return `esim-delivery/${safeOrderId}`;
}

function createBaseResult(
  order: DeliveryCandidate,
): Omit<
  DeliveryResult,
  "result"
> {
  return {
    orderId:
      order.id,

    referenceNumber:
      order.referenceNumber,

    customerEmail:
      order.customerEmail,
  };
}

async function markIncompleteOrder({
  orderId,
  message,
}: {
  orderId: string;
  message: string;
}): Promise<void> {
  await prisma.order.updateMany({
    where: {
      id:
        orderId,

      emailSent:
        false,

      emailSentAt:
        null,

      emailDeliveryStatus: {
        in: [
          "PENDING",
          "FAILED",
        ],
      },
    },

    data: {
      emailDeliveryStatus:
        "FAILED",

      emailLastError:
        message,

      lastError:
        message,
    },
  });
}

async function claimOrderForEmail({
  order,
  claimId,
  idempotencyKey,
}: {
  order: DeliveryCandidate;
  claimId: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const now =
    new Date();

  const leaseUntil =
    new Date(
      now.getTime() +
        EMAIL_DELIVERY_LEASE_MS,
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
          "ISSUED",

        emailSent:
          false,

        emailSentAt:
          null,

        OR: [
          {
            emailDeliveryStatus: {
              in: [
                "PENDING",
                "FAILED",
              ],
            },
          },
          {
            emailDeliveryStatus:
              "SENDING",

            emailLeaseUntil: {
              lte: now,
            },
          },
        ],
      },

      data: {
        emailDeliveryStatus:
          "SENDING",

        emailClaimId:
          claimId,

        emailClaimedAt:
          now,

        emailLeaseUntil:
          leaseUntil,

        emailLastAttemptAt:
          now,

        emailAttempts: {
          increment: 1,
        },

        emailIdempotencyKey:
          idempotencyKey,

        emailLastError:
          null,

        lastError:
          null,
      },
    });

  return claimResult.count === 1;
}

async function markDeliveryCompleted({
  order,
  claimId,
  emailId,
  idempotencyKey,
}: {
  order: DeliveryCandidate;
  claimId: string;
  emailId: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const completedAt =
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
          "ISSUED",

        emailDeliveryStatus:
          "SENDING",

        emailClaimId:
          claimId,

        emailSent:
          false,

        emailSentAt:
          null,
      },

      data: {
        status:
          "COMPLETED",

        paymentStatus:
          "PAID",

        esimStatus:
          "DELIVERED",

        emailDeliveryStatus:
          "SENT",

        emailSent:
          true,

        emailSentAt:
          completedAt,

        emailIdempotencyKey:
          idempotencyKey,

        resendEmailId:
          emailId,

        emailClaimId:
          null,

        emailClaimedAt:
          null,

        emailLeaseUntil:
          null,

        emailLastAttemptAt:
          completedAt,

        emailLastError:
          null,

        completedAt,

        lastAttemptAt:
          completedAt,

        lastError:
          null,
      },
    });

  return updateResult.count === 1;
}

async function recordEmailFailure({
  order,
  claimId,
  idempotencyKey,
  errorMessage,
}: {
  order: DeliveryCandidate;
  claimId: string;
  idempotencyKey: string;
  errorMessage: string;
}): Promise<void> {
  const failedAt =
    new Date();

  await prisma.order.updateMany({
    where: {
      id:
        order.id,

      paymentStatus:
        "PAID",

      status:
        "PROCESSING",

      esimStatus:
        "ISSUED",

      emailDeliveryStatus:
        "SENDING",

      emailClaimId:
        claimId,

      emailSent:
        false,

      emailSentAt:
        null,
    },

    data: {
      status:
        "PROCESSING",

      paymentStatus:
        "PAID",

      esimStatus:
        "ISSUED",

      emailDeliveryStatus:
        "FAILED",

      emailSent:
        false,

      emailIdempotencyKey:
        idempotencyKey,

      emailClaimId:
        null,

      emailClaimedAt:
        null,

      emailLeaseUntil:
        null,

      emailLastAttemptAt:
        failedAt,

      emailLastError:
        errorMessage,

      lastAttemptAt:
        failedAt,

      lastError:
        errorMessage,
    },
  });
}

async function deliverOrder(
  order: DeliveryCandidate,
): Promise<DeliveryResult> {
  const baseResult =
    createBaseResult(order);

  if (
    order.emailSent ||
    order.emailSentAt ||
    order.emailDeliveryStatus ===
      "SENT"
  ) {
    return {
      ...baseResult,

      result:
        "SKIPPED",

      message:
        "The delivery email was already sent.",

      emailId:
        order.resendEmailId ??
        undefined,
    };
  }

  const iccid =
    normalizeRequiredValue(
      order.iccid,
    );

  const activationCode =
    normalizeRequiredValue(
      order.activationCode,
    );

  const qrCodeUrl =
    normalizeRequiredValue(
      order.qrCodeUrl,
    );

  const customerName =
    normalizeRequiredValue(
      order.customerName,
    );

  const customerEmail =
    normalizeRequiredValue(
      order.customerEmail,
    );

  const planName =
    normalizeRequiredValue(
      order.planName,
    );

  const referenceNumber =
    normalizeRequiredValue(
      order.referenceNumber,
    );

  if (
    !iccid ||
    !activationCode ||
    !qrCodeUrl
  ) {
    const message =
      "The order does not have complete ICCID, activation-code, or QR-code details.";

    await markIncompleteOrder({
      orderId:
        order.id,

      message,
    });

    return {
      ...baseResult,

      result:
        "SKIPPED",

      message,
    };
  }

  if (
    !customerName ||
    !customerEmail ||
    !planName ||
    !referenceNumber
  ) {
    const message =
      "The order does not have complete customer or plan information.";

    await markIncompleteOrder({
      orderId:
        order.id,

      message,
    });

    return {
      ...baseResult,

      result:
        "SKIPPED",

      message,
    };
  }

  const idempotencyKey =
    order.emailIdempotencyKey ??
    createIdempotencyKey(
      order.id,
    );

  const claimId =
    randomUUID();

  const claimed =
    await claimOrderForEmail({
      order,
      claimId,
      idempotencyKey,
    });

  if (!claimed) {
    return {
      ...baseResult,

      result:
        "SKIPPED",

      message:
        "The order is already being delivered by another worker.",
    };
  }

  try {
    const emailResult =
      await sendEsimDeliveryEmail({
        customerName,
        customerEmail,
        referenceNumber,
        planName,
        iccid,
        activationCode,
        qrCodeUrl,

        apn:
          normalizeRequiredValue(
            order.apn,
          ),

        idempotencyKey,
      });

    const completed =
      await markDeliveryCompleted({
        order,
        claimId,

        emailId:
          emailResult.emailId,

        idempotencyKey,
      });

    if (!completed) {
      const currentOrder =
        await prisma.order.findUnique({
          where: {
            id:
              order.id,
          },

          select: {
            status:
              true,

            esimStatus:
              true,

            emailDeliveryStatus:
              true,

            emailSent:
              true,

            emailSentAt:
              true,

            resendEmailId:
              true,
          },
        });

      if (
        currentOrder?.emailSent ||
        currentOrder?.emailSentAt ||
        currentOrder
          ?.emailDeliveryStatus ===
          "SENT" ||
        currentOrder?.esimStatus ===
          "DELIVERED" ||
        currentOrder?.status ===
          "COMPLETED"
      ) {
        return {
          ...baseResult,

          result:
            "SKIPPED",

          message:
            "Another worker already completed the delivery.",

          emailId:
            currentOrder
              ?.resendEmailId ??
            emailResult.emailId,
        };
      }

      throw new Error(
        "Resend accepted the email, but the order could not be marked as delivered.",
      );
    }

    console.info(
      "ESIM DELIVERY COMPLETED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        emailId:
          emailResult.emailId,

        idempotencyKey,

        claimId,
      },
    );

    return {
      ...baseResult,

      result:
        "SENT",

      message:
        "The eSIM delivery email was sent successfully.",

      emailId:
        emailResult.emailId,
    };
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "ESIM EMAIL DELIVERY FAILED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        idempotencyKey,

        claimId,

        error:
          errorMessage,
      },
    );

    await recordEmailFailure({
      order,
      claimId,
      idempotencyKey,
      errorMessage,
    });

    return {
      ...baseResult,

      result:
        "FAILED",

      message:
        errorMessage,
    };
  }
}

async function runEmailDelivery() {
  const now =
    new Date();

  const retryBefore =
    new Date(
      now.getTime() -
        EMAIL_RETRY_COOLDOWN_MS,
    );

  const orders =
    await prisma.order.findMany({
      where: {
        paymentStatus:
          "PAID",

        status:
          "PROCESSING",

        esimStatus:
          "ISSUED",

        emailSent:
          false,

        emailSentAt:
          null,

        iccid: {
          not: null,
        },

        activationCode: {
          not: null,
        },

        qrCodeUrl: {
          not: null,
        },

        AND: [
          {
            OR: [
              {
                emailDeliveryStatus:
                  "PENDING",
              },
              {
                emailDeliveryStatus:
                  "FAILED",

                OR: [
                  {
                    emailLastAttemptAt:
                      null,
                  },
                  {
                    emailLastAttemptAt: {
                      lte:
                        retryBefore,
                    },
                  },
                ],
              },
              {
                emailDeliveryStatus:
                  "SENDING",

                emailLeaseUntil: {
                  lte: now,
                },
              },
            ],
          },
          {
            OR: [
              {
                emailLeaseUntil:
                  null,
              },
              {
                emailLeaseUntil: {
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

        planName:
          true,

        customerName:
          true,

        customerEmail:
          true,

        iccid:
          true,

        activationCode:
          true,

        qrCodeUrl:
          true,

        apn:
          true,

        emailDeliveryStatus:
          true,

        emailSent:
          true,

        emailSentAt:
          true,

        emailIdempotencyKey:
          true,

        resendEmailId:
          true,

        emailClaimId:
          true,

        emailLeaseUntil:
          true,

        emailLastAttemptAt:
          true,
      },

      orderBy: [
        {
          emailLastAttemptAt:
            "asc",
        },
        {
          createdAt:
            "asc",
        },
      ],

      take:
        MAX_EMAILS_PER_RUN,
    });

  const results:
    DeliveryResult[] = [];

  for (const order of orders) {
    const result =
      await deliverOrder(order);

    results.push(result);
  }

  return {
    checked:
      orders.length,

    sent:
      results.filter(
        (item) =>
          item.result ===
          "SENT",
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
      await runEmailDelivery();

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
      "ESIM DELIVERY ROUTE ERROR:",
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
        "Use an authorized POST request to deliver issued eSIM orders.",
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