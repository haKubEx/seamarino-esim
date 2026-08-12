import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getSellingPrice } from "@/app/lib/pricing";

import {
  CouponValidationError,
  releaseCouponForOrder,
  reserveCouponForOrder,
  validateCoupon,
} from "@/app/services/coupons";

import { getPlans } from "@/app/services/plans";
import { getUsdToPhpRate } from "@/app/services/settings";

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
  | "CALCULATE_PRICE"
  | "VALIDATE_COUPON"
  | "CREATE_ORDER"
  | "RESERVE_COUPON"
  | "APPLY_STORE_CREDIT"
  | "CREATE_PAYMONGO_SESSION"
  | "SAVE_PAYMONGO_SESSION"
  | "COMPLETE";

function normalizeApplicationUrl(
  value: string,
) {
  const normalizedValue =
    value
      .trim()
      .replace(/\/+$/, "");

  if (
    normalizedValue.startsWith(
      "http://",
    ) ||
    normalizedValue.startsWith(
      "https://",
    )
  ) {
    return normalizedValue;
  }

  return `http://${normalizedValue}`;
}

function getApplicationUrl() {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_BASE_URL
      ?.trim();

  if (configuredUrl) {
    return normalizeApplicationUrl(
      configuredUrl,
    );
  }

  const authUrl =
    process.env.AUTH_URL?.trim();

  if (authUrl) {
    return normalizeApplicationUrl(
      authUrl,
    );
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return normalizeApplicationUrl(
      `https://${vercelUrl}`,
    );
  }

  return "http://localhost:3000";
}

function createReferenceNumber() {
  const randomCode =
    crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase();

  return `SEAMARINO-${Date.now()}-${randomCode}`;
}

function normalizeCouponCode(
  value: unknown,
) {
  return typeof value === "string"
    ? value
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "")
    : "";
}

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function isValidPhone(
  phone: string,
) {
  const digits =
    phone.replace(/\D/g, "");

  return (
    digits.length >= 7 &&
    digits.length <= 15
  );
}

function formatData(
  bytes: number,
) {
  const gigabytes =
    bytes /
    1024 /
    1024 /
    1024;

  if (gigabytes < 1) {
    const megabytes =
      bytes /
      1024 /
      1024;

    return `${Math.round(
      megabytes,
    )} MB`;
  }

  const formattedGigabytes =
    Number.isInteger(
      gigabytes,
    )
      ? gigabytes.toString()
      : gigabytes.toFixed(1);

  return `${formattedGigabytes} GB`;
}

function formatDurationUnit(
  durationUnit: string,
  duration: number,
) {
  const normalizedUnit =
    durationUnit
      .trim()
      .toLowerCase() ||
    "day";

  if (duration === 1) {
    return normalizedUnit.endsWith(
      "s",
    )
      ? normalizedUnit.slice(
          0,
          -1,
        )
      : normalizedUnit;
  }

  return normalizedUnit.endsWith(
    "s",
  )
    ? normalizedUnit
    : `${normalizedUnit}s`;
}

function sanitizeMetadataValue(
  value: string,
  maximumLength = 255,
) {
  return value
    .trim()
    .slice(
      0,
      maximumLength,
    );
}

function getPaymentMethodTypes():
  string[] {
  return ["qrph"];
}

function getErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1500,
    );
  }

  return "Unknown checkout error.";
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
        status:
          response.status,

        responseText:
          responseText.slice(
            0,
            2000,
          ),
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
    return "Unable to create the PayMongo QR Ph checkout session.";
  }

  const sourceInformation =
    firstError.source
      ?.pointer ||
    firstError.source
      ?.attribute;

  if (
    sourceInformation &&
    firstError.detail
  ) {
    return `${firstError.detail} (${sourceInformation})`;
  }

  return (
    firstError.detail ||
    firstError.code ||
    "Unable to create the PayMongo QR Ph checkout session."
  );
}

function getSafeDatabaseInformation() {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      exists: false,
      protocol: "missing",
    };
  }

  return {
    exists: true,

    protocol:
      databaseUrl.split(
        ":",
      )[0] ??
      "unknown",
  };
}

