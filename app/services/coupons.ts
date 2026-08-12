import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getPlans } from "@/app/services/plans";

const DEFAULT_RESERVATION_MINUTES =
  30;

const MAX_COUPON_CODE_LENGTH =
  50;

type CouponDatabaseClient = {
  coupon: {
    findUnique:
      typeof prisma.coupon.findUnique;
  };

  couponRedemption: {
    count:
      typeof prisma.couponRedemption.count;

    create:
      typeof prisma.couponRedemption.create;

    updateMany:
      typeof prisma.couponRedemption.updateMany;
  };

  order: {
    count:
      typeof prisma.order.count;

    findUnique:
      typeof prisma.order.findUnique;
  };
};

export type CouponValidationInput = {
  code: string;
  subtotalPhpCentavos: number;
  packageCode: string;
  customerEmail: string;
  userId?: string | null;
  now?: Date;
};

export type CouponValidationResult = {
  valid: true;

  coupon: {
    id: string;
    code: string;
    name: string;
    description: string | null;

    discountType:
      | "PERCENTAGE"
      | "FIXED_PHP";

    discountValue: number;
  };

  subtotalPhpCentavos: number;
  discountPhpCentavos: number;
  finalPhpCentavos: number;

  message: string;
};

export type CouponReservationInput =
  CouponValidationInput & {
    orderId: string;
    reservationMinutes?: number;
  };

export type CouponReservationResult =
  CouponValidationResult & {
    redemptionId: string;
    reservationEndsAt: Date;
  };

export class CouponValidationError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor({
    code,
    message,
    status = 400,
  }: {
    code: string;
    message: string;
    status?: number;
  }) {
    super(message);

    this.name =
      "CouponValidationError";

    this.code = code;
    this.status = status;
  }
}

function normalizeCouponCode(
  value: unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeEmail(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value
        .trim()
        .toLowerCase()
    : "";
}

function normalizePackageCode(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value
        .trim()
        .toUpperCase()
    : "";
}

function normalizePositiveInteger(
  value: unknown,
): number {
  const numericValue =
    Number(value);

  if (
    !Number.isSafeInteger(
      numericValue,
    ) ||
    numericValue <= 0
  ) {
    return 0;
  }

  return numericValue;
}

function normalizeNonNegativeInteger(
  value: unknown,
): number {
  const numericValue =
    Number(value);

  if (
    !Number.isSafeInteger(
      numericValue,
    ) ||
    numericValue < 0
  ) {
    return 0;
  }

  return numericValue;
}

function normalizeFiniteNumber(
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

function formatDataAllowance(
  bytes: bigint,
): string {
  const gigabyte =
    BigInt(
      1024 *
        1024 *
        1024,
    );

  const wholeGigabytes =
    bytes / gigabyte;

  const remainder =
    bytes % gigabyte;

  if (remainder === BigInt(0)) {
    return `${wholeGigabytes.toString()} GB`;
  }

  const decimal =
    Number(
      (remainder *
        BigInt(10)) /
        gigabyte,
    );

  return `${wholeGigabytes.toString()}.${decimal} GB`;
}

async function getPlanVolumeBytes(
  packageCode: string,
): Promise<number> {
  const plans =
    await getPlans();

  const normalizedCode =
    normalizePackageCode(
      packageCode,
    );

  const plan =
    plans.find(
      (item) =>
        normalizePackageCode(
          item.packageCode,
        ) === normalizedCode,
    );

  if (!plan) {
    throw new CouponValidationError({
      code:
        "PLAN_NOT_FOUND",

      message:
        "The selected eSIM plan is no longer available.",

      status: 404,
    });
  }

  const volume =
    Number(
      plan.volume,
    );

  if (
    !Number.isSafeInteger(
      volume,
    ) ||
    volume <= 0
  ) {
    throw new CouponValidationError({
      code:
        "PLAN_VOLUME_INVALID",

      message:
        "The selected eSIM plan has an invalid data allowance.",

      status: 500,
    });
  }

  return volume;
}

function validateInput({
  code,
  subtotalPhpCentavos,
  packageCode,
  customerEmail,
}: {
  code: string;
  subtotalPhpCentavos: number;
  packageCode: string;
  customerEmail: string;
}) {
  if (!code) {
    throw new CouponValidationError({
      code:
        "COUPON_CODE_REQUIRED",

      message:
        "Enter a coupon code.",
    });
  }

  if (
    code.length >
    MAX_COUPON_CODE_LENGTH
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_CODE_INVALID",

      message:
        "The coupon code is invalid.",
    });
  }

  if (!packageCode) {
    throw new CouponValidationError({
      code:
        "PACKAGE_CODE_REQUIRED",

      message:
        "The selected eSIM package is missing.",
    });
  }

  if (!customerEmail) {
    throw new CouponValidationError({
      code:
        "CUSTOMER_EMAIL_REQUIRED",

      message:
        "Enter your email address before applying a coupon.",
    });
  }

  if (
    !Number.isSafeInteger(
      subtotalPhpCentavos,
    ) ||
    subtotalPhpCentavos <= 0
  ) {
    throw new CouponValidationError({
      code:
        "SUBTOTAL_INVALID",

      message:
        "The checkout subtotal is invalid.",
    });
  }
}

