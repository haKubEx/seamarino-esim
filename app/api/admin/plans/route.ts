import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import {
  logAdminActivity,
} from "@/app/lib/adminActivity";
import { getCountryName } from "@/app/lib/countries";
import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";
import {
  calculatePlanPrice,
  type CalculatedPlanPrice,
} from "@/app/services/pricing";
import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type UpdatePlanBody = {
  packageCode?: unknown;
  enabled?: unknown;
  featured?: unknown;
  customName?: unknown;
};

function isAuthorized(
  request: Request,
) {
  const configuredKey =
    process.env.ADMIN_API_KEY?.trim();

  const suppliedKey =
    request.headers
      .get("x-admin-key")
      ?.trim();

  return Boolean(
    configuredKey &&
      suppliedKey &&
      configuredKey ===
        suppliedKey,
  );
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

function normalizeText(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getLocationCodes(
  plan: EsimPackage,
) {
  const location =
    normalizeText(
      plan.location,
    );

  if (location) {
    return location
      .split(",")
      .map((code) =>
        code.trim(),
      )
      .filter(Boolean);
  }

  const locationCode =
    normalizeText(
      plan.locationCode,
    );

  return locationCode
    ? [locationCode]
    : [];
}

function getCoverageLabel(
  plan: EsimPackage,
  pricing: CalculatedPlanPrice,
) {
  const locationCodes =
    getLocationCodes(plan);

  if (pricing.isGlobalPlan) {
    return "120+ countries and regions";
  }

  if (
    locationCodes.length > 1
  ) {
    return `${locationCodes.length} countries covered`;
  }

  const countryCode =
    locationCodes[0];

  if (countryCode) {
    const countryName =
      getCountryName(
        countryCode,
      );

    return (
      countryName ||
      countryCode
    );
  }

  return "Coverage information unavailable";
}

function getSearchableText(
  plan: EsimPackage,
) {
  return [
    plan.packageCode,
    plan.name,
    plan.location,
    plan.locationCode,
    plan.description,
    plan.saleNote,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function determinePlanAction({
  previous,
  enabled,
  featured,
  customName,
}: {
  previous:
    | {
        enabled: boolean;
        featured: boolean;
        customName:
          | string
          | null;
      }
    | null;

  enabled: boolean;
  featured: boolean;
  customName:
    | string
    | null;
}) {
  if (!previous) {
    return "PLAN_SETTING_CREATED";
  }

  if (
    previous.enabled !==
    enabled
  ) {
    return enabled
      ? "PLAN_ENABLED"
      : "PLAN_DISABLED";
  }

  if (
    previous.featured !==
    featured
  ) {
    return featured
      ? "PLAN_FEATURED"
      : "PLAN_UNFEATURED";
  }

  if (
    previous.customName !==
    customName
  ) {
    return "PLAN_NAME_UPDATED";
  }

  return "PLAN_UPDATED";
}

export async function GET(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const url =
      new URL(request.url);

    const search =
      url.searchParams
        .get("search")
        ?.trim()
        .toLowerCase() ??
      "";

    const [
      supplierPlans,
      savedSettings,
    ] = await Promise.all([
      fetchEsimAccessPlans(),

      prisma.planSetting.findMany(),
    ]);

    const settingMap =
      new Map(
        savedSettings.map(
          (setting) => [
            setting.packageCode,
            setting,
          ],
        ),
      );

    const matchingPlans =
      supplierPlans.filter(
        (plan) => {
          const packageCode =
            plan.packageCode?.trim();

          if (!packageCode) {
            return false;
          }

          if (!search) {
            return true;
          }

          return getSearchableText(
            plan,
          ).includes(search);
        },
      );

    const plans =
      await Promise.all(
        matchingPlans.map(
          async (plan) => {
            const packageCode =
              plan.packageCode.trim();

            const setting =
              settingMap.get(
                packageCode,
              );

            const pricing =
              await calculatePlanPrice(
                plan,
              );

            const supplierName =
              plan.name ||
              packageCode;

            const displayName =
              setting?.customName?.trim() ||
              supplierName;

            return {
              packageCode,

              supplierName,

              displayName,

              customName:
                setting
                  ?.customName ??
                null,

              locationName:
                getCoverageLabel(
                  plan,
                  pricing,
                ),

              locationCode:
                plan.locationCode ??
                null,

              volume:
                Number(
                  plan.volume,
                ),

              duration:
                Number(
                  plan.duration,
                ),

              durationUnit:
                plan.durationUnit,

              enabled:
                setting?.enabled ??
                true,

              featured:
                setting?.featured ??
                false,

              supplierCostUsd:
                pricing
                  .supplierCostUsd,

              markupAmountUsd:
                pricing
                  .markupAmountUsd,

              sellingPriceUsd:
                pricing
                  .sellingPriceUsd,

              sellingPricePhp:
                pricing
                  .sellingPricePhp,

              amountPhpCentavos:
                pricing
                  .amountPhpCentavos,

              usdToPhpRate:
                pricing
                  .usdToPhpRate,

              isGlobalPlan:
                pricing
                  .isGlobalPlan,

              markupTable:
                pricing
                  .isGlobalPlan
                  ? "GLOBAL"
                  : "STANDARD",

              volumeGb:
                pricing.volumeGb,

              volumeMb:
                pricing.volumeMb,

              updatedAt:
                setting
                  ?.updatedAt ??
                null,
            };
          },
        ),
      );

    plans.sort(
      (
        a,
        b,
      ) => {
        if (
          a.featured !==
          b.featured
        ) {
          return a.featured
            ? -1
            : 1;
        }

        if (
          a.isGlobalPlan !==
          b.isGlobalPlan
        ) {
          return a.isGlobalPlan
            ? 1
            : -1;
        }

        return a.displayName.localeCompare(
          b.displayName,
        );
      },
    );

    return NextResponse.json(
      {
        success: true,
        plans,
        total:
          plans.length,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "ADMIN PLANS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Unable to retrieve plans.",
      },
      {
        status: 500,
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
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        UpdatePlanBody;

    const packageCode =
      typeof body.packageCode ===
      "string"
        ? body.packageCode.trim()
        : "";

    if (!packageCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Package code is required.",
        },
        {
          status: 400,
        },
      );
    }

    const enabled =
      typeof body.enabled ===
      "boolean"
        ? body.enabled
        : true;

    const featured =
      typeof body.featured ===
      "boolean"
        ? body.featured
        : false;

    const customName =
      typeof body.customName ===
        "string" &&
      body.customName.trim()
        ? body.customName
            .trim()
            .slice(
              0,
              255,
            )
        : null;

    /*
     * Save the previous values before
     * updating so the audit log can show
     * exactly what changed.
     */
    const previousSetting =
      await prisma.planSetting.findUnique({
        where: {
          packageCode,
        },

        select: {
          packageCode:
            true,

          enabled:
            true,

          featured:
            true,

          customName:
            true,

          markupPercent:
            true,

          updatedAt:
            true,
        },
      });

    const setting =
      await prisma.planSetting.upsert({
        where: {
          packageCode,
        },

        update: {
          enabled,
          featured,
          customName,

          /*
           * Pricing markup is currently
           * controlled by your pricing
           * service/settings.
           */
          markupPercent: 0,
        },

        create: {
          packageCode,
          enabled,
          featured,
          customName,
          markupPercent: 0,
        },
      });

    const action =
      determinePlanAction({
        previous:
          previousSetting
            ? {
                enabled:
                  previousSetting
                    .enabled,

                featured:
                  previousSetting
                    .featured,

                customName:
                  previousSetting
                    .customName,
              }
            : null,

        enabled:
          setting.enabled,

        featured:
          setting.featured,

        customName:
          setting.customName,
      });

    /*
     * This is a genuine admin action,
     * so it belongs in AdminActivityLog.
     */
    await logAdminActivity({
      adminId:
        session.user.id,

      action,

      module:
        "PLANS",

      entityType:
        "PlanSetting",

      /*
       * packageCode is stable and already
       * identifies PlanSetting in your API.
       * Using it also avoids depending on
       * a separate numeric/cuid ID field.
       */
      entityId:
        packageCode,

      description:
        action ===
        "PLAN_ENABLED"
          ? `Enabled plan ${packageCode}.`
          : action ===
              "PLAN_DISABLED"
            ? `Disabled plan ${packageCode}.`
            : action ===
                "PLAN_FEATURED"
              ? `Featured plan ${packageCode}.`
              : action ===
                  "PLAN_UNFEATURED"
                ? `Removed featured status from plan ${packageCode}.`
                : action ===
                    "PLAN_NAME_UPDATED"
                  ? `Updated the custom name for plan ${packageCode}.`
                  : action ===
                      "PLAN_SETTING_CREATED"
                    ? `Created admin settings for plan ${packageCode}.`
                    : `Updated plan settings for ${packageCode}.`,

      oldValue:
        previousSetting,

      newValue: {
        packageCode:
          setting.packageCode,

        enabled:
          setting.enabled,

        featured:
          setting.featured,

        customName:
          setting.customName,

        markupPercent:
          setting.markupPercent,

        updatedAt:
          setting.updatedAt,
      },

      success:
        true,
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Plan settings updated successfully.",

        setting,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN PLANS UPDATE ERROR:",
      error,
    );

    /*
     * Failed admin plan changes are also
     * recorded, but a logging error must
     * never replace the real API error.
     */
    try {
      await logAdminActivity({
        adminId:
          session.user.id,

        action:
          "PLAN_UPDATE_FAILED",

        module:
          "PLANS",

        entityType:
          "PlanSetting",

        description:
          "Failed to update plan settings.",

        success:
          false,

        errorMessage:
          error instanceof Error
            ? error.message
            : "Unknown plan update error.",
      });
    } catch (
      activityLogError
    ) {
      console.error(
        "ADMIN PLAN ACTIVITY LOG ERROR:",
        activityLogError,
      );
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Unable to update plan settings.",
      },
      {
        status: 500,
      },
    );
  }
}