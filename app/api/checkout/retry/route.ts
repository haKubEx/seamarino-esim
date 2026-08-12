import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PayMongoError = {
  detail?: string;
  code?: string;

  source?: {
    pointer?: string;
    attribute?: string;
  };
};

type PayMongoCheckoutResponse = {
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
};

function normalizeApplicationUrl(
  value: string,
) {
  const normalized =
    value
      .trim()
      .replace(/\/+$/, "");

  if (
    normalized.startsWith(
      "http://",
    ) ||
    normalized.startsWith(
      "https://",
    )
  ) {
    return normalized;
  }

  return `http://${normalized}`;
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

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message.slice(
        0,
        1500,
      )
    : "Unknown retry-payment error.";
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

function formatPhp(
  amountPhpCentavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    amountPhpCentavos / 100,
  );
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
      "PAYMONGO RETRY NON-JSON RESPONSE:",
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
  response:
    PayMongoCheckoutResponse,
) {
  const firstError =
    response.errors?.[0];

  if (!firstError) {
    return (
      "Unable to create a new " +
      "PayMongo payment session."
    );
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
    return (
      `${firstError.detail} ` +
      `(${sourceInformation})`
    );
  }

  return (
    firstError.detail ||
    firstError.code ||
    "Unable to create a new PayMongo payment session."
  );
}

