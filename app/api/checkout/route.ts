import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getSellingPrice } from "@/app/lib/pricing";
import { getPlans } from "@/app/services/plans";
import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PayMongoError {
  detail?: string;
  code?: string;
}

interface PayMongoCheckoutResponse {
  data?: {
    id?: string;
    attributes?: {
      checkout_url?: string;
      reference_number?: string;
      status?: string;
    };
  };
  errors?: PayMongoError[];
}

function formatData(bytes: number) {
  const gb = bytes / 1024 / 1024 / 1024;

  if (gb < 1) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb)} MB`;
  }

  const value = Number.isInteger(gb)
    ? gb.toString()
    : gb.toFixed(1);

  return `${value} GB`;
}

function formatDurationUnit(unit: string, duration: number) {
  const normalized = unit.trim().toLowerCase();

  if (!normalized) {
    return duration === 1 ? "day" : "days";
  }

  if (duration === 1) {
    return normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
  }

  return normalized.endsWith("s")
    ? normalized
    : `${normalized}s`;
}

function normalizeAppUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function createReferenceNumber() {
  const randomCode = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `SEAMARINO-${Date.now()}-${randomCode}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.length >= 7 && digits.length <= 15;
}

function sanitizeMetadataValue(
  value: string,
  maximumLength = 255,
) {
  return value.trim().slice(0, maximumLength);
}

function getPaymentMethodTypes() {
  const configuredMethods =
    process.env.PAYMONGO_PAYMENT_METHODS?.split(",")
      .map((method) => method.trim().toLowerCase())
      .filter(Boolean);

  if (configuredMethods && configuredMethods.length > 0) {
    return configuredMethods;
  }

  return ["card", "gcash", "paymaya", "qrph"];
}

async function readPayMongoResponse(
  response: Response,
): Promise<PayMongoCheckoutResponse> {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(
      responseText,
    ) as PayMongoCheckoutResponse;
  } catch {
    console.error(
      "PayMongo returned a non-JSON response:",
      responseText,
    );

    return {};
  }
}

function getPayMongoErrorMessage(
  data: PayMongoCheckoutResponse,
) {
  const firstError = data.errors?.[0];

  return (
    firstError?.detail ||
    firstError?.code ||
    "Unable to create the PayMongo checkout session."
  );
}