function calculateDiscount({
  discountType,
  discountValue,
  subtotalPhpCentavos,
  maximumDiscountPhpCentavos,
}: {
  discountType:
    | "PERCENTAGE"
    | "FIXED_PHP";

  discountValue: number;
  subtotalPhpCentavos: number;

  maximumDiscountPhpCentavos:
    | number
    | null;
}) {
  let discountPhpCentavos =
    0;

  if (
    discountType ===
    "PERCENTAGE"
  ) {
    if (
      discountValue <= 0 ||
      discountValue > 100
    ) {
      throw new CouponValidationError({
        code:
          "COUPON_CONFIGURATION_INVALID",

        message:
          "This coupon has an invalid percentage discount.",

        status: 500,
      });
    }

    discountPhpCentavos =
      Math.round(
        subtotalPhpCentavos *
          (discountValue /
            100),
      );

    if (
      maximumDiscountPhpCentavos !==
        null &&
      maximumDiscountPhpCentavos >
        0
    ) {
      discountPhpCentavos =
        Math.min(
          discountPhpCentavos,
          maximumDiscountPhpCentavos,
        );
    }
  } else if (
    discountType ===
    "FIXED_PHP"
  ) {
    if (
      discountValue <= 0 ||
      !Number.isSafeInteger(
        discountValue,
      )
    ) {
      throw new CouponValidationError({
        code:
          "COUPON_CONFIGURATION_INVALID",

        message:
          "This coupon has an invalid fixed discount.",

        status: 500,
      });
    }

    discountPhpCentavos =
      discountValue;
  } else {
    throw new CouponValidationError({
      code:
        "COUPON_CONFIGURATION_INVALID",

      message:
        "This coupon uses an unsupported discount type.",

      status: 500,
    });
  }

  discountPhpCentavos =
    Math.min(
      discountPhpCentavos,
      subtotalPhpCentavos,
    );

  const finalPhpCentavos =
    subtotalPhpCentavos -
    discountPhpCentavos;

  if (
    finalPhpCentavos <= 0
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_ZERO_TOTAL_UNSUPPORTED",

      message:
        "This coupon would reduce the payment total to zero.",
    });
  }

  return {
    discountPhpCentavos,
    finalPhpCentavos,
  };
}

async function releaseExpiredReservations(
  database: CouponDatabaseClient,
  now: Date,
) {
  await database.couponRedemption.updateMany({
    where: {
      status:
        "RESERVED",

      reservationEndsAt: {
        lte: now,
      },
    },

    data: {
      status:
        "RELEASED",

      releasedAt:
        now,
    },
  });
}

