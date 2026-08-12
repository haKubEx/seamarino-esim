import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";

import {
  CouponValidationError,
  validateCoupon,
} from "@/app/services/coupons";

import { getPlans } from "@/app/services/plans";

import {
  calculatePlanPrice,
} from "@/app/services/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MINIMUM_DAILY_PLAN_DAYS = 1;
const MAXIMUM_DAILY_PLAN_DAYS = 30;

type CouponValidationBody = {
  code?: unknown;
  packageCode?: unknown;
  customerEmail?: unknown;
  selectedDays?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function normalizeText(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeCouponCode(
  value: unknown,
): string {
  return normalizeText(value)
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeEmail(
  value: unknown,
): string {
  return normalizeText(value)
    .toLowerCase();
}

function normalizePackageCode(
  value: unknown,
): string {
  return normalizeText(value)
    .toUpperCase();
}

function parseSelectedDays(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : Number.NaN;
}

function formatPhp(
  centavos: number,
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    centavos / 100,
  );
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1_500,
    );
  }

  return "Unknown coupon-validation error.";
}

export async function POST(
  request: NextRequest,
) {
  try {
    let body:
      CouponValidationBody;

    try {
      body =
        (await request.json()) as
          CouponValidationBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "The coupon request body is invalid.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const code =
      normalizeCouponCode(
        body.code,
      );

    const packageCode =
      normalizePackageCode(
        body.packageCode,
      );

    const submittedEmail =
      normalizeEmail(
        body.customerEmail,
      );

    const submittedSelectedDays =
      parseSelectedDays(
        body.selectedDays,
      );

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "Enter a coupon code.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (!packageCode) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "The selected eSIM plan is missing.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const session =
      await auth();

    const sessionEmail =
      normalizeEmail(
        session?.user?.email,
      );

    const customerEmail =
      submittedEmail ||
      sessionEmail;

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "Enter your email address before applying a coupon.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * When a signed-in customer applies a coupon,
     * do not allow another email address to be used
     * to bypass per-customer limits.
     */
    if (
      sessionEmail &&
      submittedEmail &&
      submittedEmail !==
        sessionEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "The checkout email must match your signed-in account.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const plans =
      await getPlans();

    const plan =
      plans.find(
        (item) =>
          item.packageCode
            .trim()
            .toUpperCase() ===
          packageCode,
      );

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "The selected eSIM plan is no longer available.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const isDailyPlan =
      Number(plan.dataType) === 2;

    /*
     * Daily plans must validate the coupon against
     * the exact same selected-day subtotal that the
     * checkout route will charge.
     *
     * Fixed-duration plans ignore selectedDays.
     */
    const selectedDays =
      isDailyPlan
        ? submittedSelectedDays ??
          MINIMUM_DAILY_PLAN_DAYS
        : undefined;

    if (isDailyPlan) {
      if (
        selectedDays === undefined ||
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
            success: false,
            valid: false,
            error:
              `Choose between ${MINIMUM_DAILY_PLAN_DAYS} and ${MAXIMUM_DAILY_PLAN_DAYS} days for this daily eSIM plan.`,
          },
          {
            status: 400,
            headers:
              noStoreHeaders(),
          },
        );
      }
    }

    const pricing =
      await calculatePlanPrice(
        plan,
        {
          selectedDays,
        },
      );

    const subtotalPhpCentavos =
      pricing.amountPhpCentavos;

    if (
      !Number.isSafeInteger(
        subtotalPhpCentavos,
      ) ||
      subtotalPhpCentavos <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error:
            "The selected plan currently has an invalid checkout amount.",
        },
        {
          status: 500,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const validation =
      await validateCoupon({
        code,
        packageCode:
          plan.packageCode,

        customerEmail,

        userId:
          session?.user?.id ??
          null,

        subtotalPhpCentavos,
      });

    return NextResponse.json(
      {
        success: true,
        valid: true,

        dailyPlan:
          isDailyPlan,

        selectedDays:
          isDailyPlan
            ? selectedDays
            : null,

        coupon: {
          code:
            validation
              .coupon.code,

          name:
            validation
              .coupon.name,

          description:
            validation
              .coupon
              .description,

          discountType:
            validation
              .coupon
              .discountType,

          discountValue:
            validation
              .coupon
              .discountValue,
        },

        pricing: {
          subtotalPhpCentavos:
            validation
              .subtotalPhpCentavos,

          discountPhpCentavos:
            validation
              .discountPhpCentavos,

          finalPhpCentavos:
            validation
              .finalPhpCentavos,

          subtotalFormatted:
            formatPhp(
              validation
                .subtotalPhpCentavos,
            ),

          discountFormatted:
            formatPhp(
              validation
                .discountPhpCentavos,
            ),

          finalFormatted:
            formatPhp(
              validation
                .finalPhpCentavos,
            ),
        },

        message:
          validation.message,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    if (
      error instanceof
      CouponValidationError
    ) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          code:
            error.code,
          error:
            error.message,
        },
        {
          status:
            error.status,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const message =
      getErrorMessage(error);

    console.error(
      "PUBLIC COUPON VALIDATION ERROR:",
      {
        error: message,
      },
    );

    return NextResponse.json(
      {
        success: false,
        valid: false,

        error:
          process.env.NODE_ENV ===
          "development"
            ? message
            : "Unable to validate the coupon.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        "This endpoint accepts coupon validation requests using POST.",
    },
    {
      status: 405,
      headers: {
        ...noStoreHeaders(),
        Allow: "POST",
      },
    },
  );
}