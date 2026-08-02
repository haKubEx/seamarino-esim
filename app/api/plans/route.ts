import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";
import { calculatePlanPrice } from "@/app/services/pricing";
import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getLocationName(plan: EsimPackage) {
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
    const supplierPlans =
      await fetchEsimAccessPlans();

    const savedSettings =
      await prisma.planSetting.findMany();

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

        return setting?.enabled ?? true;
      });

    const pricedPlans =
      await Promise.all(
        enabledPlans.map(async (plan) => {
          const packageCode =
            plan.packageCode.trim();

          const setting =
            settingMap.get(packageCode);

          const pricing =
            await calculatePlanPrice(plan);

          const displayName =
            setting?.customName?.trim() ||
            plan.name ||
            packageCode;

          return {
            ...plan,

            packageCode,

            name: displayName,
            displayName,

            locationName:
              getLocationName(plan),

            enabled:
              setting?.enabled ?? true,

            featured:
              setting?.featured ?? false,

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
          };
        }),
      );

    pricedPlans.sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
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
        String(b.displayName),
      );
    });

    return NextResponse.json(
      pricedPlans,
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
      "PUBLIC PLANS API ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load eSIM plans.",
      },
      {
        status: 500,
      },
    );
  }
}