async function validateCouponWithDatabase({
  database,
  input,
  planVolumeBytes,
}: {
  database:
    CouponDatabaseClient;

  input:
    CouponValidationInput;

  planVolumeBytes:
    number;
}): Promise<CouponValidationResult> {
  const now =
    input.now ??
    new Date();

  const code =
    normalizeCouponCode(
      input.code,
    );

  const packageCode =
    normalizePackageCode(
      input.packageCode,
    );

  const customerEmail =
    normalizeEmail(
      input.customerEmail,
    );

  const userId =
    input.userId?.trim() ||
    null;

  const subtotalPhpCentavos =
    normalizePositiveInteger(
      input.subtotalPhpCentavos,
    );

  validateInput({
    code,
    subtotalPhpCentavos,
    packageCode,
    customerEmail,
  });

  await releaseExpiredReservations(
    database,
    now,
  );

  const coupon =
    await database.coupon.findUnique({
      where: {
        code,
      },

      select: {
        id: true,
        code: true,
        name: true,
        description: true,

        discountType:
          true,

        discountValue:
          true,

        maximumDiscountPhpCentavos:
          true,

        minimumPurchasePhpCentavos:
          true,

        minimumDataBytes:
          true,

        maximumDataBytes:
          true,

        enabled: true,
        startsAt: true,
        expiresAt: true,

        usageLimit: true,
        perCustomerLimit:
          true,

        firstOrderOnly:
          true,

        applicablePackageCodes:
          true,
      },
    });

  if (!coupon) {
    throw new CouponValidationError({
      code:
        "COUPON_NOT_FOUND",

      message:
        "The coupon code was not found.",

      status: 404,
    });
  }

  if (!coupon.enabled) {
    throw new CouponValidationError({
      code:
        "COUPON_DISABLED",

      message:
        "This coupon is currently unavailable.",
    });
  }

  if (
    coupon.startsAt &&
    coupon.startsAt > now
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_NOT_STARTED",

      message:
        "This coupon is not active yet.",
    });
  }

  if (
    coupon.expiresAt &&
    coupon.expiresAt <= now
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_EXPIRED",

      message:
        "This coupon has expired.",
    });
  }

  const minimumPurchase =
    normalizeNonNegativeInteger(
      coupon.minimumPurchasePhpCentavos,
    );

  if (
    subtotalPhpCentavos <
    minimumPurchase
  ) {
    const formattedMinimum =
      new Intl.NumberFormat(
        "en-PH",
        {
          style:
            "currency",

          currency:
            "PHP",
        },
      ).format(
        minimumPurchase /
          100,
      );

    throw new CouponValidationError({
      code:
        "MINIMUM_PURCHASE_NOT_MET",

      message:
        `This coupon requires a minimum purchase of ${formattedMinimum}.`,
    });
  }

  const currentVolume =
    BigInt(
      planVolumeBytes,
    );

  if (
    coupon.minimumDataBytes !==
      null &&
    currentVolume <
      coupon.minimumDataBytes
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_DATA_MINIMUM_NOT_MET",

      message:
        `This coupon applies only to plans with at least ${formatDataAllowance(
          coupon.minimumDataBytes,
        )}.`,
    });
  }

  if (
    coupon.maximumDataBytes !==
      null &&
    currentVolume >
      coupon.maximumDataBytes
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_DATA_MAXIMUM_EXCEEDED",

      message:
        `This coupon applies only to plans up to ${formatDataAllowance(
          coupon.maximumDataBytes,
        )}.`,
    });
  }

  const allowedPackages =
    coupon
      .applicablePackageCodes
      .map(
        (
          value: string,
        ) =>
          normalizePackageCode(
            value,
          ),
      )
      .filter(Boolean);

  if (
    allowedPackages.length >
      0 &&
    !allowedPackages.includes(
      packageCode,
    )
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_NOT_APPLICABLE",

      message:
        "This coupon does not apply to the selected eSIM plan.",
    });
  }

  const activeUsageWhere = {
    couponId:
      coupon.id,

    OR: [
      {
        status:
          "REDEEMED" as const,
      },

      {
        status:
          "RESERVED" as const,

        reservationEndsAt: {
          gt: now,
        },
      },
    ],
  };

  const customerIdentity =
    userId
      ? {
          OR: [
            {
              userId,
            },
            {
              customerEmail,
            },
          ],
        }
      : {
          customerEmail,
        };

  const [
    totalUsage,
    customerUsage,
  ] = await Promise.all([
    database
      .couponRedemption
      .count({
        where:
          activeUsageWhere,
      }),

    database
      .couponRedemption
      .count({
        where: {
          ...activeUsageWhere,
          ...customerIdentity,
        },
      }),
  ]);

  if (
    coupon.usageLimit !==
      null &&
    totalUsage >=
      coupon.usageLimit
  ) {
    throw new CouponValidationError({
      code:
        "COUPON_USAGE_LIMIT_REACHED",

      message:
        "This coupon has reached its maximum number of uses.",
    });
  }

  if (
    coupon.perCustomerLimit >
      0 &&
    customerUsage >=
      coupon.perCustomerLimit
  ) {
    throw new CouponValidationError({
      code:
        "CUSTOMER_USAGE_LIMIT_REACHED",

      message:
        "You have already used this coupon the maximum number of times.",
    });
  }

  if (
    coupon.firstOrderOnly
  ) {
    const identityWhere =
      userId
        ? {
            OR: [
              {
                userId,
              },
              {
                customerEmail,
              },
            ],
          }
        : {
            customerEmail,
          };

    const previousPaidOrders =
      await database.order.count({
        where: {
          paymentStatus:
            "PAID",

          ...identityWhere,
        },
      });

    if (
      previousPaidOrders > 0
    ) {
      throw new CouponValidationError({
        code:
          "FIRST_ORDER_ONLY",

        message:
          "This coupon is available only for a customer’s first paid order.",
      });
    }
  }

  const discountType =
    coupon.discountType as
      | "PERCENTAGE"
      | "FIXED_PHP";

  const discountValue =
    normalizeFiniteNumber(
      coupon.discountValue,
    );

  const {
    discountPhpCentavos,
    finalPhpCentavos,
  } = calculateDiscount({
    discountType,
    discountValue,
    subtotalPhpCentavos,

    maximumDiscountPhpCentavos:
      coupon.maximumDiscountPhpCentavos,
  });

  const message =
    discountType ===
    "PERCENTAGE"
      ? `${discountValue}% discount applied.`
      : `${new Intl.NumberFormat(
          "en-PH",
          {
            style:
              "currency",

            currency:
              "PHP",
          },
        ).format(
          discountPhpCentavos /
            100,
        )} discount applied.`;

  return {
    valid: true,

    coupon: {
      id:
        coupon.id,

      code:
        coupon.code,

      name:
        coupon.name,

      description:
        coupon.description,

      discountType,

      discountValue,
    },

    subtotalPhpCentavos,
    discountPhpCentavos,
    finalPhpCentavos,

    message,
  };
}