export async function POST(
  request: Request,
) {
  const session =
    await auth();

  if (!session?.user?.id) {
    const loginUrl =
      `${getApplicationUrl()}` +
      "/login?callbackUrl=" +
      encodeURIComponent(
        "/account/orders",
      );

    return NextResponse.redirect(
      loginUrl,
      303,
    );
  }

  try {
    const secretKey =
      process.env
        .PAYMONGO_SECRET_KEY
        ?.trim();

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment processing is temporarily unavailable.",
        },
        {
          status: 500,
        },
      );
    }

    let formData:
      FormData;

    try {
      formData =
        await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "The retry-payment request is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const referenceNumber =
      String(
        formData.get(
          "referenceNumber",
        ) ?? "",
      ).trim();

    if (!referenceNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order reference number is required.",
        },
        {
          status: 400,
        },
      );
    }

    const order =
      await prisma.order.findFirst({
        where: {
          referenceNumber,

          userId:
            session.user.id,
        },

        select: {
          id: true,
          referenceNumber: true,

          packageCode: true,
          planName: true,

          customerName: true,
          customerEmail: true,
          customerPhone: true,

          currency: true,

          /*
           * Pricing breakdown.
           */
          subtotalPhpCentavos:
            true,

          discountPhpCentavos:
            true,

          storeCreditUsedPhpCentavos:
            true,

          amountPhpCentavos:
            true,

          couponCodeSnapshot:
            true,

          status: true,
          paymentStatus: true,
          esimStatus: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      order.paymentStatus !==
        "PENDING" ||
      order.status !==
        "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only pending unpaid orders can continue payment.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      order.esimStatus !==
      "NOT_ORDERED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment cannot be retried because eSIM processing has already started.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !Number.isSafeInteger(
        order.amountPhpCentavos,
      ) ||
      order.amountPhpCentavos <=
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This order has an invalid payment amount.",
        },
        {
          status: 409,
        },
      );
    }

    const subtotalPhpCentavos =
      order.subtotalPhpCentavos ??
      (
        order.amountPhpCentavos +
        order.discountPhpCentavos +
        order.storeCreditUsedPhpCentavos
      );

    const couponDiscountPhpCentavos =
      Math.max(
        0,
        order.discountPhpCentavos,
      );

    const storeCreditPhpCentavos =
      Math.max(
        0,
        order
          .storeCreditUsedPhpCentavos,
      );

    const finalAmountPhpCentavos =
      order.amountPhpCentavos;

    const originalPriceText =
      formatPhp(
        subtotalPhpCentavos,
      );

    const couponDiscountText =
      formatPhp(
        couponDiscountPhpCentavos,
      );

    const storeCreditText =
      formatPhp(
        storeCreditPhpCentavos,
      );

    const finalAmountText =
      formatPhp(
        finalAmountPhpCentavos,
      );

    /*
     * PayMongo charges only the final amount.
     *
     * The original price and deductions are
     * included in the visible line-item
     * description.
     */
    const breakdownParts = [
      `Original: ${originalPriceText}`,

      storeCreditPhpCentavos > 0
        ? `Referral credit: -${storeCreditText}`
        : "Referral credit: ₱0.00",

      couponDiscountPhpCentavos > 0
        ? (
            order.couponCodeSnapshot
              ? (
                  `Coupon ${order.couponCodeSnapshot}: ` +
                  `-${couponDiscountText}`
                )
              : (
                  `Coupon discount: ` +
                  `-${couponDiscountText}`
                )
          )
        : "Coupon discount: ₱0.00",

      `Total: ${finalAmountText}`,
    ];

    const priceBreakdown =
      breakdownParts.join(
        " | ",
      );

    const appUrl =
      getApplicationUrl();

    const successUrl =
      `${appUrl}` +
      "/checkout/success" +
      `?reference=${encodeURIComponent(
        order.referenceNumber,
      )}`;

    const cancelUrl =
      `${appUrl}` +
      "/account/orders/" +
      encodeURIComponent(
        order.referenceNumber,
      ) +
      "?payment=cancelled";

    const authorization =
      Buffer.from(
        `${secretKey}:`,
      ).toString(
        "base64",
      );

    const checkoutPayload = {
      data: {
        attributes: {
          billing: {
            name:
              order.customerName,

            email:
              order.customerEmail,

            phone:
              order.customerPhone,
          },

          line_items: [
            {
              /*
               * The amount must remain the
               * final amount payable.
               */
              amount:
                finalAmountPhpCentavos,

              currency:
                order.currency ||
                "PHP",

              quantity:
                1,

              name:
                order.planName.slice(
                  0,
                  255,
                ),

              description:
                priceBreakdown.slice(
                  0,
                  255,
                ),
            },
          ],

          payment_method_types: [
            "qrph",
          ],

          /*
           * Ask the hosted PayMongo page to
           * display the line item and its
           * detailed price description.
           */
          show_line_items:
            true,

          show_description:
            true,

          success_url:
            successUrl,

          cancel_url:
            cancelUrl,

          reference_number:
            order.referenceNumber,

          description:
            (
              `Retry payment — ` +
              `${priceBreakdown}`
            ).slice(
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
                order.referenceNumber,
              ),

            package_code:
              sanitizeMetadataValue(
                order.packageCode,
              ),

            plan_name:
              sanitizeMetadataValue(
                order.planName,
              ),

            customer_email:
              sanitizeMetadataValue(
                order.customerEmail,
              ),

            retry_payment:
              "true",

            original_price_php:
              (
                subtotalPhpCentavos /
                100
              ).toFixed(2),

            coupon_discount_php:
              (
                couponDiscountPhpCentavos /
                100
              ).toFixed(2),

            store_credit_used_php:
              (
                storeCreditPhpCentavos /
                100
              ).toFixed(2),

            final_amount_php:
              (
                finalAmountPhpCentavos /
                100
              ).toFixed(2),

            coupon_code:
              order
                .couponCodeSnapshot ??
              "",
          },
        },
      },
    };

    console.info(
      "RETRY PAYMENT: Creating checkout session",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        subtotalPhpCentavos,

        couponDiscountPhpCentavos,

        storeCreditPhpCentavos,

        finalAmountPhpCentavos,

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

    if (!paymongoResponse.ok) {
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
            increment:
              1,
          },
        },
      });

      console.error(
        "PAYMONGO RETRY CHECKOUT ERROR:",
        {
          status:
            paymongoResponse.status,

          orderId:
            order.id,

          referenceNumber:
            order.referenceNumber,

          response:
            paymongoData,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error:
            paymentError,
        },
        {
          status:
            paymongoResponse.status >=
              400 &&
            paymongoResponse.status <
              600
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
        "PayMongo did not return a valid payment link.";

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

      return NextResponse.json(
        {
          success: false,
          error:
            missingDataError,
        },
        {
          status: 502,
        },
      );
    }

    /*
     * Replace the old checkout-session ID.
     *
     * Do not change the order totals and do
     * not deduct store credit again.
     */
    const updated =
      await prisma.order.updateMany({
        where: {
          id:
            order.id,

          userId:
            session.user.id,

          status:
            "PENDING",

          paymentStatus:
            "PENDING",

          esimStatus:
            "NOT_ORDERED",
        },

        data: {
          paymongoSessionId:
            checkoutSessionId,

          paymentMethod:
            "qrph",

          lastError:
            null,

          lastAttemptAt:
            new Date(),
        },
      });

    if (updated.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The order status changed before the new payment link was saved. Refresh the order page.",
        },
        {
          status: 409,
        },
      );
    }

    console.info(
      "RETRY PAYMENT SESSION CREATED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        checkoutSessionId,

        originalPrice:
          originalPriceText,

        storeCredit:
          storeCreditText,

        couponDiscount:
          couponDiscountText,

        totalToPay:
          finalAmountText,
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
      "RETRY PAYMENT ERROR:",
      {
        error:
          errorMessage,

        rawError:
          error,
      },
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Unable to reopen payment for this order.",

        details:
          process.env.NODE_ENV ===
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
      success: false,

      message:
        "Use the Continue Payment button on a pending order.",

      method:
        "POST",
    },
    {
      status: 405,

      headers: {
        Allow:
          "POST",

        "Cache-Control":
          "no-store",
      },
    },
  );
}