async function getWalletCheckoutSettings() {
  const settings =
    await prisma.appSetting.upsert({
      where: {
        id: "main",
      },

      update: {},

      create: {
        id: "main",
      },

      select: {
        maximumWalletUsagePercent:
          true,
      },
    });

  const maximumWalletUsagePercent =
    Math.min(
      100,
      Math.max(
        0,
        settings.maximumWalletUsagePercent,
      ),
    );

  return {
    maximumWalletUsagePercent,
  };
}

async function safelyReleaseCoupon(
  orderId: string | null,
) {
  if (!orderId) {
    return;
  }

  try {
    await releaseCouponForOrder(
      orderId,
    );
  } catch (error) {
    console.error(
      "UNABLE TO RELEASE COUPON RESERVATION:",
      {
        orderId,
        error:
          getErrorMessage(
            error,
          ),
      },
    );
  }
}

const MINIMUM_STORE_CREDIT_PLAN_BYTES =
  BigInt(10) *
  BigInt(1024) *
  BigInt(1024) *
  BigInt(1024);

/*
 * Keep at least ₱1.00 payable through PayMongo.
 *
 * This allows low-priced plans (for example ₱50)
 * to use store credit while still avoiding a
 * zero-peso PayMongo checkout.
 *
 * Fully store-credit-paid orders need a separate
 * direct fulfillment flow and are intentionally
 * not enabled in this version.
 */
const MINIMUM_PAYMONGO_AMOUNT_CENTAVOS =
  100;

/*
 * Daily-plan storefront rules.
 *
 * eSIM Access daily plans use dataType = 2.
 * Seamarino allows customers to choose 1-30 days
 * and adds a ₱50 markup for each selected day.
 */
const MINIMUM_DAILY_PLAN_DAYS = 1;
const MAXIMUM_DAILY_PLAN_DAYS = 30;
const DAILY_PLAN_MARKUP_PHP_CENTAVOS_PER_DAY =
  5_000;

function parseSelectedDays(
  value: FormDataEntryValue | null,
) {
  if (value === null) {
    return null;
  }

  const normalized =
    String(value).trim();

  if (!normalized) {
    return null;
  }

  const parsed =
    Number(normalized);

  return Number.isInteger(parsed)
    ? parsed
    : Number.NaN;
}

function roundCurrency(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
}

function calculateDailyPlanCheckoutPrice({
  supplierPrice,
  selectedDays,
  usdToPhpRate,
}: {
  supplierPrice: number;
  selectedDays: number;
  usdToPhpRate: number;
}) {
  const supplierCostUsdPerDay =
    supplierPrice / 10_000;

  if (
    !Number.isFinite(
      supplierCostUsdPerDay,
    ) ||
    supplierCostUsdPerDay <= 0
  ) {
    throw new Error(
      "The supplier daily price for this plan is invalid.",
    );
  }

  const supplierTotalUsd =
    supplierCostUsdPerDay *
    selectedDays;

  const supplierTotalPhpCentavos =
    Math.round(
      supplierTotalUsd *
        usdToPhpRate *
        100,
    );

  const markupPhpCentavos =
    DAILY_PLAN_MARKUP_PHP_CENTAVOS_PER_DAY *
    selectedDays;

  const subtotalPhpCentavos =
    supplierTotalPhpCentavos +
    markupPhpCentavos;

  const sellingPriceUsd =
    roundCurrency(
      subtotalPhpCentavos /
        100 /
        usdToPhpRate,
    );

  return {
    supplierCostUsdPerDay:
      roundCurrency(
        supplierCostUsdPerDay,
      ),

    supplierTotalUsd:
      roundCurrency(
        supplierTotalUsd,
      ),

    markupPhpCentavos,

    subtotalPhpCentavos,

    sellingPriceUsd,
  };
}