export async function validateCoupon(
  input:
    CouponValidationInput,
): Promise<CouponValidationResult> {
  const planVolumeBytes =
    await getPlanVolumeBytes(
      input.packageCode,
    );

  return validateCouponWithDatabase({
    database:
      prisma as unknown as
        CouponDatabaseClient,

    input,
    planVolumeBytes,
  });
}

export async function reserveCouponForOrder(
  input:
    CouponReservationInput,
): Promise<CouponReservationResult> {
  const orderId =
    input.orderId.trim();

  if (!orderId) {
    throw new CouponValidationError({
      code:
        "ORDER_ID_REQUIRED",

      message:
        "The order ID is required to reserve a coupon.",
    });
  }

  const planVolumeBytes =
    await getPlanVolumeBytes(
      input.packageCode,
    );

  const reservationMinutes =
    Math.max(
      1,
      Math.min(
        120,
        Math.round(
          Number(
            input.reservationMinutes ??
              DEFAULT_RESERVATION_MINUTES,
          ),
        ),
      ),
    );

  return prisma.$transaction(
    async (
      transaction,
    ) => {
      const database =
        transaction as unknown as
          CouponDatabaseClient;

      const order =
        await database.order.findUnique({
          where: {
            id:
              orderId,
          },

          select: {
            id: true,
            userId: true,
            customerEmail:
              true,

            paymentStatus:
              true,

            couponRedemption: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });

      if (!order) {
        throw new CouponValidationError({
          code:
            "ORDER_NOT_FOUND",

          message:
            "The order could not be found.",

          status: 404,
        });
      }

      if (
        order.paymentStatus !==
        "PENDING"
      ) {
        throw new CouponValidationError({
          code:
            "ORDER_NOT_PENDING",

          message:
            "A coupon can only be reserved for a pending order.",
        });
      }

      if (
        order.couponRedemption
      ) {
        throw new CouponValidationError({
          code:
            "ORDER_ALREADY_HAS_COUPON",

          message:
            "A coupon has already been attached to this order.",
        });
      }

      const validation =
        await validateCouponWithDatabase({
          database,

          input: {
            ...input,

            userId:
              input.userId ??
              order.userId,

            customerEmail:
              input.customerEmail ||
              order.customerEmail,
          },

          planVolumeBytes,
        });

      const reservedAt =
        input.now ??
        new Date();

      const reservationEndsAt =
        new Date(
          reservedAt.getTime() +
            reservationMinutes *
              60 *
              1000,
        );

      const redemption =
        await database
          .couponRedemption
          .create({
            data: {
              couponId:
                validation
                  .coupon.id,

              orderId,

              userId:
                input.userId ??
                order.userId,

              customerEmail:
                normalizeEmail(
                  input.customerEmail ||
                    order.customerEmail,
                ),

              status:
                "RESERVED",

              subtotalPhpCentavos:
                validation
                  .subtotalPhpCentavos,

              discountPhpCentavos:
                validation
                  .discountPhpCentavos,

              finalPhpCentavos:
                validation
                  .finalPhpCentavos,

              reservedAt,
              reservationEndsAt,
            },

            select: {
              id: true,
            },
          });

      return {
        ...validation,

        redemptionId:
          redemption.id,

        reservationEndsAt,
      };
    },
    {
      isolationLevel:
        "Serializable",
    },
  );
}

export async function redeemCouponForOrder(
  orderId: string,
): Promise<boolean> {
  const normalizedOrderId =
    orderId.trim();

  if (!normalizedOrderId) {
    return false;
  }

  const result =
    await prisma
      .couponRedemption
      .updateMany({
        where: {
          orderId:
            normalizedOrderId,

          status:
            "RESERVED",
        },

        data: {
          status:
            "REDEEMED",

          redeemedAt:
            new Date(),

          reservationEndsAt:
            null,

          releasedAt:
            null,
        },
      });

  return result.count >
    0;
}

export async function releaseCouponForOrder(
  orderId: string,
): Promise<boolean> {
  const normalizedOrderId =
    orderId.trim();

  if (!normalizedOrderId) {
    return false;
  }

  const result =
    await prisma
      .couponRedemption
      .updateMany({
        where: {
          orderId:
            normalizedOrderId,

          status:
            "RESERVED",
        },

        data: {
          status:
            "RELEASED",

          releasedAt:
            new Date(),

          reservationEndsAt:
            null,
        },
      });

  return result.count >
    0;
}