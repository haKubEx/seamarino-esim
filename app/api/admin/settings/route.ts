import {
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { logAdminActivity } from "@/app/lib/adminActivity";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_ID = "main";
const TEN_GB_BYTES =
  BigInt("10737418240");
const MAXIMUM_DATA_BYTES =
  BigInt("10000") *
  BigInt("1024") *
  BigInt("1024") *
  BigInt("1024");

type SettingsBody = {
  usdToPhpRate?: unknown;
  defaultMarkupPercent?: unknown;
  referralRewardPhp?: unknown;
  referredRewardPhp?: unknown;
  minimumReferralDataGb?: unknown;
  maximumWalletUsagePercent?: unknown;
  walletTopupEnabled?: unknown;
  maintenanceMode?: unknown;
  supportEmail?: unknown;
  defaultApn?: unknown;
};

function secureCompare(
  left: string,
  right: string,
) {
  const leftBuffer =
    Buffer.from(left, "utf8");

  const rightBuffer =
    Buffer.from(right, "utf8");

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}

function isAuthorized(
  request: Request,
) {
  const expected =
    process.env.ADMIN_API_KEY?.trim() ??
    "";

  const supplied =
    request.headers
      .get("x-admin-key")
      ?.trim() ?? "";

  return Boolean(
    expected &&
      supplied &&
      secureCompare(
        supplied,
        expected,
      ),
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Invalid or missing admin key.",
    },
    {
      status: 401,
      headers:
        noStoreHeaders(),
    },
  );
}

function parseFiniteNumber(
  value: unknown,
) {
  if (
    typeof value === "number"
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return Number(value);
  }

  return Number.NaN;
}

function parseBoolean(
  value: unknown,
) {
  return value === true;
}

function normalizeText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function serializeSettings(
  settings: {
    id: string;
    usdToPhpRate: number;
    defaultMarkupPercent: number;
    referralRewardPhpCentavos: number;
    referredRewardPhpCentavos: number;
    minimumReferralDataBytes: bigint;
    maximumWalletUsagePercent: number;
    walletTopupEnabled: boolean;
    maintenanceMode: boolean;
    supportEmail: string;
    defaultApn: string;
    updatedAt: Date;
  },
) {
  return {
    id:
      settings.id,

    usdToPhpRate:
      settings.usdToPhpRate,

    defaultMarkupPercent:
      settings.defaultMarkupPercent,

    referralRewardPhp:
      settings
        .referralRewardPhpCentavos /
      100,

    referredRewardPhp:
      settings
        .referredRewardPhpCentavos /
      100,

    minimumReferralDataBytes:
      settings
        .minimumReferralDataBytes
        .toString(),

    minimumReferralDataGb:
      Number(
        settings
          .minimumReferralDataBytes,
      ) /
      1024 /
      1024 /
      1024,

    maximumWalletUsagePercent:
      settings
        .maximumWalletUsagePercent,

    walletTopupEnabled:
      settings.walletTopupEnabled,

    maintenanceMode:
      settings.maintenanceMode,

    supportEmail:
      settings.supportEmail,

    defaultApn:
      settings.defaultApn,

    updatedAt:
      settings.updatedAt.toISOString(),
  };
}

async function getOrCreateSettings() {
  return prisma.appSetting.upsert({
    where: {
      id:
        SETTINGS_ID,
    },

    update: {},

    create: {
      id:
        SETTINGS_ID,
    },
  });
}

