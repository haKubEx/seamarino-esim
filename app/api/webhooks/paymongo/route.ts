import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { purchaseEsimProfile } from "@/app/services/esimOrder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayMongoPayment = {
  id?: string;
  type?: string;

  attributes?: {
    amount?: number;
    currency?: string;
    status?: string;

    source?: {
      id?: string;
      type?: string;
    };
  };
};

type CheckoutSessionResource = {
  id?: string;
  type?: string;

  attributes?: {
    reference_number?: string;
    status?: string;

    payment_intent?: {
      id?: string;
      type?: string;
    };

    payments?: PayMongoPayment[];

    metadata?: Record<string, string>;
  };
};

type PayMongoWebhookPayload = {
  data?: {
    id?: string;
    type?: string;

    attributes?: {
      type?: string;
      livemode?: boolean;
      created_at?: number;

      data?: CheckoutSessionResource;

      previous_data?: Record<string, unknown>;
    };
  };
};

type ParsedSignature = {
  timestamp: string;
  testSignature: string;
  liveSignature: string;
};

function parseSignatureHeader(
  header: string,
): ParsedSignature | null {
  const values = new Map<string, string>();

  for (const part of header.split(",")) {
    const trimmedPart = part.trim();
    const separatorIndex = trimmedPart.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedPart.slice(0, separatorIndex);
    const value = trimmedPart.slice(separatorIndex + 1);

    values.set(key, value);
  }

  const timestamp = values.get("t");

  if (!timestamp) {
    return null;
  }

  return {
    timestamp,
    testSignature: values.get("te") ?? "",
    liveSignature: values.get("li") ?? "",
  };
}

function secureCompare(
  expectedSignature: string,
  receivedSignature: string,
) {
  if (!expectedSignature || !receivedSignature) {
    return false;
  }

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8",
  );

  const receivedBuffer = Buffer.from(
    receivedSignature,
    "utf8",
  );

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
}

function verifyPayMongoSignature({
  rawBody,
  signatureHeader,
  webhookSecret,
  liveMode,
}: {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
  liveMode: boolean;
}) {
  const parsedSignature =
    parseSignatureHeader(signatureHeader);

  if (!parsedSignature) {
    return false;
  }

  const signedPayload =
    `${parsedSignature.timestamp}.${rawBody}`;

  const calculatedSignature = createHmac(
    "sha256",
    webhookSecret,
  )
    .update(signedPayload)
    .digest("hex");

  const receivedSignature = liveMode
    ? parsedSignature.liveSignature
    : parsedSignature.testSignature;

  return secureCompare(
    calculatedSignature,
    receivedSignature,
  );
}

function findPaidPayment(
  payments: PayMongoPayment[] | undefined,
) {
  return payments?.find(
    (payment) =>
      payment.attributes?.status?.toLowerCase() ===
      "paid",
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1500);
  }

  return "Unknown eSIM processing error.";
}

function createEsimTransactionId(
  referenceNumber: string,
) {
  return referenceNumber
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 50);
}

