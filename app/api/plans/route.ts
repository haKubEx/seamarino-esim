import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";
import { getUsdToPhpRate } from "@/app/services/settings";
import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupplierCostUsd(
  plan: EsimPackage,
) {
  const rawPrice = Number(
    plan.price,
  );

  if (
    !Number.isFinite(rawPrice) ||
    rawPrice < 0
  ) {
    return 0;
  }

  /*
   * eSIM Access returns prices in
   * thousandths of one USD.
   */
  return rawPrice / 1000;
}

function getLocationName(
  plan: EsimPackage,
) {
  if (
    typeof plan.location ===
      "string" &&
    plan.location.trim()
  ) {
    return plan.location.trim();
  }

  if (
    typeof plan.locationCode ===
      "string" &&
    plan.locationCode.trim()
  ) {
    return plan.locationCode.trim();
  }

  return "Unknown";
}

function roundCurrency(
  value: number,
) {
  return (
    Math.round(value * 100) /
    100
  );
}

export async function GET() {
  try {
    const [
      supplierPlans,
      savedSettings,
      usdToPhpRate,
    ] = await Promise.all([
      fetchEsimAccessPlans(),

      prisma.planSetting.findMany(),

      getUsdToPhpRate(),
    ]);

    const settingMap = new Map(
      savedSettings.map(
        (setting) => [
          setting.packageCode,
          setting,
        ],
      ),
    );

    const plans = supplierPlans
      .filter((plan) => {
        const packageCode =
          plan.packageCode?.trim();

        if (!packageCode) {
          return false;
        }

        const setting =
          settingMap.get(
            packageCode,
          );

        return (
          setting?.enabled ??
          true
        );
      })
      .map((plan) => {
        const packageCode =
          plan.packageCode.trim();

        const setting =
          settingMap.get(
            packageCode,
          );

        const supplierCostUsd =
          getSupplierCostUsd(
            plan,
          );

        const markupPercent =
          setting?.markupPercent ??
          20;

        const sellingPriceUsd =
          roundCurrency(
            supplierCostUsd *
              (1 +
                markupPercent /
                  100),
          );

        const sellingPricePhp =
          roundCurrency(
            sellingPriceUsd *
              usdToPhpRate,
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

          markupPercent,

          supplierCostUsd,

          sellingPriceUsd,

          sellingPricePhp,

          amountPhpCentavos:
            Math.round(
              sellingPricePhp *
                100,
            ),

          usdToPhpRate,
        };
      })
      .sort((a, b) => {
        if (
          a.featured !==
          b.featured
        ) {
          return a.featured
            ? -1
            : 1;
        }

        return String(
          a.displayName,
        ).localeCompare(
          String(
            b.displayName,
          ),
        );
      });

    return NextResponse.json(
      plans,
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