async function safelyRestoreStoreCredit({
  orderId,
  userId,
}: {
  orderId: string | null;
  userId: string | null;
}) {
  if (!orderId || !userId) {
    return;
  }

  try {
    await prisma.$transaction(
      async (transaction) => {
        const order =
          await transaction.order.findUnique({
            where: {
              id: orderId,
            },
            select: {
              id: true,
              referenceNumber: true,
              storeCreditUsedPhpCentavos: true,
            },
          });

        if (
          !order ||
          order.storeCreditUsedPhpCentavos <= 0
        ) {
          return;
        }

        const customer =
          await transaction.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              id: true,
              storeCreditPhpCentavos: true,
            },
          });

        if (!customer) {
          throw new Error(
            "The customer account could not be found while restoring store credit.",
          );
        }

        const restoreAmount =
          order.storeCreditUsedPhpCentavos;

        const claimed =
          await transaction.order.updateMany({
            where: {
              id: order.id,
              storeCreditUsedPhpCentavos: {
                gt: 0,
              },
            },
            data: {
              storeCreditUsedPhpCentavos: 0,
              amountPhpCentavos: {
                increment: restoreAmount,
              },
            },
          });

        if (claimed.count !== 1) {
          return;
        }

        const balanceBefore =
          customer.storeCreditPhpCentavos;

        const balanceAfter =
          balanceBefore + restoreAmount;

        await transaction.user.update({
          where: {
            id: customer.id,
          },
          data: {
            storeCreditPhpCentavos: {
              increment: restoreAmount,
            },
          },
        });

        await transaction.storeCreditTransaction.create({
          data: {
            userId: customer.id,
            type: "REFUND",
            amountPhpCentavos: restoreAmount,
            balanceBeforePhpCentavos: balanceBefore,
            balanceAfterPhpCentavos: balanceAfter,
            orderId: order.id,
            description:
              `Store credit restored because checkout for ${order.referenceNumber} did not complete.`,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  } catch (error) {
    console.error(
      "UNABLE TO RESTORE STORE CREDIT:",
      {
        orderId,
        userId,
        error: getErrorMessage(error),
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  let stage:
    CheckoutStage =
    "START";

  let createdOrderId:
    | string
    | null = null;

  let referenceNumber:
    | string
    | null = null;

  let couponReserved =
    false;

  let storeCreditReserved =
    false;

  let storeCreditUserId:
    | string
    | null = null;

  try {
    stage =
      "READ_ENVIRONMENT";

    const secretKey =
      process.env
        .PAYMONGO_SECRET_KEY
        ?.trim();

    const appUrl =
      getApplicationUrl();

    const databaseInformation =
      getSafeDatabaseInformation();

    const session =
      await auth();

    const authenticatedUserId =
      session?.user?.id ??
      null;

    const [
      usdToPhpRate,
      walletCheckoutSettings,
    ] = await Promise.all([
      getUsdToPhpRate(),
      getWalletCheckoutSettings(),
    ]);

    const maximumWalletUsagePercent =
      walletCheckoutSettings
        .maximumWalletUsagePercent;

    console.info(
      "CHECKOUT ENVIRONMENT:",
      {
        stage,
        appUrl,
        authenticatedUserId,

        paymongoSecretExists:
          Boolean(
            secretKey,
          ),

        databaseUrlExists:
          databaseInformation
            .exists,

        databaseProtocol:
          databaseInformation
            .protocol,

        usdToPhpRate,

        maximumWalletUsagePercent,

        paymentMethods:
          getPaymentMethodTypes(),

        nodeEnvironment:
          process.env.NODE_ENV,

        vercelEnvironment:
          process.env
            .VERCEL_ENV ??
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

    if (
      !databaseInformation.exists
    ) {
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
      !Number.isFinite(
        usdToPhpRate,
      ) ||
      usdToPhpRate <= 0
    ) {
      console.error(
        "USD-to-PHP exchange rate is invalid:",
        usdToPhpRate,
      );

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

    stage =
      "READ_FORM";

    let formData:
      FormData;

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

    const packageCode =
      String(
        formData.get(
          "packageCode",
        ) ?? "",
      ).trim();

    const fullName =
      String(
        formData.get(
          "fullName",
        ) ?? "",
      ).trim();

    const email =
      String(
        formData.get(
          "email",
        ) ?? "",
      )
        .trim()
        .toLowerCase();

    const phone =
      String(
        formData.get(
          "phone",
        ) ?? "",
      ).trim();

    const couponCode =
      normalizeCouponCode(
        formData.get(
          "couponCode",
        ),
      );

    const acceptedTerms =
      formData.get(
        "acceptedTerms",
      ) === "on";

    const useStoreCredit =
      ["on", "true", "1"].includes(
        String(
          formData.get(
            "useStoreCredit",
          ) ?? "",
        )
          .trim()
          .toLowerCase(),
      );

    const submittedSelectedDays =
      parseSelectedDays(
        formData.get(
          "selectedDays",
        ),
      );

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
      !isValidEmail(
        email,
      ) ||
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

    if (
      !isValidPhone(
        phone,
      )
    ) {
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

    stage =
      "LOAD_PLANS";

    console.info(
      "CHECKOUT: Loading selected plan",
      {
        packageCode,
        couponCode:
          couponCode ||
          null,
      },
    );

    const plans:
      EsimPackage[] =
      await getPlans();

    const plan =
      plans.find(
        (item) =>
          item.packageCode ===
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

    const isDailyPlan =
      Number(plan.dataType) === 2;

    /*
     * Daily plans require a selectable validity.
     *
     * Missing selectedDays defaults to 1 for
     * backwards compatibility while the new
     * storefront selector is being rolled out.
     */
    const selectedDays =
      isDailyPlan
        ? submittedSelectedDays ??
          MINIMUM_DAILY_PLAN_DAYS
        : null;

    if (isDailyPlan) {
      if (
        selectedDays === null ||
        !Number.isInteger(
          selectedDays,
        ) ||
        selectedDays <
          MINIMUM_DAILY_PLAN_DAYS ||
        selectedDays >
          MAXIMUM_DAILY_PLAN_DAYS
      ) {
        return NextResponse.json(
          {
            error:
              `Choose between ${MINIMUM_DAILY_PLAN_DAYS} and ${MAXIMUM_DAILY_PLAN_DAYS} days for this daily eSIM plan.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      !isDailyPlan &&
      submittedSelectedDays !==
        null
    ) {
      /*
       * Ignore duration values submitted for
       * normal fixed-duration plans. The supplier
       * package itself controls their validity.
       */
      console.info(
        "CHECKOUT: Ignoring selectedDays for fixed plan",
        {
          packageCode:
            plan.packageCode,

          submittedSelectedDays,
        },
      );
    }

    stage =
      "CALCULATE_PRICE";

    let sellingPriceUsd:
      number;

    let subtotalPhpCentavos:
      number;

    let dailySupplierTotalUsd:
      number | null =
      null;

    let dailyMarkupPhpCentavos =
      0;

    if (
      isDailyPlan &&
      selectedDays !== null
    ) {
      const dailyPrice =
        calculateDailyPlanCheckoutPrice({
          supplierPrice:
            Number(plan.price),

          selectedDays,

          usdToPhpRate,
        });

      sellingPriceUsd =
        dailyPrice.sellingPriceUsd;

      subtotalPhpCentavos =
        dailyPrice
          .subtotalPhpCentavos;

      dailySupplierTotalUsd =
        dailyPrice
          .supplierTotalUsd;

      dailyMarkupPhpCentavos =
        dailyPrice
          .markupPhpCentavos;
    } else {
      sellingPriceUsd =
        Number(
          plan.sellingPriceUsd,
        );

      if (
        !Number.isFinite(
          sellingPriceUsd,
        ) ||
        sellingPriceUsd <= 0
      ) {
        sellingPriceUsd =
          Number(
            getSellingPrice(
              plan.price,
              plan.volume,
              plan.markupPercent,
            ),
          );
      }

      if (
        !Number.isFinite(
          sellingPriceUsd,
        ) ||
        sellingPriceUsd <= 0
      ) {
        console.error(
          "CHECKOUT INVALID SELLING PRICE:",
          {
            packageCode:
              plan.packageCode,

            supplierPrice:
              plan.price,

            volume:
              plan.volume,

            sellingPriceUsd,
          },
        );

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

      subtotalPhpCentavos =
        Number(
          plan.amountPhpCentavos,
        );

      if (
        !Number.isSafeInteger(
          subtotalPhpCentavos,
        ) ||
        subtotalPhpCentavos <= 0
      ) {
        subtotalPhpCentavos =
          Math.round(
            sellingPriceUsd *
              usdToPhpRate *
              100,
          );
      }
    }

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
      !Number.isSafeInteger(
        subtotalPhpCentavos,
      ) ||
      subtotalPhpCentavos <= 0
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

    let discountPhpCentavos =
      0;

    let finalPhpCentavos =
      subtotalPhpCentavos;

    let validatedCoupon:
      | Awaited<
          ReturnType<
            typeof validateCoupon
          >
        >
      | null = null;

    if (couponCode) {
      stage =
        "VALIDATE_COUPON";

      try {
        validatedCoupon =
          await validateCoupon({
            code:
              couponCode,

            subtotalPhpCentavos,

            packageCode:
              plan.packageCode,

            customerEmail:
              email,

            userId:
              authenticatedUserId,
          });
      } catch (error) {
        if (
          error instanceof
          CouponValidationError
        ) {
          return NextResponse.json(
            {
              error:
                error.message,

              code:
                error.code,
            },
            {
              status:
                error.status,
            },
          );
        }

        throw error;
      }

      discountPhpCentavos =
        validatedCoupon
          .discountPhpCentavos;

      finalPhpCentavos =
        validatedCoupon
          .finalPhpCentavos;
    }

    if (
      !Number.isSafeInteger(
        finalPhpCentavos,
      ) ||
      finalPhpCentavos <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The final payment amount is invalid.",
        },
        {
          status: 500,
        },
      );
    }

    referenceNumber =
      createReferenceNumber();

    stage =
      "CREATE_ORDER";

    console.info(
      "CHECKOUT: Creating pending order",
      {
        referenceNumber,

        packageCode:
          plan.packageCode,

        subtotalPhpCentavos,
        discountPhpCentavos,
        finalPhpCentavos,

        couponCode:
          validatedCoupon
            ?.coupon.code ??
          null,

        isDailyPlan,

        selectedDays,

        dailySupplierTotalUsd,

        dailyMarkupPhpCentavos,
      },
    );

    const order =
      await prisma.order.create({
        data: {
          userId:
            authenticatedUserId,

          referenceNumber,

          packageCode:
            plan.packageCode,

          planName:
            plan.name,

          dataVolumeBytes:
            BigInt(plan.volume),

          selectedDays,

          customerName:
            fullName,

          customerEmail:
            email,

          customerPhone:
            phone,

          sellingPriceUsd,

          subtotalPhpCentavos,

          discountPhpCentavos,

          amountPhpCentavos:
            finalPhpCentavos,

          usdToPhpRate,

          currency:
            "PHP",

          couponId:
            validatedCoupon
              ?.coupon.id ??
            null,

          couponCodeSnapshot:
            validatedCoupon
              ?.coupon.code ??
            null,

          couponNameSnapshot:
            validatedCoupon
              ?.coupon.name ??
            null,

          couponDiscountTypeSnapshot:
            validatedCoupon
              ?.coupon
              .discountType ??
            null,

          couponDiscountValueSnapshot:
            validatedCoupon
              ?.coupon
              .discountValue ??
            null,

          status:
            "PENDING",

          paymentStatus:
            "PENDING",

          esimStatus:
            "NOT_ORDERED",

          paymentMethod:
            "qrph",
        },
      });

    createdOrderId =
      order.id;

    if (couponCode) {
      stage =
        "RESERVE_COUPON";

      try {
        const reservation =
          await reserveCouponForOrder({
            orderId:
              order.id,

            code:
              couponCode,

            subtotalPhpCentavos,

            packageCode:
              plan.packageCode,

            customerEmail:
              email,

            userId:
              authenticatedUserId,

            reservationMinutes:
              30,
          });

        couponReserved =
          true;

        /*
         * Save the authoritative reservation values.
         * This protects against concurrent usage-limit
         * changes between initial validation and order
         * creation.
         */
        discountPhpCentavos =
          reservation
            .discountPhpCentavos;

        finalPhpCentavos =
          reservation
            .finalPhpCentavos;

        await prisma.order.update({
          where: {
            id:
              order.id,
          },

          data: {
            couponId:
              reservation
                .coupon.id,

            couponCodeSnapshot:
              reservation
                .coupon.code,

            couponNameSnapshot:
              reservation
                .coupon.name,

            couponDiscountTypeSnapshot:
              reservation
                .coupon
                .discountType,

            couponDiscountValueSnapshot:
              reservation
                .coupon
                .discountValue,

            subtotalPhpCentavos:
              reservation
                .subtotalPhpCentavos,

            discountPhpCentavos:
              reservation
                .discountPhpCentavos,

            amountPhpCentavos:
              reservation
                .finalPhpCentavos,
          },
        });
      } catch (error) {
        if (
          error instanceof
          CouponValidationError
        ) {
          await prisma.order.update({
            where: {
              id:
                order.id,
            },

            data: {
              lastError:
                error.message,

              lastAttemptAt:
                new Date(),
            },
          });

          return NextResponse.json(
            {
              error:
                error.message,

              code:
                error.code,
            },
            {
              status:
                error.status,
            },
          );
        }

        throw error;
      }
    }

    if (useStoreCredit) {
      if (!authenticatedUserId) {
        return NextResponse.json(
          {
            error:
              "Sign in before using store credit.",
          },
          {
            status: 401,
          },
        );
      }

      if (
        BigInt(plan.volume) <
        MINIMUM_STORE_CREDIT_PLAN_BYTES
      ) {
        return NextResponse.json(
          {
            error:
              "Store credit can only be used on eSIM plans with at least 10GB of data.",
          },
          {
            status: 400,
          },
        );
      }

      stage =
        "APPLY_STORE_CREDIT";

      const creditResult =
        await prisma.$transaction(
          async (transaction) => {
            const customer =
              await transaction.user.findUnique({
                where: {
                  id: authenticatedUserId,
                },
                select: {
                  id: true,
                  email: true,
                  storeCreditPhpCentavos: true,
                },
              });

            if (!customer) {
              throw new Error(
                "The signed-in customer account could not be found.",
              );
            }

            if (
              customer.email
                .trim()
                .toLowerCase() !== email
            ) {
              throw new Error(
                "Use the email address connected to your signed-in account when applying store credit.",
              );
            }

            /*
             * Respect both checkout safety rules:
             *
             * 1. Admin-configured maximum wallet usage
             *    percentage.
             *
             * 2. Keep at least ₱1.00 payable through
             *    PayMongo because fully wallet-paid
             *    orders use a different fulfillment flow.
             */
            const maximumByPercentage =
              Math.floor(
                finalPhpCentavos *
                  (maximumWalletUsagePercent /
                    100),
              );

            const maximumByPayMongo =
              Math.max(
                0,
                finalPhpCentavos -
                  MINIMUM_PAYMONGO_AMOUNT_CENTAVOS,
              );

            const maximumApplicableCredit =
              Math.min(
                maximumByPercentage,
                maximumByPayMongo,
              );

            const creditToUse =
              Math.min(
                customer.storeCreditPhpCentavos,
                maximumApplicableCredit,
              );

            if (creditToUse <= 0) {
              return {
                usedPhpCentavos: 0,
                remainingPhpCentavos:
                  finalPhpCentavos,
              };
            }

            const deducted =
              await transaction.user.updateMany({
                where: {
                  id: customer.id,
                  storeCreditPhpCentavos: {
                    gte: creditToUse,
                  },
                },
                data: {
                  storeCreditPhpCentavos: {
                    decrement: creditToUse,
                  },
                },
              });

            if (deducted.count !== 1) {
              throw new Error(
                "Your store-credit balance changed. Please try checkout again.",
              );
            }

            const balanceBefore =
              customer.storeCreditPhpCentavos;

            const balanceAfter =
              balanceBefore - creditToUse;

            const remainingPhpCentavos =
              finalPhpCentavos - creditToUse;

            await transaction.order.update({
              where: {
                id: order.id,
              },
              data: {
                storeCreditUsedPhpCentavos:
                  creditToUse,
                amountPhpCentavos:
                  remainingPhpCentavos,
              },
            });

            await transaction.storeCreditTransaction.create({
              data: {
                userId: customer.id,
                type: "ORDER_PAYMENT",
                amountPhpCentavos:
                  -creditToUse,
                balanceBeforePhpCentavos:
                  balanceBefore,
                balanceAfterPhpCentavos:
                  balanceAfter,
                orderId: order.id,
                description:
                  `Store credit applied to ${order.referenceNumber}.`,
              },
            });

            return {
              usedPhpCentavos:
                creditToUse,
              remainingPhpCentavos,
            };
          },
          {
            isolationLevel:
              "Serializable",
          },
        );

      if (
        creditResult.usedPhpCentavos > 0
      ) {
        storeCreditReserved =
          true;

        storeCreditUserId =
          authenticatedUserId;

        finalPhpCentavos =
          creditResult.remainingPhpCentavos;
      }
    }

    const authorization =
      Buffer.from(
        `${secretKey}:`,
      ).toString(
        "base64",
      );

    const validity =
      isDailyPlan &&
      selectedDays !== null
        ? `${selectedDays} ${
            selectedDays === 1
              ? "day"
              : "days"
          }`
        : `${plan.duration} ${formatDurationUnit(
            plan.durationUnit,
            plan.duration,
          )}`;

    const successUrl =
      `${appUrl}/checkout/success?reference=${encodeURIComponent(
        referenceNumber,
      )}`;

    const cancelUrl =
      `${appUrl}/checkout?packageCode=${encodeURIComponent(
        plan.packageCode,
      )}&payment=cancelled`;

    console.info(
      "CHECKOUT REDIRECT URLS:",
      {
        appUrl,
        successUrl,
        cancelUrl,
      },
    );

    const lineItemDescription =
      couponCode
        ? `${formatData(
            plan.volume,
          )} eSIM — ${validity} — Coupon ${couponCode}`
        : `${formatData(
            plan.volume,
          )} eSIM — ${validity}`;

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
                plan.name.slice(
                  0,
                  255,
                ),

              description:
                lineItemDescription.slice(
                  0,
                  255,
                ),

              amount:
                finalPhpCentavos,

              currency:
                "PHP",

              quantity:
                1,
            },
          ],

          payment_method_types:
            getPaymentMethodTypes(),

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,

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
                plan.name,
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

            payment_method:
              "qrph",

            selling_price_usd:
              sellingPriceUsd.toFixed(
                2,
              ),

            subtotal_php:
              (
                subtotalPhpCentavos /
                100
              ).toFixed(2),

            discount_php:
              (
                discountPhpCentavos /
                100
              ).toFixed(2),

            store_credit_php:
              (
                (storeCreditReserved
                  ? (
                      subtotalPhpCentavos -
                      discountPhpCentavos -
                      finalPhpCentavos
                    )
                  : 0) /
                100
              ).toFixed(2),

            maximum_wallet_usage_percent:
              maximumWalletUsagePercent.toString(),

            amount_php:
              (
                finalPhpCentavos /
                100
              ).toFixed(2),

            coupon_code:
              validatedCoupon
                ?.coupon.code ??
              "",

            usd_to_php_rate:
              usdToPhpRate.toString(),

            data_allowance:
              isDailyPlan
                ? `${formatData(
                    plan.volume,
                  )} / day`
                : formatData(
                    plan.volume,
                  ),

            selected_days:
              selectedDays?.toString() ??
              "",

            daily_plan:
              isDailyPlan
                ? "true"
                : "false",

            daily_markup_php:
              (
                dailyMarkupPhpCentavos /
                100
              ).toFixed(2),

            validity,
          },
        },
      },
    };

    stage =
      "CREATE_PAYMONGO_SESSION";

    console.info(
      "CHECKOUT: Creating PayMongo QR Ph session",
      {
        orderId:
          order.id,

        referenceNumber,

        subtotalPhpCentavos,
        discountPhpCentavos,
        finalPhpCentavos,

        couponCode:
          validatedCoupon
            ?.coupon.code ??
          null,

        paymentMethods:
          getPaymentMethodTypes(),

        successUrl,
        cancelUrl,
      },
    );

    const paymongoResponse =
      await fetch(
        "https://api.paymongo.com/v2/checkout_sessions",
        {
          method:
            "POST",

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

      if (couponReserved) {
        await safelyReleaseCoupon(
          order.id,
        );

        couponReserved =
          false;
      }

      if (storeCreditReserved) {
        await safelyRestoreStoreCredit({
          orderId: order.id,
          userId: storeCreditUserId,
        });

        storeCreditReserved =
          false;
      }

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
            increment:
              1,
          },
        },
      });

      console.error(
        "PAYMONGO QR PH CHECKOUT ERROR:",
        JSON.stringify(
          {
            status:
              paymongoResponse
                .status,

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
            paymongoResponse
              .status >= 400 &&
            paymongoResponse
              .status < 600
              ? paymongoResponse
                  .status
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

      if (couponReserved) {
        await safelyReleaseCoupon(
          order.id,
        );

        couponReserved =
          false;
      }

      if (storeCreditReserved) {
        await safelyRestoreStoreCredit({
          orderId: order.id,
          userId: storeCreditUserId,
        });

        storeCreditReserved =
          false;
      }

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
            increment:
              1,
          },
        },
      });

      console.error(
        "PAYMONGO INVALID CHECKOUT RESPONSE:",
        paymongoData,
      );

      return NextResponse.json(
        {
          error:
            "The payment provider did not return a valid QR Ph checkout link.",
        },
        {
          status: 502,
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

        paymentMethod:
          "qrph",

        lastError:
          null,
      },
    });

    stage =
      "COMPLETE";

    console.info(
      "QR PH CHECKOUT SESSION CREATED:",
      {
        stage,

        orderId:
          order.id,

        referenceNumber,

        checkoutSessionId,

        subtotalPhpCentavos,
        discountPhpCentavos,
        finalPhpCentavos,

        couponCode:
          validatedCoupon
            ?.coupon.code ??
          null,

        isDailyPlan,
        selectedDays,

        checkoutUrl,
        successUrl,
        cancelUrl,
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
        errorMessage,
        error,
      },
    );

    if (
      createdOrderId &&
      couponReserved
    ) {
      await safelyReleaseCoupon(
        createdOrderId,
      );
    }

    if (
      createdOrderId &&
      storeCreditReserved
    ) {
      await safelyRestoreStoreCredit({
        orderId: createdOrderId,
        userId: storeCreditUserId,
      });
    }

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
              increment:
                1,
            },
          },
        });
      } catch (
        databaseError
      ) {
        console.error(
          "UNABLE TO SAVE CHECKOUT ERROR:",
          {
            createdOrderId,
            databaseError,
          },
        );
      }
    }

    if (
      error instanceof
      CouponValidationError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,

          code:
            error.code,
        },
        {
          status:
            error.status,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while starting your QR Ph payment. Please try again.",

        stage:
          process.env
            .NODE_ENV ===
          "development"
            ? stage
            : undefined,

        details:
          process.env
            .NODE_ENV ===
          "development"
            ? errorMessage
            : undefined,
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
        "This checkout endpoint only accepts checkout form submissions.",

      paymentMethod:
        "QR Ph",

      applicationUrl:
        getApplicationUrl(),

      instruction:
        "Open an eSIM plan and complete the checkout form.",
    },
    {
      status: 405,

      headers: {
        Allow:
          "POST",
      },
    },
  );
}