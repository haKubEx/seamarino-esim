import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { sendEsimDeliveryEmail } from "@/app/services/esimEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_EMAILS_PER_RUN = 10;

type DeliveryResult = {
  orderId: string;
  referenceNumber: string;
  customerEmail: string;
  result: "SENT" | "SKIPPED" | "FAILED";
  message?: string;
};

function isAuthorized(request: Request) {
  const configuredSecret =
    process.env.FULFILLMENT_SECRET?.trim();

  if (!configuredSecret) {
    console.error("FULFILLMENT_SECRET is missing.");
    return false;
  }

  const authorization =
    request.headers.get("authorization");

  return authorization === `Bearer ${configuredSecret}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1500);
  }

  return "Unknown email-delivery error.";
}

async function deliverOrder(order: {
  id: string;
  referenceNumber: string;
  planName: string;
  customerName: string;
  customerEmail: string;
  iccid: string | null;
  activationCode: string | null;
  qrCodeUrl: string | null;
  apn: string | null;
  emailSent: boolean;
}) {
  const baseResult = {
    orderId: order.id,
    referenceNumber: order.referenceNumber,
    customerEmail: order.customerEmail,
  };

  if (order.emailSent) {
    return {
      ...baseResult,
      result: "SKIPPED" as const,
      message: "The delivery email was already sent.",
    };
  }

  if (
    !order.iccid ||
    !order.activationCode ||
    !order.qrCodeUrl
  ) {
    const message =
      "The order does not have complete eSIM installation details.";

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        lastError: message,
      },
    });

    return {
      ...baseResult,
      result: "SKIPPED" as const,
      message,
    };
  }

  /*
   * Increment attempts before sending.
   */
  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      emailAttempts: {
        increment: 1,
      },
      lastAttemptAt: new Date(),
      lastError: null,
    },
  });

  try {
    const emailResult =
      await sendEsimDeliveryEmail({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        referenceNumber:
          order.referenceNumber,
        planName: order.planName,
        iccid: order.iccid,
        activationCode:
          order.activationCode,
        qrCodeUrl: order.qrCodeUrl,
        apn: order.apn,
      });

    const now = new Date();

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
        esimStatus: "DELIVERED",

        emailSent: true,
        emailSentAt: now,
        completedAt: now,

        lastAttemptAt: now,
        lastError: null,
      },
    });

    console.info("ESIM DELIVERY COMPLETED:", {
      orderId: order.id,
      referenceNumber:
        order.referenceNumber,
      emailId: emailResult.emailId,
    });

    return {
      ...baseResult,
      result: "SENT" as const,
      message:
        "The eSIM delivery email was sent successfully.",
    };
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error("ESIM EMAIL DELIVERY FAILED:", {
      orderId: order.id,
      referenceNumber:
        order.referenceNumber,
      error: errorMessage,
    });

    /*
     * Keep the profile issued so email delivery
     * can be retried without purchasing again.
     */
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PROCESSING",
        paymentStatus: "PAID",
        esimStatus: "ISSUED",
        emailSent: false,
        lastAttemptAt: new Date(),
        lastError: errorMessage,
      },
    });

    return {
      ...baseResult,
      result: "FAILED" as const,
      message: errorMessage,
    };
  }
}

async function runEmailDelivery() {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      esimStatus: "ISSUED",
      emailSent: false,

      iccid: {
        not: null,
      },

      activationCode: {
        not: null,
      },

      qrCodeUrl: {
        not: null,
      },
    },

    select: {
      id: true,
      referenceNumber: true,
      planName: true,
      customerName: true,
      customerEmail: true,
      iccid: true,
      activationCode: true,
      qrCodeUrl: true,
      apn: true,
      emailSent: true,
    },

    orderBy: {
      createdAt: "asc",
    },

    take: MAX_EMAILS_PER_RUN,
  });

  const results: DeliveryResult[] = [];

  for (const order of orders) {
    const result =
      await deliverOrder(order);

    results.push(result);
  }

  return {
    checked: orders.length,

    sent: results.filter(
      (item) => item.result === "SENT",
    ).length,

    failed: results.filter(
      (item) => item.result === "FAILED",
    ).length,

    skipped: results.filter(
      (item) => item.result === "SKIPPED",
    ).length,

    results,
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const summary =
      await runEmailDelivery();

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error(
      "ESIM DELIVERY ROUTE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Use an authorized POST request to deliver issued eSIM orders.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    },
  );
}