export async function POST(request: Request) {
  try {
    const webhookSecret =
      process.env.PAYMONGO_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      console.error(
        "PAYMONGO_WEBHOOK_SECRET is missing.",
      );

      return NextResponse.json(
        {
          error:
            "Webhook secret is not configured.",
        },
        { status: 500 },
      );
    }

    const signatureHeader = request.headers.get(
      "paymongo-signature",
    );

    if (!signatureHeader) {
      console.error(
        "PayMongo signature header is missing.",
      );

      return NextResponse.json(
        {
          error:
            "Missing PayMongo signature.",
        },
        { status: 401 },
      );
    }

    const rawBody = await request.text();

    let payload: PayMongoWebhookPayload;

    try {
      payload = JSON.parse(
        rawBody,
      ) as PayMongoWebhookPayload;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON payload.",
        },
        { status: 400 },
      );
    }

    const eventAttributes =
      payload.data?.attributes;

    const eventType =
      eventAttributes?.type;

    const liveMode =
      eventAttributes?.livemode === true;

    console.info("PAYMONGO WEBHOOK RECEIVED:", {
      eventId: payload.data?.id,
      eventType,
      liveMode,
    });

    const signatureIsValid =
      verifyPayMongoSignature({
        rawBody,
        signatureHeader,
        webhookSecret,
        liveMode,
      });

    if (!signatureIsValid) {
      console.error(
        "PayMongo webhook signature is invalid.",
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        { status: 401 },
      );
    }

    if (
      eventType !==
      "checkout_session.payment.paid"
    ) {
      return NextResponse.json({
        received: true,
        ignored: true,
        eventType,
      });
    }

    const checkoutSession =
      eventAttributes?.data;

    const checkoutAttributes =
      checkoutSession?.attributes;

    const checkoutSessionId =
      checkoutSession?.id;

    const referenceNumber =
      checkoutAttributes?.reference_number;

    const metadata =
      checkoutAttributes?.metadata;

    const metadataOrderId =
      metadata?.order_id;

    const paidPayment =
      findPaidPayment(
        checkoutAttributes?.payments,
      );

    const paymentId =
      paidPayment?.id ??
      checkoutAttributes?.payment_intent?.id;

    const paymentMethod =
      paidPayment?.attributes?.source?.type;

    const paidAmount =
      paidPayment?.attributes?.amount;

    const paidCurrency =
      paidPayment?.attributes?.currency;

    if (!referenceNumber && !metadataOrderId) {
      console.error(
        "Webhook does not identify an order.",
      );

      return NextResponse.json(
        {
          error:
            "Webhook does not contain an order identifier.",
        },
        { status: 400 },
      );
    }

    const order = metadataOrderId
      ? await prisma.order.findUnique({
          where: {
            id: metadataOrderId,
          },
        })
      : await prisma.order.findUnique({
          where: {
            referenceNumber:
              referenceNumber as string,
          },
        });

    if (!order) {
      console.error(
        "Order not found for paid webhook:",
        {
          referenceNumber,
          metadataOrderId,
          checkoutSessionId,
        },
      );

      return NextResponse.json(
        {
          error: "Order was not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Confirm that the paid amount matches
     * the order saved before checkout.
     */
    if (
      typeof paidAmount === "number" &&
      paidAmount !== order.amountPhpCentavos
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
          lastError:
            "PayMongo payment amount did not match the order amount.",
          webhookReceivedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          error: "Payment amount mismatch.",
        },
        { status: 400 },
      );
    }

    /*
     * Confirm that PayMongo used the same
     * currency stored on the order.
     */
    if (
      paidCurrency &&
      paidCurrency.toUpperCase() !==
        order.currency.toUpperCase()
    ) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
          lastError:
            "PayMongo payment currency did not match the order currency.",
          webhookReceivedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          error: "Payment currency mismatch.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    /*
     * Save the verified PayMongo payment.
     */
    if (order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "PAID",
          paymentStatus: "PAID",

          paymongoSessionId:
            checkoutSessionId ??
            order.paymongoSessionId,

          paymongoPaymentId:
            paymentId ??
            order.paymongoPaymentId,

          paymongoEventId:
            payload.data?.id ??
            order.paymongoEventId,

          paymentMethod:
            paymentMethod ??
            order.paymentMethod,

          paidAt:
            order.paidAt ?? now,

          webhookReceivedAt: now,

          lastError: null,
        },
      });
    }

    /*
     * Do not purchase another profile if the
     * supplier order already exists.
     */
    if (
      order.esimOrderId ||
      order.esimStatus === "ISSUED" ||
      order.esimStatus === "DELIVERED" ||
      order.status === "COMPLETED"
    ) {
      console.info(
        "eSIM already ordered for this payment:",
        {
          orderId: order.id,
          referenceNumber:
            order.referenceNumber,
          esimOrderId:
            order.esimOrderId,
          esimStatus:
            order.esimStatus,
        },
      );

      return NextResponse.json({
        received: true,
        duplicate: true,
        paymentConfirmed: true,
        esimAlreadyOrdered: true,
        referenceNumber:
          order.referenceNumber,
      });
    }

    /*
     * Claim the order before contacting the
     * supplier. This helps prevent duplicate
     * purchases from repeated webhook events.
     */
    const claimResult =
      await prisma.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: "PAID",

          esimStatus: {
            in: [
              "NOT_ORDERED",
              "FAILED",
            ],
          },

          esimOrderId: null,
        },

        data: {
          status: "PROCESSING",
          esimStatus: "PROCESSING",

          processingAttempts: {
            increment: 1,
          },

          lastAttemptAt: new Date(),
          lastError: null,
        },
      });

    if (claimResult.count === 0) {
      console.info(
        "Order is already being processed:",
        {
          orderId: order.id,
          referenceNumber:
            order.referenceNumber,
        },
      );

      return NextResponse.json({
        received: true,
        paymentConfirmed: true,
        processing: true,
        referenceNumber:
          order.referenceNumber,
      });
    }

    const transactionId =
      order.esimTransactionId ??
      createEsimTransactionId(
        order.referenceNumber,
      );

    /*
     * Save the transaction ID before contacting
     * eSIM Access. The same transaction ID will
     * be reused if fulfillment must be retried.
     */
    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        esimTransactionId:
          transactionId,
      },
    });

    try {
      const purchaseResult =
        await purchaseEsimProfile({
          packageCode:
            order.packageCode,

          transactionId,
        });

      /*
       * Important:
       * Do not save purchaseResult.rawResponse
       * into esimRawResponse here.
       *
       * esimRawResponse is reserved for the
       * actual profile query response containing
       * ICCID, activation code and QR details.
       */
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          status: "PROCESSING",
          paymentStatus: "PAID",
          esimStatus: "PROCESSING",

          esimOrderId:
            purchaseResult.orderNo,

          esimTransactionId:
            purchaseResult.transactionId,

          lastError: null,
          lastAttemptAt: new Date(),
        },
      });

      console.info(
        "ESIM ACCESS ORDER CREATED:",
        {
          orderId: order.id,
          referenceNumber:
            order.referenceNumber,

          supplierOrderNo:
            purchaseResult.orderNo,

          transactionId:
            purchaseResult.transactionId,
        },
      );

      return NextResponse.json({
        received: true,
        processed: true,
        paymentConfirmed: true,
        esimOrdered: true,

        referenceNumber:
          order.referenceNumber,

        supplierOrderNo:
          purchaseResult.orderNo,
      });
    } catch (purchaseError) {
      const purchaseErrorMessage =
        getErrorMessage(purchaseError);

      console.error(
        "ESIM ACCESS PURCHASE FAILED:",
        {
          orderId: order.id,
          referenceNumber:
            order.referenceNumber,

          packageCode:
            order.packageCode,

          transactionId,

          error:
            purchaseErrorMessage,
        },
      );

      /*
       * Keep payment PAID because the customer
       * successfully paid. Only fulfillment failed.
       */
      await prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          status: "FAILED",
          paymentStatus: "PAID",
          esimStatus: "FAILED",

          esimTransactionId:
            transactionId,

          lastError:
            purchaseErrorMessage,

          lastAttemptAt:
            new Date(),
        },
      });

      /*
       * Return 200 so PayMongo does not repeatedly
       * resend a valid paid event for a temporary
       * supplier fulfillment problem.
       */
      return NextResponse.json({
        received: true,
        paymentConfirmed: true,
        esimOrdered: false,
        fulfillmentFailed: true,

        referenceNumber:
          order.referenceNumber,
      });
    }
  } catch (error) {
    console.error(
      "PAYMONGO WEBHOOK ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "Seamarino PayMongo webhook endpoint is active.",
  });
}