export async function POST(request: Request) {
  let createdOrderId: string | null = null;

  try {
    const secretKey =
      process.env.PAYMONGO_SECRET_KEY?.trim();

    const appUrl = normalizeAppUrl(
      process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000",
    );

    const usdToPhpRate = Number(
      process.env.USD_TO_PHP_RATE ?? "58",
    );

    if (!secretKey) {
      console.error(
        "PAYMONGO_SECRET_KEY is missing.",
      );

      return NextResponse.json(
        {
          error:
            "Payment processing is temporarily unavailable.",
        },
        { status: 500 },
      );
    }

    if (
      !Number.isFinite(usdToPhpRate) ||
      usdToPhpRate <= 0
    ) {
      console.error(
        "USD_TO_PHP_RATE is invalid.",
      );

      return NextResponse.json(
        {
          error:
            "Payment conversion is temporarily unavailable.",
        },
        { status: 500 },
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error: "The submitted checkout form is invalid.",
        },
        { status: 400 },
      );
    }

    const packageCode = String(
      formData.get("packageCode") ?? "",
    ).trim();

    const fullName = String(
      formData.get("fullName") ?? "",
    ).trim();

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const phone = String(
      formData.get("phone") ?? "",
    ).trim();

    const acceptedTerms =
      formData.get("acceptedTerms") === "on";

    if (!packageCode) {
      return NextResponse.json(
        {
          error: "No eSIM plan was selected.",
        },
        { status: 400 },
      );
    }

    if (
      fullName.length < 2 ||
      fullName.length > 100
    ) {
      return NextResponse.json(
        {
          error: "Please enter a valid full name.",
        },
        { status: 400 },
      );
    }

    if (
      !isValidEmail(email) ||
      email.length > 254
    ) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        {
          error: "Please enter a valid phone number.",
        },
        { status: 400 },
      );
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        {
          error:
            "You must confirm eSIM compatibility and accept the terms.",
        },
        { status: 400 },
      );
    }

    const plans: EsimPackage[] = await getPlans();

    const plan = plans.find(
      (item) => item.packageCode === packageCode,
    );

    if (!plan) {
      return NextResponse.json(
        {
          error:
            "The selected eSIM plan is no longer available.",
        },
        { status: 404 },
      );
    }

    const sellingPriceUsd = Number(
      getSellingPrice(plan.price, plan.volume),
    );

    if (
      !Number.isFinite(sellingPriceUsd) ||
      sellingPriceUsd <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The selected plan currently has an invalid price.",
        },
        { status: 500 },
      );
    }

    const amountInCentavos = Math.round(
      sellingPriceUsd * usdToPhpRate * 100,
    );

    if (
      !Number.isSafeInteger(amountInCentavos) ||
      amountInCentavos <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The converted payment amount is invalid.",
        },
        { status: 500 },
      );
    }

    const referenceNumber =
      createReferenceNumber();

    /*
     * Save the order before contacting PayMongo.
     * This lets the webhook find the order later.
     */
    const order = await prisma.order.create({
      data: {
        referenceNumber,
        packageCode: plan.packageCode,
        planName: plan.name,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        sellingPriceUsd,
        amountPhpCentavos: amountInCentavos,
        usdToPhpRate,
        currency: "PHP",
        status: "PENDING",
        paymentStatus: "PENDING",
        esimStatus: "NOT_ORDERED",
      },
    });

    createdOrderId = order.id;

    const authorization = Buffer.from(
      `${secretKey}:`,
    ).toString("base64");

    const validity = `${plan.duration} ${formatDurationUnit(
      plan.durationUnit,
      plan.duration,
    )}`;

    const checkoutPayload = {
      data: {
        attributes: {
          billing: {
            name: fullName,
            email,
            phone,
          },

          line_items: [
            {
              name: plan.name.slice(0, 255),
              description: `${formatData(
                plan.volume,
              )} eSIM — ${validity}`.slice(0, 255),
              amount: amountInCentavos,
              currency: "PHP",
              quantity: 1,
            },
          ],

          payment_method_types:
            getPaymentMethodTypes(),

          success_url: `${appUrl}/checkout/success?reference=${encodeURIComponent(
            referenceNumber,
          )}`,

          cancel_url: `${appUrl}/checkout?packageCode=${encodeURIComponent(
            plan.packageCode,
          )}&payment=cancelled`,

          reference_number: referenceNumber,

          description:
            `Seamarino eSIM order for ${fullName}`.slice(
              0,
              255,
            ),

          metadata: {
            order_id: sanitizeMetadataValue(order.id),
            reference_number:
              sanitizeMetadataValue(referenceNumber),
            package_code: sanitizeMetadataValue(
              plan.packageCode,
            ),
            plan_name: sanitizeMetadataValue(plan.name),
            customer_name:
              sanitizeMetadataValue(fullName),
            customer_email:
              sanitizeMetadataValue(email),
            customer_phone:
              sanitizeMetadataValue(phone),
            selling_price_usd:
              sellingPriceUsd.toFixed(2),
            amount_php: (
              amountInCentavos / 100
            ).toFixed(2),
            usd_to_php_rate:
              usdToPhpRate.toString(),
            data_allowance: formatData(plan.volume),
            validity,
          },
        },
      },
    };

    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v2/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(checkoutPayload),
        cache: "no-store",
      },
    );

    const paymongoData =
      await readPayMongoResponse(paymongoResponse);

    if (!paymongoResponse.ok) {
      const paymentError =
        getPayMongoErrorMessage(paymongoData);

      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          lastError: paymentError,
          lastAttemptAt: new Date(),
          processingAttempts: {
            increment: 1,
          },
        },
      });

      console.error(
        "PayMongo checkout session error:",
        JSON.stringify(
          {
            status: paymongoResponse.status,
            referenceNumber,
            response: paymongoData,
          },
          null,
          2,
        ),
      );

      return NextResponse.json(
        {
          error: paymentError,
        },
        {
          status:
            paymongoResponse.status >= 400 &&
            paymongoResponse.status < 600
              ? paymongoResponse.status
              : 502,
        },
      );
    }

    const checkoutUrl =
      paymongoData.data?.attributes?.checkout_url;

    const checkoutSessionId =
      paymongoData.data?.id;

    if (!checkoutUrl || !checkoutSessionId) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          lastError:
            "PayMongo did not return a checkout URL or session ID.",
          lastAttemptAt: new Date(),
          processingAttempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          error:
            "The payment provider did not return a valid checkout link.",
        },
        { status: 502 },
      );
    }

    /*
     * Attach the PayMongo session to the saved order.
     */
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymongoSessionId: checkoutSessionId,
        lastError: null,
      },
    });

    console.info(
      "Checkout session created:",
      {
        orderId: order.id,
        referenceNumber,
        checkoutSessionId,
        packageCode: plan.packageCode,
        amountInCentavos,
      },
    );

    return NextResponse.redirect(
      checkoutUrl,
      303,
    );
  } catch (error) {
    console.error("Checkout route error:", error);

    if (createdOrderId) {
      try {
        await prisma.order.update({
          where: {
            id: createdOrderId,
          },
          data: {
            lastError:
              error instanceof Error
                ? error.message.slice(0, 1000)
                : "Unknown checkout error.",
            lastAttemptAt: new Date(),
            processingAttempts: {
              increment: 1,
            },
          },
        });
      } catch (databaseError) {
        console.error(
          "Unable to save checkout error:",
          databaseError,
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while starting your payment. Please try again.",
      },
      { status: 500 },
    );
  }
}