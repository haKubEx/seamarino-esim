import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { calculatePlanPrice } from "@/app/services/pricing";
import { getPlans } from "@/app/services/plans";
import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PayMongoError {
  detail?: string;
  code?: string;

  source?: {
    pointer?: string;
    attribute?: string;
  };
}

interface PayMongoCheckoutResponse {
  data?: {
    id?: string;
    type?: string;

    attributes?: {
      checkout_url?: string;
      reference_number?: string;
      status?: string;
    };
  };

  errors?: PayMongoError[];
}

type CheckoutStage =
  | "START"
  | "READ_ENVIRONMENT"
  | "READ_FORM"
  | "LOAD_PLANS"
  | "LOAD_PLAN_SETTING"
  | "CALCULATE_PRICE"
  | "CREATE_ORDER"
  | "CREATE_PAYMONGO_SESSION"
  | "SAVE_PAYMONGO_SESSION"
  | "COMPLETE";

function normalizeAppUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredUrl) {
    return normalizeAppUrl(configuredUrl);
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return normalizeAppUrl(
      `https://${vercelUrl}`,
    );
  }

  return "http://localhost:3000";
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return (
    digits.length >= 7 &&
    digits.length <= 15
  );
}

function formatData(bytes: number) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "Data plan";
  }

  const gigabytes =
    bytes / 1024 / 1024 / 1024;

  if (gigabytes < 1) {
    const megabytes =
      bytes / 1024 / 1024;

    return `${Math.round(
      megabytes,
    )} MB`;
  }

  const formattedGigabytes =
    Number.isInteger(gigabytes)
      ? gigabytes.toString()
      : gigabytes.toFixed(1);

  return `${formattedGigabytes} GB`;
}

function formatDurationUnit(
  durationUnit: string | undefined,
  duration: number,
) {
  const normalizedUnit =
    durationUnit
      ?.trim()
      .toLowerCase() || "day";

  if (duration === 1) {
    return normalizedUnit.endsWith("s")
      ? normalizedUnit.slice(0, -1)
      : normalizedUnit;
  }

  return normalizedUnit.endsWith("s")
    ? normalizedUnit
    : `${normalizedUnit}s`;
}

function sanitizeMetadataValue(
  value: string,
  maximumLength = 255,
) {
  return value
    .trim()
    .slice(0, maximumLength);
}

function getPaymentMethodTypes() {
  const configuredMethods =
    process.env.PAYMONGO_PAYMENT_METHODS
      ?.split(",")
      .map((method) =>
        method.trim().toLowerCase(),
      )
      .filter(Boolean);

  if (
    configuredMethods &&
    configuredMethods.length > 0
  ) {
    return configuredMethods;
  }

  return [
    "card",
    "gcash",
    "paymaya",
    "qrph",
  ];
}

async function readPayMongoResponse(
  response: Response,
): Promise<PayMongoCheckoutResponse> {
  const responseText =
    await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(
      responseText,
    ) as PayMongoCheckoutResponse;
  } catch {
    console.error(
      "PAYMONGO NON-JSON RESPONSE:",
      {
        status: response.status,
        responseText,
      },
    );

    return {};
  }
}

function getPayMongoErrorMessage(
  data: PayMongoCheckoutResponse,
) {
  const firstError =
    data.errors?.[0];

  if (!firstError) {
    return "Unable to create the PayMongo checkout session.";
  }

  const sourceInformation =
    firstError.source?.pointer ||
    firstError.source?.attribute;

  if (
    sourceInformation &&
    firstError.detail
  ) {
    return `${firstError.detail} (${sourceInformation})`;
  }

  return (
    firstError.detail ||
    firstError.code ||
    "Unable to create the PayMongo checkout session."
  );
}

function getSafeDatabaseInformation() {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      exists: false,
      protocol: "missing",
      usesLocalHost: false,
    };
  }

  return {
    exists: true,

    protocol:
      databaseUrl.split(":")[0] ??
      "unknown",

    usesLocalHost:
      databaseUrl.includes(
        "127.0.0.1",
      ) ||
      databaseUrl.includes(
        "localhost",
      ) ||
      databaseUrl.startsWith(
        "file:",
      ),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1500,
    );
  }

  return "Unknown checkout error.";
}

