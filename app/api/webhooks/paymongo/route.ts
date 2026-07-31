import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayMongoPayment = {
  id?: string;
  attributes?: {
    amount?: number;
    currency?: string;
    status?: string;
    source?: {
      type?: string;
    };
  };
};

type PayMongoWebhookPayload = {
  data?: {
    type?: string;
    livemode?: boolean;
    data?: {
      id?: string;
      attributes?: {
        reference_number?: string;
        payment_intent?: {
          id?: string;
        };
        payments?: PayMongoPayment[];
      };
    };
  };
};

type ParsedSignature = {
  timestamp: string;
  testSignature: string;
  liveSignature: string;
};

function parseSignatureHeader(
  signatureHeader: string,
): ParsedSignature | null {
  const values = new Map<string, string>();

  for (const part of signatureHeader.split(",")) {
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

function getPaidPayment(
  payments: PayMongoPayment[] | undefined,
) {
  return payments?.find(
    (payment) =>
      payment.attributes?.status?.toLowerCase() ===
      "paid",
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
          error: "Webhook is not configured.",
        },
        { status: 500 },
      );
    }

    const signatureHeader = request.headers.get(
      "paymongo-signature",
    );

    if (!signatureHeader) {
      return NextResponse.json(
        {
          error: "Missing PayMongo signature.",
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

    const liveMode = payload.data?.livemode === true;

    const signatureIsValid =
      verifyPayMongoSignature({
        rawBody,
        signatureHeader,
        webhookSecret,
        liveMode,
      });

    if (!signatureIsValid) {
      console.error(
        "PayMongo webhook signature verification failed.",
      );

      return NextResponse.json(
        {
          error: "Invalid webhook signature.",
        },
        { status: 401 },
      );
    }

    const eventType = payload.data?.type;

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

    const checkoutSession = payload.data?.data;
    const attributes = checkoutSession?.attributes;

    const checkoutSessionId = checkoutSession?.id;
    const referenceNumber =
      attributes?.reference_number;

    const paidPayment = getPaidPayment(
      attributes?.payments,
    );

    const paymentId =
      paidPayment?.id ??
      attributes?.payment_intent?.id;

    const paymentMethod =
      paidPayment?.attributes?.source?.type;

    const paidAmount =
      paidPayment?.attributes?.amount;

    const paidCurrency =
      paidPayment?.attributes?.currency;

    if (!referenceNumber) {
      return NextResponse.json(
        {
          error:
            "Webhook does not contain an order reference.",
        },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        referenceNumber,
      },
    });

    if (!order) {
      console.error(
        "Order not found for PayMongo webhook.",
        {
          referenceNumber,
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
      return NextResponse.json({
        received: true,
        duplicate: true,
        referenceNumber,
      });
    }

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
            "Payment amount did not match the order amount.",
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
            "Payment currency did not match the order currency.",
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
      "PayMongo payment confirmed.",
      {
        referenceNumber,
        checkoutSessionId,
        paymentId,
        paymentMethod,
      },
    );

    return NextResponse.json({
      received: true,
      processed: true,
      referenceNumber,
    });
  } catch (error) {
    console.error(
      "PayMongo webhook processing error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the webhook.",
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