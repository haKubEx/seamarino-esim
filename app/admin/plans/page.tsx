import { NextResponse } from "next/server";

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

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.ADMIN_API_KEY?.trim();

  const suppliedKey =
    request.headers
      .get("x-admin-key")
      ?.trim();

  return Boolean(
    configuredKey &&
      suppliedKey &&
      configuredKey === suppliedKey,
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

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getLocationCodes(
  plan: EsimPackage,
) {
  const location =
    normalizeText(plan.location);

  if (!location) {
    const locationCode =
      normalizeText(
        plan.locationCode,
      );

    return locationCode
      ? [locationCode]
      : [];
  }

  return location
    .split(",")
    .map((code) =>
      code.trim(),
    )
    .filter(Boolean);
}

function getCoverageLabel(
  plan: EsimPackage,
  pricing: CalculatedPlanPrice,
) {
  const locationCodes =
    getLocationCodes(plan);

  /*
   * Do not show the full comma-separated
   * country-code list for Global plans.
   */
  if (pricing.isGlobalPlan) {
    return "120+ countries and regions";
  }

  /*
   * Regional and combo plans show only
   * the number of countries covered.
   */
  if (locationCodes.length > 1) {
    return `${locationCodes.length} countries covered`;
  }

  /*
   * Local plans show the readable
   * country name where possible.
   */
  const countryCode =
    locationCodes[0];

  if (countryCode) {
    const countryName =
      getCountryName(countryCode);

    if (
      countryName &&
      countryName !== countryCode
    ) {
      return countryName;
    }

    return countryCode;
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

/*
 * calculatePlanPrice normally rejects a disabled plan.
 *
 * The admin page still needs to show pricing for disabled
 * plans so they can be reviewed and enabled again.
 *
 * For disabled plans, we use a temporary package code only
 * for the pricing preview. This prevents the pricing service
 * from finding the disabled PlanSetting row while preserving
 * the original plan data and pricing rules.
 */
async function calculateAdminPricing(
  plan: EsimPackage,
  enabled: boolean,
) {
  if (enabled) {
    return calculatePlanPrice(plan);
  }

  const previewPlan: EsimPackage = {
    ...plan,
    packageCode:
      `ADMIN-PREVIEW-${plan.packageCode}`,
  };

  return calculatePlanPrice(
    previewPlan,
  );
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
        .toLowerCase() ?? "";

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

            const enabled =
              setting?.enabled ??
              true;

            const featured =
              setting?.featured ??
              false;

            const pricing =
              await calculateAdminPricing(
                plan,
                enabled,
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
                setting?.customName ??
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
                Number(plan.volume),

              duration:
                Number(plan.duration),

              durationUnit:
                plan.durationUnit,

              enabled,
              featured,

              supplierCostUsd:
                pricing.supplierCostUsd,

              markupAmountUsd:
                pricing.markupAmountUsd,

              sellingPriceUsd:
                pricing.sellingPriceUsd,

              sellingPricePhp:
                pricing.sellingPricePhp,

              amountPhpCentavos:
                pricing.amountPhpCentavos,

              usdToPhpRate:
                pricing.usdToPhpRate,

              isGlobalPlan:
                pricing.isGlobalPlan,

              markupTable:
                pricing.isGlobalPlan
                  ? "GLOBAL"
                  : "STANDARD",

              volumeGb:
                pricing.volumeGb,

              volumeMb:
                pricing.volumeMb,

              updatedAt:
                setting?.updatedAt ??
                null,
            };
          },
        ),
      );

    plans.sort((a, b) => {
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
    });

    return NextResponse.json(
      {
        success: true,
        total: plans.length,
        plans,
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
          error instanceof Error
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

  try {
    const body =
      (await request.json()) as UpdatePlanBody;

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
            .slice(0, 255)
        : null;

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
           * Retained for compatibility with
           * your existing Prisma model.
           *
           * Percentage markup is no longer
           * used by the pricing service.
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

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to update plan settings.",
      },
      {
        status: 500,
      },
    );
  }
}