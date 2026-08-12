import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { logAdminActivity } from "@/app/lib/adminActivity";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BYTES_PER_GB =
  1024 * 1024 * 1024;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateCouponBody = {
  code?: unknown;
  name?: unknown;
  description?: unknown;

  discountPhp?: unknown;
  minimumPurchasePhp?: unknown;

  minimumDataGb?: unknown;
  maximumDataGb?: unknown;

  enabled?: unknown;

  startsAt?: unknown;
  expiresAt?: unknown;

  usageLimit?: unknown;
  perCustomerLimit?: unknown;

  firstOrderOnly?: unknown;

  applicablePackageCodes?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function getAdminKey(
  request: NextRequest,
) {
  return (
    request.headers
      .get("x-admin-key")
      ?.trim() || ""
  );
}

function isAuthorized(
  request: NextRequest,
) {
  const suppliedAdminKey =
    getAdminKey(request);

  const expectedAdminKey =
    process.env.ADMIN_API_KEY?.trim();

  return Boolean(
    expectedAdminKey &&
      suppliedAdminKey ===
        expectedAdminKey,
  );
}

function normalizeText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeCouponCode(
  value: unknown,
) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeBoolean(
  value: unknown,
  fallback = false,
) {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "on",
      ].includes(normalized)
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "off",
      ].includes(normalized)
    ) {
      return false;
    }
  }

  return fallback;
}

function normalizeOptionalNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue,
  )
    ? numericValue
    : null;
}

function normalizeRequiredNumber(
  value: unknown,
): number {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue,
  )
    ? numericValue
    : 0;
}

function normalizeOptionalInteger(
  value: unknown,
): number | null {
  const numericValue =
    normalizeOptionalNumber(
      value,
    );

  if (
    numericValue === null
  ) {
    return null;
  }

  return Number.isSafeInteger(
    numericValue,
  )
    ? numericValue
    : null;
}

