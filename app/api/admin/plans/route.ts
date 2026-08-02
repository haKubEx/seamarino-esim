import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";
import { calculatePlanPrice } from "@/app/services/pricing";
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

function getLocationName(
  plan: EsimPackage,
) {
  if (
    typeof plan.location === "string" &&
    plan.location.trim()
  ) {
    return plan.location.trim();
  }

  if (
    typeof plan.locationCode === "string" &&
    plan.locationCode.trim()
  ) {
    return plan.locationCode.trim();
  }

  return "Unknown";
}

function normalizeSearchValue(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
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

    const supplierPlans =
      await fetchEsimAccessPlans();

    const savedSettings =
      await prisma.planSetting.findMany();

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

          const searchableText = [
            packageCode,
            normalizeSearchValue(
              plan.name,
            ),
            normalizeSearchValue(
              plan.location,
            ),
            normalizeSearchValue(
              plan.locationCode,
            ),
            normalizeSearchValue(
              plan.description,
            ),
            normalizeSearchValue(
              plan.saleNote,
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            search,
          );
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

            const displayName =
              setting?.customName?.trim() ||
              plan.name ||
              packageCode;

            return {
              packageCode,

              supplierName:
                plan.name ||
                packageCode,

              displayName,

              customName:
                setting?.customName ??
                null,

              locationName:
                getLocationName(plan),

              locationCode:
                plan.locationCode ??
                null,

              volume:
                plan.volume,

              duration:
                plan.duration,

              durationUnit:
                plan.durationUnit,

              enabled:
                setting?.enabled ??
                true,

              featured:
                setting?.featured ??
                false,

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

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length,
    });
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
        ? body.customName.trim()
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
           * The old percentage field is
           * retained only for compatibility
           * with the current Prisma model.
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

    return NextResponse.json({
      success: true,

      message:
        "Plan settings updated successfully.",

      setting,
    });
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