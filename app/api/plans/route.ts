import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";
import {
  calculatePlanPrice,
} from "@/app/services/pricing";
import {
  getUsdToPhpRate,
} from "@/app/services/settings";
import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

export async function GET() {
  try {
    console.log(
      "Loading supplier plans...",
    );

    const supplierPlans =
      await fetchEsimAccessPlans();

    console.log(
      `Supplier plans: ${supplierPlans.length}`,
    );

    const [
      savedSettings,
      usdToPhpRate,
    ] = await Promise.all([
      prisma.planSetting.findMany(),

      getUsdToPhpRate(),
    ]);

    const settingMap = new Map(
      savedSettings.map((setting) => [
        setting.packageCode,
        setting,
      ]),
    );

    const enabledPlans =
      supplierPlans.filter((plan) => {
        const packageCode =
          plan.packageCode?.trim();

        if (!packageCode) {
          return false;
        }

        const setting =
          settingMap.get(packageCode);

        return (
          setting?.enabled ?? true
        );
      });

    console.log(
      `Enabled plans: ${enabledPlans.length}`,
    );

    const pricedPlans =
      await Promise.all(
        enabledPlans.map(
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
                {
                  enabled:
                    setting?.enabled ??
                    true,

                  usdToPhpRate,
                },
              );

            const displayName =
              setting?.customName?.trim() ||
              plan.name ||
              packageCode;

            return {
              ...plan,

              packageCode,

              name:
                displayName,

              displayName,

              locationName:
                getLocationName(
                  plan,
                ),

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

              volumeGb:
                pricing.volumeGb,

              volumeMb:
                pricing.volumeMb,

              isGlobalPlan:
                pricing.isGlobalPlan,

              markupTable:
                pricing.isGlobalPlan
                  ? "GLOBAL"
                  : "STANDARD",
            };
          },
        ),
      );

    pricedPlans.sort((a, b) => {
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

      return String(
        a.displayName,
      ).localeCompare(
        String(
          b.displayName,
        ),
      );
    });

    console.log(
      "Plans API completed.",
    );

    return NextResponse.json(
      pricedPlans,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "PUBLIC PLANS API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load plans.",
      },
      {
        status: 500,
      },
    );
  }
}