function normalizeDate(
  value: unknown,
): Date | null {
  const text =
    normalizeText(value);

  if (!text) {
    return null;
  }

  const date =
    new Date(text);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function normalizePackageCodes(
  value: unknown,
): string[] {
  const rawValues =
    Array.isArray(value)
      ? value
      : typeof value ===
          "string"
        ? value.split(",")
        : [];

  return Array.from(
    new Set(
      rawValues
        .map((item) =>
          normalizeText(
            item,
          ).toUpperCase(),
        )
        .filter(Boolean),
    ),
  );
}

function pesosToCentavos(
  pesos: number,
) {
  return Math.round(
    pesos * 100,
  );
}

function gigabytesToBytes(
  gigabytes: number,
) {
  return BigInt(
    Math.round(
      gigabytes *
        BYTES_PER_GB,
    ),
  );
}

function bigintToString(
  value: bigint | null,
) {
  return value === null
    ? null
    : value.toString();
}

function bytesToGigabytes(
  value: bigint | null,
) {
  if (value === null) {
    return null;
  }

  return (
    Number(value) /
    BYTES_PER_GB
  );
}

function serializeCoupon(
  coupon: {
    id: string;
    code: string;
    name: string;
    description: string | null;

    discountType:
      | "PERCENTAGE"
      | "FIXED_PHP";

    discountValue: number;

    maximumDiscountPhpCentavos:
      number | null;

    minimumPurchasePhpCentavos:
      number;

    minimumDataBytes:
      bigint | null;

    maximumDataBytes:
      bigint | null;

    enabled: boolean;

    startsAt: Date | null;
    expiresAt: Date | null;

    usageLimit: number | null;
    perCustomerLimit: number;
    firstOrderOnly: boolean;

    applicablePackageCodes:
      string[];

    createdAt: Date;
    updatedAt: Date;

    _count: {
      orders: number;
      redemptions: number;
    };

    redemptions: {
      id: string;
      status:
        | "RESERVED"
        | "REDEEMED"
        | "RELEASED";
      customerEmail: string;
      discountPhpCentavos: number;
      createdAt: Date;
      redeemedAt: Date | null;
      releasedAt: Date | null;

      order: {
        referenceNumber: string;
        paymentStatus: string;
        esimStatus: string;
      };
    }[];
  },
) {
  const reservedCount =
    coupon.redemptions.filter(
      (item) =>
        item.status ===
        "RESERVED",
    ).length;

  const redeemedCount =
    coupon.redemptions.filter(
      (item) =>
        item.status ===
        "REDEEMED",
    ).length;

  const releasedCount =
    coupon.redemptions.filter(
      (item) =>
        item.status ===
        "RELEASED",
    ).length;

  return {
    id:
      coupon.id,

    code:
      coupon.code,

    name:
      coupon.name,

    description:
      coupon.description,

    discountType:
      coupon.discountType,

    discountValue:
      coupon.discountValue,

    discountPhp:
      coupon.discountType ===
      "FIXED_PHP"
        ? coupon.discountValue /
          100
        : null,

    minimumPurchasePhp:
      coupon
        .minimumPurchasePhpCentavos /
      100,

    minimumDataBytes:
      bigintToString(
        coupon.minimumDataBytes,
      ),

    maximumDataBytes:
      bigintToString(
        coupon.maximumDataBytes,
      ),

    minimumDataGb:
      bytesToGigabytes(
        coupon.minimumDataBytes,
      ),

    maximumDataGb:
      bytesToGigabytes(
        coupon.maximumDataBytes,
      ),

    enabled:
      coupon.enabled,

    startsAt:
      coupon.startsAt
        ?.toISOString() ??
      null,

    expiresAt:
      coupon.expiresAt
        ?.toISOString() ??
      null,

    usageLimit:
      coupon.usageLimit,

    perCustomerLimit:
      coupon.perCustomerLimit,

    firstOrderOnly:
      coupon.firstOrderOnly,

    applicablePackageCodes:
      coupon
        .applicablePackageCodes,

    orderCount:
      coupon._count.orders,

    redemptionCount:
      coupon._count
        .redemptions,

    reservedCount,
    redeemedCount,
    releasedCount,

    createdAt:
      coupon.createdAt.toISOString(),

    updatedAt:
      coupon.updatedAt.toISOString(),

    redemptions:
      coupon.redemptions.map(
        (redemption) => ({
          id:
            redemption.id,

          status:
            redemption.status,

          customerEmail:
            redemption
              .customerEmail,

          discountPhpCentavos:
            redemption
              .discountPhpCentavos,

          createdAt:
            redemption
              .createdAt
              .toISOString(),

          redeemedAt:
            redemption
              .redeemedAt
              ?.toISOString() ??
            null,

          releasedAt:
            redemption
              .releasedAt
              ?.toISOString() ??
            null,

          order:
            redemption.order,
        }),
      ),
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    if (
      !isAuthorized(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      id,
    } = await context.params;

    const couponId =
      id.trim();

    if (!couponId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing coupon ID.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const coupon =
      await prisma.coupon.findUnique({
        where: {
          id:
            couponId,
        },

        include: {
          _count: {
            select: {
              orders:
                true,

              redemptions:
                true,
            },
          },

          redemptions: {
            orderBy: {
              createdAt:
                "desc",
            },

            take:
              100,

            select: {
              id:
                true,

              status:
                true,

              customerEmail:
                true,

              discountPhpCentavos:
                true,

              createdAt:
                true,

              redeemedAt:
                true,

              releasedAt:
                true,

              order: {
                select: {
                  referenceNumber:
                    true,

                  paymentStatus:
                    true,

                  esimStatus:
                    true,
                },
              },
            },
          },
        },
      });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        coupon:
          serializeCoupon(
            coupon,
          ),
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN COUPON DETAILS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load coupon details.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    if (
      !isAuthorized(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const session =
      await auth();

    if (
      !session?.user?.id ||
      session.user.role !==
        "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin session required.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      id,
    } = await context.params;

    const couponId =
      id.trim();

    if (!couponId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing coupon ID.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    let body:
      UpdateCouponBody;

    try {
      body =
        (await request.json()) as
          UpdateCouponBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "The coupon request is invalid.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const existingCoupon =
      await prisma.coupon.findUnique({
        where: {
          id:
            couponId,
        },

        select: {
          id:
            true,

          code:
            true,

          name:
            true,

          description:
            true,

          discountValue:
            true,

          minimumPurchasePhpCentavos:
            true,

          minimumDataBytes:
            true,

          maximumDataBytes:
            true,

          enabled:
            true,

          startsAt:
            true,

          expiresAt:
            true,

          usageLimit:
            true,

          perCustomerLimit:
            true,

          firstOrderOnly:
            true,

          applicablePackageCodes:
            true,
        },
      });

    if (!existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const code =
      body.code ===
      undefined
        ? existingCoupon.code
        : normalizeCouponCode(
            body.code,
          );

    const name =
      body.name ===
      undefined
        ? existingCoupon.name
        : normalizeText(
            body.name,
          );

    const description =
      body.description ===
      undefined
        ? existingCoupon
            .description
        : normalizeText(
            body.description,
          ) || null;

    const discountPhp =
      body.discountPhp ===
      undefined
        ? existingCoupon
            .discountValue /
          100
        : normalizeRequiredNumber(
            body.discountPhp,
          );

    const minimumPurchasePhp =
      body.minimumPurchasePhp ===
      undefined
        ? existingCoupon
            .minimumPurchasePhpCentavos /
          100
        : normalizeRequiredNumber(
            body
              .minimumPurchasePhp,
          );

    const minimumDataGb =
      body.minimumDataGb ===
      undefined
        ? bytesToGigabytes(
            existingCoupon
              .minimumDataBytes,
          )
        : normalizeOptionalNumber(
            body.minimumDataGb,
          );

    const maximumDataGb =
      body.maximumDataGb ===
      undefined
        ? bytesToGigabytes(
            existingCoupon
              .maximumDataBytes,
          )
        : normalizeOptionalNumber(
            body.maximumDataGb,
          );

    const enabled =
      body.enabled ===
      undefined
        ? existingCoupon.enabled
        : normalizeBoolean(
            body.enabled,
            existingCoupon.enabled,
          );

    const startsAt =
      body.startsAt ===
      undefined
        ? existingCoupon.startsAt
        : normalizeDate(
            body.startsAt,
          );

    const expiresAt =
      body.expiresAt ===
      undefined
        ? existingCoupon.expiresAt
        : normalizeDate(
            body.expiresAt,
          );

    const usageLimit =
      body.usageLimit ===
      undefined
        ? existingCoupon
            .usageLimit
        : normalizeOptionalInteger(
            body.usageLimit,
          );

    const perCustomerLimit =
      body.perCustomerLimit ===
      undefined
        ? existingCoupon
            .perCustomerLimit
        : normalizeRequiredNumber(
            body
              .perCustomerLimit,
          );

    const firstOrderOnly =
      body.firstOrderOnly ===
      undefined
        ? existingCoupon
            .firstOrderOnly
        : normalizeBoolean(
            body.firstOrderOnly,
            existingCoupon
              .firstOrderOnly,
          );

    const applicablePackageCodes =
      body.applicablePackageCodes ===
      undefined
        ? existingCoupon
            .applicablePackageCodes
        : normalizePackageCodes(
            body
              .applicablePackageCodes,
          );

    if (
      code.length < 3 ||
      code.length > 50 ||
      !/^[A-Z0-9_-]+$/.test(
        code,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid coupon code using letters, numbers, hyphens, or underscores.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon name must contain between 2 and 100 characters.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      description &&
      description.length >
        1_000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon description must not exceed 1,000 characters.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !Number.isFinite(
        discountPhp,
      ) ||
      discountPhp <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid fixed peso discount.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      minimumPurchasePhp < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum purchase cannot be negative.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      minimumDataGb !==
        null &&
      minimumDataGb <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum data must be greater than zero.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      maximumDataGb !==
        null &&
      maximumDataGb <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum data must be greater than zero.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      minimumDataGb !==
        null &&
      maximumDataGb !==
        null &&
      maximumDataGb <
        minimumDataGb
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum data cannot be less than minimum data.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      usageLimit !== null &&
      usageLimit <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Usage limit must be greater than zero or left empty.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !Number.isSafeInteger(
        perCustomerLimit,
      ) ||
      perCustomerLimit <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Per-customer limit must be a whole number greater than zero.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      startsAt &&
      expiresAt &&
      expiresAt <=
        startsAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Expiration date must be after the start date.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const duplicateCoupon =
      await prisma.coupon.findFirst({
        where: {
          code,

          NOT: {
            id:
              couponId,
          },
        },

        select: {
          id:
            true,
        },
      });

    if (duplicateCoupon) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another coupon already uses this code.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const coupon =
      await prisma.coupon.update({
        where: {
          id:
            couponId,
        },

        data: {
          code,
          name,
          description,

          discountType:
            "FIXED_PHP",

          discountValue:
            pesosToCentavos(
              discountPhp,
            ),

          maximumDiscountPhpCentavos:
            null,

          minimumPurchasePhpCentavos:
            pesosToCentavos(
              minimumPurchasePhp,
            ),

          minimumDataBytes:
            minimumDataGb ===
            null
              ? null
              : gigabytesToBytes(
                  minimumDataGb,
                ),

          maximumDataBytes:
            maximumDataGb ===
            null
              ? null
              : gigabytesToBytes(
                  maximumDataGb,
                ),

          enabled,
          startsAt,
          expiresAt,
          usageLimit,
          perCustomerLimit,
          firstOrderOnly,
          applicablePackageCodes,
        },

        include: {
          _count: {
            select: {
              orders:
                true,

              redemptions:
                true,
            },
          },

          redemptions: {
            orderBy: {
              createdAt:
                "desc",
            },

            take:
              100,

            select: {
              id:
                true,

              status:
                true,

              customerEmail:
                true,

              discountPhpCentavos:
                true,

              createdAt:
                true,

              redeemedAt:
                true,

              releasedAt:
                true,

              order: {
                select: {
                  referenceNumber:
                    true,

                  paymentStatus:
                    true,

                  esimStatus:
                    true,
                },
              },
            },
          },
        },
      });

    const couponAction =
      existingCoupon.enabled !==
        coupon.enabled
        ? coupon.enabled
          ? "COUPON_ENABLED"
          : "COUPON_DISABLED"
        : "COUPON_UPDATED";

    await logAdminActivity({
      adminId:
        session.user.id,

      action:
        couponAction,

      module:
        "COUPONS",

      entityType:
        "Coupon",

      entityId:
        coupon.id,

      description:
        couponAction ===
        "COUPON_ENABLED"
          ? `Enabled coupon ${coupon.code}.`
          : couponAction ===
              "COUPON_DISABLED"
            ? `Disabled coupon ${coupon.code}.`
            : `Updated coupon ${coupon.code}.`,

      oldValue:
        existingCoupon,

      newValue: {
        id:
          coupon.id,
        code:
          coupon.code,
        name:
          coupon.name,
        description:
          coupon.description,
        discountType:
          coupon.discountType,
        discountValue:
          coupon.discountValue,
        maximumDiscountPhpCentavos:
          coupon.maximumDiscountPhpCentavos,
        minimumPurchasePhpCentavos:
          coupon.minimumPurchasePhpCentavos,
        minimumDataBytes:
          coupon.minimumDataBytes,
        maximumDataBytes:
          coupon.maximumDataBytes,
        enabled:
          coupon.enabled,
        startsAt:
          coupon.startsAt,
        expiresAt:
          coupon.expiresAt,
        usageLimit:
          coupon.usageLimit,
        perCustomerLimit:
          coupon.perCustomerLimit,
        firstOrderOnly:
          coupon.firstOrderOnly,
        applicablePackageCodes:
          coupon.applicablePackageCodes,
      },

      success:
        true,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Coupon updated successfully.",
        coupon:
          serializeCoupon(
            coupon,
          ),
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN COUPON PATCH ERROR:",
      error,
    );

    const session =
      await auth();

    if (
      session?.user?.id &&
      session.user.role ===
        "ADMIN"
    ) {
      await logAdminActivity({
        adminId:
          session.user.id,

        action:
          "COUPON_UPDATE_FAILED",

        module:
          "COUPONS",

        entityType:
          "Coupon",

        description:
          "Failed to update a coupon.",

        success:
          false,

        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown coupon update error.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update the coupon.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    if (
      !isAuthorized(request)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const session =
      await auth();

    if (
      !session?.user?.id ||
      session.user.role !==
        "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin session required.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      id,
    } = await context.params;

    const couponId =
      id.trim();

    if (!couponId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing coupon ID.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const coupon =
      await prisma.coupon.findUnique({
        where: {
          id:
            couponId,
        },

        select: {
          id:
            true,

          code:
            true,

          _count: {
            select: {
              orders:
                true,

              redemptions:
                true,
            },
          },
        },
      });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * Preserve coupon history when the coupon
     * has already been attached to an order or
     * has any redemption record.
     */
    if (
      coupon._count.orders >
        0 ||
      coupon._count
        .redemptions > 0
    ) {
      await prisma.coupon.update({
        where: {
          id:
            coupon.id,
        },

        data: {
          enabled:
            false,
        },
      });

      await logAdminActivity({
        adminId:
          session.user.id,

        action:
          "COUPON_DISABLED",

        module:
          "COUPONS",

        entityType:
          "Coupon",

        entityId:
          coupon.id,

        description:
          `${coupon.code} has existing order or redemption history and was disabled instead of deleted.`,

        oldValue: {
          id:
            coupon.id,
          code:
            coupon.code,
          enabled:
            true,
          orderCount:
            coupon._count.orders,
          redemptionCount:
            coupon._count.redemptions,
        },

        newValue: {
          id:
            coupon.id,
          code:
            coupon.code,
          enabled:
            false,
        },

        success:
          true,
      });

      return NextResponse.json(
        {
          success: true,

          deleted:
            false,

          disabled:
            true,

          message:
            `${coupon.code} has existing history and was disabled instead of deleted.`,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    await prisma.coupon.delete({
      where: {
        id:
          coupon.id,
      },
    });

    await logAdminActivity({
      adminId:
        session.user.id,

      action:
        "COUPON_DELETED",

      module:
        "COUPONS",

      entityType:
        "Coupon",

      entityId:
        coupon.id,

      description:
        `Deleted coupon ${coupon.code}.`,

      oldValue: {
        id:
          coupon.id,
        code:
          coupon.code,
        orderCount:
          coupon._count.orders,
        redemptionCount:
          coupon._count.redemptions,
      },

      success:
        true,
    });

    return NextResponse.json(
      {
        success: true,

        deleted:
          true,

        disabled:
          false,

        message:
          "Coupon deleted successfully.",
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN COUPON DELETE ERROR:",
      error,
    );

    const session =
      await auth();

    if (
      session?.user?.id &&
      session.user.role ===
        "ADMIN"
    ) {
      await logAdminActivity({
        adminId:
          session.user.id,

        action:
          "COUPON_DELETE_FAILED",

        module:
          "COUPONS",

        entityType:
          "Coupon",

        description:
          "Failed to delete or disable a coupon.",

        success:
          false,

        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown coupon delete error.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to delete the coupon.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}