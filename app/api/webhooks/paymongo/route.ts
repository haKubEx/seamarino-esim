import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

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
    const trimmed = part.trim();
    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);

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

function safeCompare(
  expected: string,
  received: string,
) {
  if (!expected || !received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (
    expectedBuffer.length !== receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
}

function verifySignature({
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
  const parsed =
    parseSignatureHeader(signatureHeader);

  if (!parsed) {
    return false;
  }

  const signedPayload =
    `${parsed.timestamp}.${rawBody}`;

  const expectedSignature = createHmac(
    "sha256",
    webhookSecret,
  )
    .update(signedPayload)
    .digest("hex");

  const receivedSignature = liveMode
    ? parsed.liveSignature
    : parsed.testSignature;

  return safeCompare(
    expectedSignature,
    receivedSignature,
  );
}

function findPaidPayment(
  payments: PayMongoPayment[] | undefined,
) {
  return payments?.find(
    (payment) =>
      payment.attributes?.status
        ?.toLowerCase() === "paid",
  );
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

    const signatureHeader =
      request.headers.get(
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
      verifySignature({
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
      console.info(
        "Ignoring PayMongo event:",
        eventType,
      );

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

    console.info(
      "PAYMONGO PAID SESSION DETAILS:",
      {
        checkoutSessionId,
        referenceNumber,
        metadataOrderId,
        paymentId,
        paymentMethod,
        paidAmount,
        paidCurrency,
      },
    );

    if (
      !referenceNumber &&
      !metadataOrderId
    ) {
      console.error(
        "Webhook has no reference number or order ID.",
      );

      return NextResponse.json(
        {
          error:
            "Webhook does not identify an order.",
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

    if (
      order.paymentStatus === "PAID" ||
      order.status === "PAID" ||
      order.status === "PROCESSING" ||
      order.status === "COMPLETED"
    ) {
      console.info(
        "Duplicate paid webhook ignored:",
        {
          orderId: order.id,
          referenceNumber:
            order.referenceNumber,
        },
      );

      return NextResponse.json({
        received: true,
        duplicate: true,
        referenceNumber:
          order.referenceNumber,
      });
    }

    if (
      typeof paidAmount === "number" &&
      paidAmount !==
        order.amountPhpCentavos
    ) {
      console.error(
        "Paid amount does not match order:",
        {
          expected:
            order.amountPhpCentavos,
          received: paidAmount,
        },
      );

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "FAILED",
          paymentStatus: "FAILED",
          lastError:
            "PayMongo payment amount did not match the order amount.",
          webhookReceivedAt:
            new Date(),
        },
      });

      return NextResponse.json(
        {
          error:
            "Payment amount mismatch.",
        },
        { status: 400 },
      );
    }

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
          webhookReceivedAt:
            new Date(),
        },
      });

      return NextResponse.json(
        {
          error:
            "Payment currency mismatch.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

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

        paymentMethod:
          paymentMethod ??
          order.paymentMethod,

        paidAt: now,
        webhookReceivedAt: now,
        lastError: null,
      },
    });

    console.info(
      "ORDER MARKED AS PAID:",
      {
        orderId: order.id,
        referenceNumber:
          order.referenceNumber,
        checkoutSessionId,
        paymentId,
      },
    );

    return NextResponse.json({
      received: true,
      processed: true,
      referenceNumber:
        order.referenceNumber,
    });
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