function findPlan(
  plans: EsimPackage[],
  packageCode: string,
) {
  return plans.find(
    (plan) =>
      plan.packageCode.trim() ===
      packageCode,
  );
}

export async function POST(
  request: Request,
) {
  let stage: CheckoutStage =
    "START";

  let createdOrderId:
    | string
    | null = null;

  let referenceNumber:
    | string
    | null = null;

  try {
    stage = "READ_ENVIRONMENT";

    const secretKey =
      process.env
        .PAYMONGO_SECRET_KEY
        ?.trim();

    const appUrl = getAppUrl();

    const databaseInformation =
      getSafeDatabaseInformation();

    console.info(
      "CHECKOUT ENVIRONMENT CHECK:",
      {
        stage,
        appUrl,

        paymongoSecretExists:
          Boolean(secretKey),

        databaseUrlExists:
          databaseInformation.exists,

        databaseProtocol:
          databaseInformation.protocol,

        databaseUsesLocalHost:
          databaseInformation
            .usesLocalHost,

        nodeEnvironment:
          process.env.NODE_ENV,

        vercelEnvironment:
          process.env.VERCEL_ENV ??
          "not-vercel",
      },
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
        {
          status: 500,
        },
      );
    }

    if (!databaseInformation.exists) {
      console.error(
        "DATABASE_URL is missing.",
      );

      return NextResponse.json(
        {
          error:
            "Order processing is temporarily unavailable.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      databaseInformation.usesLocalHost
    ) {
      console.error(
        "DATABASE_URL points to a local database.",
      );

      return NextResponse.json(
        {
          error:
            "The production database is not configured correctly.",
        },
        {
          status: 500,
        },
      );
    }

    stage = "READ_FORM";

    let formData: FormData;

    try {
      formData =
        await request.formData();
    } catch (error) {
      console.error(
        "CHECKOUT FORM PARSING ERROR:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "The submitted checkout form is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const packageCode = String(
      formData.get(
        "packageCode",
      ) ?? "",
    ).trim();

    const fullName = String(
      formData.get(
        "fullName",
      ) ?? "",
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
      formData.get(
        "acceptedTerms",
      ) === "on";

    if (!packageCode) {
      return NextResponse.json(
        {
          error:
            "No eSIM plan was selected.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fullName.length < 2 ||
      fullName.length > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid full name.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidEmail(email) ||
      email.length > 254
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid phone number.",
        },
        {
          status: 400,
        },
      );
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        {
          error:
            "You must confirm eSIM compatibility and accept the terms.",
        },
        {
          status: 400,
        },
      );
    }

    stage = "LOAD_PLANS";

    console.info(
      "CHECKOUT: Loading plan",
      {
        packageCode,
      },
    );

    const plans =
      await getPlans();

    const plan = findPlan(
      plans,
      packageCode,
    );

    if (!plan) {
      return NextResponse.json(
        {
          error:
            "The selected eSIM plan is no longer available.",
        },
        {
          status: 404,
        },
      );
    }

    stage =
      "LOAD_PLAN_SETTING";

    const planSetting =
      await prisma.planSetting.findUnique(
        {
          where: {
            packageCode:
              plan.packageCode,
          },
        },
      );

    if (
      planSetting?.enabled === false
    ) {
      return NextResponse.json(
        {
          error:
            "The selected eSIM plan is currently unavailable.",
        },
        {
          status: 404,
        },
      );
    }

    const planName =
      planSetting?.customName?.trim() ||
      plan.name ||
      plan.packageCode;

    stage =
      "CALCULATE_PRICE";

    /*
     * The price is calculated on the server.
     * A price sent by the browser is never trusted.
     */
    const pricing =
      await calculatePlanPrice(
        plan,
      );

    const sellingPriceUsd =
      pricing.sellingPriceUsd;

    const usdToPhpRate =
      pricing.usdToPhpRate;

    const amountInCentavos =
      pricing.amountPhpCentavos;

    if (
      !Number.isFinite(
        sellingPriceUsd,
      ) ||
      sellingPriceUsd <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The selected plan currently has an invalid price.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !Number.isFinite(
        usdToPhpRate,
      ) ||
      usdToPhpRate <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Payment conversion is temporarily unavailable.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !Number.isSafeInteger(
        amountInCentavos,
      ) ||
      amountInCentavos <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The converted payment amount is invalid.",
        },
        {
          status: 500,
        },
      );
    }

    referenceNumber =
      createReferenceNumber();

    stage = "CREATE_ORDER";

    console.info(
      "CHECKOUT: Creating pending order",
      {
        referenceNumber,
        packageCode:
          plan.packageCode,
        planName,
        sellingPriceUsd,
        usdToPhpRate,
        amountInCentavos,
        markupPercent:
          pricing.markupPercent,
      },
    );

    const order =
      await prisma.order.create({
        data: {
          referenceNumber,

          packageCode:
            plan.packageCode,

          planName,

          customerName:
            fullName,

          customerEmail:
            email,

          customerPhone:
            phone,

          sellingPriceUsd,

          amountPhpCentavos:
            amountInCentavos,

          usdToPhpRate,

          currency: "PHP",

          status: "PENDING",

          paymentStatus:
            "PENDING",

          esimStatus:
            "NOT_ORDERED",
        },
      });

    createdOrderId =
      order.id;

    console.info(
      "CHECKOUT: Order created",
      {
        orderId:
          order.id,

        referenceNumber,
      },
    );

    const authorization =
      Buffer.from(
        `${secretKey}:`,
      ).toString("base64");

    const duration =
      Number(plan.duration);

    const safeDuration =
      Number.isFinite(duration) &&
      duration > 0
        ? duration
        : 1;

    const validity =
      `${safeDuration} ${formatDurationUnit(
        plan.durationUnit,
        safeDuration,
      )}`;

    const checkoutPayload = {
      data: {
        attributes: {
          billing: {
            name:
              fullName,

            email,

            phone,
          },

          line_items: [
            {
              name:
                planName.slice(
                  0,
                  255,
                ),

              description:
                `${formatData(
                  plan.volume,
                )} eSIM — ${validity}`.slice(
                  0,
                  255,
                ),

              amount:
                amountInCentavos,

              currency:
                "PHP",

              quantity:
                1,
            },
          ],

          payment_method_types:
            getPaymentMethodTypes(),

          success_url:
            `${appUrl}/checkout/success?reference=${encodeURIComponent(
              referenceNumber,
            )}`,

          cancel_url:
            `${appUrl}/checkout?packageCode=${encodeURIComponent(
              plan.packageCode,
            )}&payment=cancelled`,

          reference_number:
            referenceNumber,

          description:
            `Seamarino eSIM order for ${fullName}`.slice(
              0,
              255,
            ),

          metadata: {
            order_id:
              sanitizeMetadataValue(
                order.id,
              ),

            reference_number:
              sanitizeMetadataValue(
                referenceNumber,
              ),

            package_code:
              sanitizeMetadataValue(
                plan.packageCode,
              ),

            plan_name:
              sanitizeMetadataValue(
                planName,
              ),

            customer_name:
              sanitizeMetadataValue(
                fullName,
              ),

            customer_email:
              sanitizeMetadataValue(
                email,
              ),

            customer_phone:
              sanitizeMetadataValue(
                phone,
              ),

            supplier_cost_usd:
              pricing.supplierCostUsd.toFixed(
                2,
              ),

            markup_percent:
              pricing.markupPercent.toString(),

            selling_price_usd:
              sellingPriceUsd.toFixed(
                2,
              ),

            amount_php:
              (
                amountInCentavos /
                100
              ).toFixed(2),

            usd_to_php_rate:
              usdToPhpRate.toString(),

            data_allowance:
              formatData(
                plan.volume,
              ),

            validity,
          },
        },
      },
    };

    stage =
      "CREATE_PAYMONGO_SESSION";

    console.info(
      "CHECKOUT: Creating PayMongo session",
      {
        orderId:
          order.id,

        referenceNumber,

        paymentMethods:
          getPaymentMethodTypes(),

        successUrl:
          checkoutPayload
            .data
            .attributes
            .success_url,

        cancelUrl:
          checkoutPayload
            .data
            .attributes
            .cancel_url,
      },
    );

    const paymongoResponse =
      await fetch(
        "https://api.paymongo.com/v2/checkout_sessions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Basic ${authorization}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              checkoutPayload,
            ),

          cache:
            "no-store",
        },
      );

    const paymongoData =
      await readPayMongoResponse(
        paymongoResponse,
      );

    if (
      !paymongoResponse.ok
    ) {
      const paymentError =
        getPayMongoErrorMessage(
          paymongoData,
        );

      await prisma.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          lastError:
            paymentError,

          lastAttemptAt:
            new Date(),

          processingAttempts: {
            increment: 1,
          },
        },
      });

      console.error(
        "PAYMONGO CHECKOUT SESSION ERROR:",
        JSON.stringify(
          {
            status:
              paymongoResponse.status,

            referenceNumber,

            response:
              paymongoData,
          },
          null,
          2,
        ),
      );

      return NextResponse.json(
        {
          error:
            paymentError,
        },
        {
          status:
            paymongoResponse.status >=
              400 &&
            paymongoResponse.status <
              600
              ? paymongoResponse.status
              : 502,
        },
      );
    }

    const checkoutUrl =
      paymongoData
        .data
        ?.attributes
        ?.checkout_url;

    const checkoutSessionId =
      paymongoData
        .data
        ?.id;

    if (
      !checkoutUrl ||
      !checkoutSessionId
    ) {
      const missingDataError =
        "PayMongo did not return a checkout URL or session ID.";

      await prisma.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          lastError:
            missingDataError,

          lastAttemptAt:
            new Date(),

          processingAttempts: {
            increment: 1,
          },
        },
      });

      console.error(
        "PAYMONGO INVALID RESPONSE:",
        paymongoData,
      );

      return NextResponse.json(
        {
          error:
            "The payment provider did not return a valid checkout link.",
        },
        {
          status:
            502,
        },
      );
    }

    stage =
      "SAVE_PAYMONGO_SESSION";

    await prisma.order.update({
      where: {
        id:
          order.id,
      },

      data: {
        paymongoSessionId:
          checkoutSessionId,

        lastError:
          null,
      },
    });

    stage =
      "COMPLETE";

    console.info(
      "CHECKOUT SESSION CREATED:",
      {
        stage,

        orderId:
          order.id,

        referenceNumber,

        checkoutSessionId,

        packageCode:
          plan.packageCode,

        planName,

        supplierCostUsd:
          pricing.supplierCostUsd,

        markupPercent:
          pricing.markupPercent,

        sellingPriceUsd,

        usdToPhpRate,

        amountInCentavos,
      },
    );

    return NextResponse.redirect(
      checkoutUrl,
      303,
    );
  } catch (error) {
    const errorMessage =
      getErrorMessage(
        error,
      );

    console.error(
      "CHECKOUT ROUTE ERROR:",
      {
        stage,

        createdOrderId,

        referenceNumber,

        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError",

        errorMessage,

        error,
      },
    );

    if (createdOrderId) {
      try {
        await prisma.order.update({
          where: {
            id:
              createdOrderId,
          },

          data: {
            lastError:
              `[${stage}] ${errorMessage}`.slice(
                0,
                1500,
              ),

            lastAttemptAt:
              new Date(),

            processingAttempts: {
              increment: 1,
            },
          },
        });
      } catch (databaseError) {
        console.error(
          "UNABLE TO SAVE CHECKOUT ERROR:",
          {
            createdOrderId,

            databaseError,
          },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while starting your payment. Please try again.",

        stage:
          process.env.NODE_ENV ===
          "development"
            ? stage
            : undefined,
      },
      {
        status:
          500,
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "This checkout endpoint only accepts form submissions.",

      instruction:
        "Open an eSIM plan and complete the checkout form.",
    },
    {
      status: 405,

      headers: {
        Allow: "POST",
      },
    },
  );
}