export async function GET(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const settings =
      await getOrCreateSettings();

    return NextResponse.json(
      {
        success: true,
        settings:
          serializeSettings(
            settings,
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
      "ADMIN SETTINGS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load system settings.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function PUT(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const session =
    await auth();

  if (
    !session?.user?.id ||
    session.user.role !== "ADMIN"
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

  try {
    const body =
      (await request.json()) as
        SettingsBody;

    const usdToPhpRate =
      parseFiniteNumber(
        body.usdToPhpRate,
      );

    const defaultMarkupPercent =
      parseFiniteNumber(
        body.defaultMarkupPercent,
      );

    const referralRewardPhp =
      parseFiniteNumber(
        body.referralRewardPhp,
      );

    const referredRewardPhp =
      parseFiniteNumber(
        body.referredRewardPhp,
      );

    const minimumReferralDataGb =
      parseFiniteNumber(
        body.minimumReferralDataGb,
      );

    const maximumWalletUsagePercent =
      parseFiniteNumber(
        body.maximumWalletUsagePercent,
      );

    const supportEmail =
      normalizeText(
        body.supportEmail,
      ).toLowerCase();

    const defaultApn =
      normalizeText(
        body.defaultApn,
      );

    if (
      !Number.isFinite(
        usdToPhpRate,
      ) ||
      usdToPhpRate <= 0 ||
      usdToPhpRate > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "USD to PHP rate must be between 0.01 and 500.",
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
        defaultMarkupPercent,
      ) ||
      defaultMarkupPercent < 0 ||
      defaultMarkupPercent > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Default markup must be between 0% and 1000%.",
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
        referralRewardPhp,
      ) ||
      referralRewardPhp < 0 ||
      referralRewardPhp > 100_000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Referrer reward is outside the allowed range.",
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
        referredRewardPhp,
      ) ||
      referredRewardPhp < 0 ||
      referredRewardPhp > 100_000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Referred-customer reward is outside the allowed range.",
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
        minimumReferralDataGb,
      ) ||
      minimumReferralDataGb < 0.1 ||
      minimumReferralDataGb > 10_000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum referral data must be between 0.1GB and 10,000GB.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !Number.isInteger(
        maximumWalletUsagePercent,
      ) ||
      maximumWalletUsagePercent < 0 ||
      maximumWalletUsagePercent > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Maximum wallet usage must be a whole number from 0 to 100.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !supportEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        supportEmail,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid support email address.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !defaultApn ||
      defaultApn.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Default APN is required and must not exceed 100 characters.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const minimumReferralDataBytes =
      BigInt(
        Math.round(
          minimumReferralDataGb *
            1024 *
            1024 *
            1024,
        ),
      );

    if (
      minimumReferralDataBytes <
        BigInt("1") ||
      minimumReferralDataBytes >
        MAXIMUM_DATA_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum referral data is outside the allowed range.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const previousSettings =
      await getOrCreateSettings();

    const previousSettingsSnapshot =
      serializeSettings(
        previousSettings,
      );

    const settings =
      await prisma.appSetting.upsert({
        where: {
          id:
            SETTINGS_ID,
        },

        create: {
          id:
            SETTINGS_ID,

          usdToPhpRate,

          defaultMarkupPercent,

          referralRewardPhpCentavos:
            Math.round(
              referralRewardPhp *
                100,
            ),

          referredRewardPhpCentavos:
            Math.round(
              referredRewardPhp *
                100,
            ),

          minimumReferralDataBytes,

          maximumWalletUsagePercent,

          walletTopupEnabled:
            parseBoolean(
              body.walletTopupEnabled,
            ),

          maintenanceMode:
            parseBoolean(
              body.maintenanceMode,
            ),

          supportEmail,
          defaultApn,
        },

        update: {
          usdToPhpRate,

          defaultMarkupPercent,

          referralRewardPhpCentavos:
            Math.round(
              referralRewardPhp *
                100,
            ),

          referredRewardPhpCentavos:
            Math.round(
              referredRewardPhp *
                100,
            ),

          minimumReferralDataBytes,

          maximumWalletUsagePercent,

          walletTopupEnabled:
            parseBoolean(
              body.walletTopupEnabled,
            ),

          maintenanceMode:
            parseBoolean(
              body.maintenanceMode,
            ),

          supportEmail,
          defaultApn,
        },
      });

    const updatedSettingsSnapshot =
      serializeSettings(settings);

    await logAdminActivity({
      adminId:
        session.user.id,

      action:
        "SETTINGS_UPDATED",

      module:
        "SETTINGS",

      entityType:
        "AppSetting",

      entityId:
        settings.id,

      description:
        "Updated Seamarino system settings.",

      oldValue:
        previousSettingsSnapshot,

      newValue:
        updatedSettingsSnapshot,

      success:
        true,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "System settings saved successfully.",

        settings:
          serializeSettings(
            settings,
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
      "ADMIN SETTINGS PUT ERROR:",
      error,
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown settings update error.";

    try {
      await logAdminActivity({
        adminId:
          session.user.id,

        action:
          "SETTINGS_UPDATE_FAILED",

        module:
          "SETTINGS",

        entityType:
          "AppSetting",

        entityId:
          SETTINGS_ID,

        description:
          "Failed to update Seamarino system settings.",

        success:
          false,

        errorMessage,
      });
    } catch (
      activityLogError
    ) {
      console.error(
        "ADMIN SETTINGS ACTIVITY LOG ERROR:",
        activityLogError,
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to save system settings.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}