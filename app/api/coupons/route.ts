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

type CreateCouponBody = {
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

  if (
    !Number.isSafeInteger(
      numericValue,
    )
  ) {
    return null;
  }

  return numericValue;
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
      status:
        | "RESERVED"
        | "REDEEMED"
        | "RELEASED";
    }[];
  },
) {
  const reservedCount =
    coupon.redemptions.filter(
      (redemption) =>
        redemption.status ===
        "RESERVED",
    ).length;

  const redeemedCount =
    coupon.redemptions.filter(
      (redemption) =>
        redemption.status ===
        "REDEEMED",
    ).length;

  const releasedCount =
    coupon.redemptions.filter(
      (redemption) =>
        redemption.status ===
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

    maximumDiscountPhpCentavos:
      coupon
        .maximumDiscountPhpCentavos,

    minimumPurchasePhpCentavos:
      coupon
        .minimumPurchasePhpCentavos,

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
      coupon.createdAt
        .toISOString(),

    updatedAt:
      coupon.updatedAt
        .toISOString(),
  };
}

export async function GET(
  request: NextRequest,
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

    const search =
      normalizeText(
        request.nextUrl.searchParams.get(
          "search",
        ),
      );

    const enabledParameter =
      normalizeText(
        request.nextUrl.searchParams.get(
          "enabled",
        ),
      ).toLowerCase();

    const enabledFilter =
      enabledParameter ===
      "true"
        ? true
        : enabledParameter ===
            "false"
          ? false
          : undefined;

    const coupons =
      await prisma.coupon.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  {
                    code: {
                      contains:
                        search,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    name: {
                      contains:
                        search,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    description: {
                      contains:
                        search,

                      mode:
                        "insensitive",
                    },
                  },
                ],
              }
            : {}),

          ...(enabledFilter ===
          undefined
            ? {}
            : {
                enabled:
                  enabledFilter,
              }),
        },

        orderBy: [
          {
            enabled:
              "desc",
          },

          {
            createdAt:
              "desc",
          },
        ],

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
            select: {
              status:
                true,
            },
          },
        },
      });

    const serializedCoupons =
      coupons.map(
        serializeCoupon,
      );

    const stats = {
      totalCoupons:
        serializedCoupons.length,

      enabledCoupons:
        serializedCoupons.filter(
          (coupon) =>
            coupon.enabled,
        ).length,

      disabledCoupons:
        serializedCoupons.filter(
          (coupon) =>
            !coupon.enabled,
        ).length,

      totalReserved:
        serializedCoupons.reduce(
          (total, coupon) =>
            total +
            coupon.reservedCount,
          0,
        ),

      totalRedeemed:
        serializedCoupons.reduce(
          (total, coupon) =>
            total +
            coupon.redeemedCount,
          0,
        ),

      totalReleased:
        serializedCoupons.reduce(
          (total, coupon) =>
            total +
            coupon.releasedCount,
          0,
        ),
    };

    return NextResponse.json(
      {
        success: true,
        stats,
        coupons:
          serializedCoupons,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN COUPONS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load coupons.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function POST(
  request: NextRequest,
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

    let body:
      CreateCouponBody;

    try {
      body =
        (await request.json()) as
          CreateCouponBody;
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

    const code =
      normalizeCouponCode(
        body.code,
      );

    const name =
      normalizeText(
        body.name,
      );

    const description =
      normalizeText(
        body.description,
      );

    const discountPhp =
      normalizeRequiredNumber(
        body.discountPhp,
      );

    const minimumPurchasePhp =
      normalizeRequiredNumber(
        body.minimumPurchasePhp,
      );

    const minimumDataGb =
      normalizeOptionalNumber(
        body.minimumDataGb,
      );

    const maximumDataGb =
      normalizeOptionalNumber(
        body.maximumDataGb,
      );

    const usageLimit =
      normalizeOptionalInteger(
        body.usageLimit,
      );

    const perCustomerLimit =
      normalizeRequiredNumber(
        body.perCustomerLimit,
      );

    const startsAt =
      normalizeDate(
        body.startsAt,
      );

    const expiresAt =
      normalizeDate(
        body.expiresAt,
      );

    const enabled =
      normalizeBoolean(
        body.enabled,
        true,
      );

    const firstOrderOnly =
      normalizeBoolean(
        body.firstOrderOnly,
        false,
      );

    const applicablePackageCodes =
      normalizePackageCodes(
        body
          .applicablePackageCodes,
      );

    if (
      code.length < 3 ||
      code.length > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon code must contain between 3 and 50 characters.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !/^[A-Z0-9_-]+$/.test(
        code,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Coupon code may contain only letters, numbers, hyphens, and underscores.",
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
      discountPhp >
      1_000_000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The fixed discount is too large.",
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
        minimumPurchasePhp,
      ) ||
      minimumPurchasePhp < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid minimum purchase amount.",
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

    const existingCoupon =
      await prisma.coupon.findUnique({
        where: {
          code,
        },

        select: {
          id: true,
        },
      });

    if (existingCoupon) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A coupon with this code already exists.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const coupon =
      await prisma.coupon.create({
        data: {
          code,
          name,

          description:
            description ||
            null,

          discountType:
            "FIXED_PHP",

          /*
           * Fixed PHP discounts are stored
           * as centavos.
           *
           * ₱50 becomes 5000.
           */
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
            select: {
              status:
                true,
            },
          },
        },
      });

    await logAdminActivity({
      adminId:
        session.user.id,

      action:
        "COUPON_CREATED",

      module:
        "COUPONS",

      entityType:
        "Coupon",

      entityId:
        coupon.id,

      description:
        `Created coupon ${coupon.code}.`,

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
          "Coupon created successfully.",

        coupon:
          serializeCoupon(
            coupon,
          ),
      },
      {
        status: 201,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN COUPONS POST ERROR:",
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
          "COUPON_CREATE_FAILED",

        module:
          "COUPONS",

        entityType:
          "Coupon",

        description:
          "Failed to create a coupon.",

        success:
          false,

        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown coupon creation error.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create the coupon.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}