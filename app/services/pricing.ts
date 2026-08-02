import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getUsdToPhpRate } from "@/app/services/settings";
import type { EsimPackage } from "@/app/types/esim";

export type CalculatedPlanPrice = {
  supplierCostUsd: number;
  sellingPriceUsd: number;
  sellingPricePhp: number;
  amountPhpCentavos: number;
  markupPercent: number;
  usdToPhpRate: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export async function calculatePlanPrice(
  plan: EsimPackage,
): Promise<CalculatedPlanPrice> {
  const planSetting =
    await prisma.planSetting.findUnique({
      where: {
        packageCode: plan.packageCode,
      },
    });

  if (planSetting?.enabled === false) {
    throw new Error(
      "The selected eSIM plan is currently unavailable.",
    );
  }

  const rawSupplierPrice =
    Number(plan.price);

  if (
    !Number.isFinite(rawSupplierPrice) ||
    rawSupplierPrice <= 0
  ) {
    throw new Error(
      "The supplier price for this plan is invalid.",
    );
  }

  /*
   * eSIM Access returns price in thousandths
   * of one US dollar.
   */
  const supplierCostUsd =
    rawSupplierPrice / 1000;

  const markupPercent =
    planSetting?.markupPercent ?? 20;

  if (
    !Number.isFinite(markupPercent) ||
    markupPercent < 0 ||
    markupPercent > 1000
  ) {
    throw new Error(
      "The saved markup percentage is invalid.",
    );
  }

  const usdToPhpRate =
    await getUsdToPhpRate();

  if (
    !Number.isFinite(usdToPhpRate) ||
    usdToPhpRate <= 0
  ) {
    throw new Error(
      "The USD-to-PHP exchange rate is invalid.",
    );
  }

  const sellingPriceUsd =
    roundCurrency(
      supplierCostUsd *
        (1 + markupPercent / 100),
    );

  const sellingPricePhp =
    roundCurrency(
      sellingPriceUsd *
        usdToPhpRate,
    );

  const amountPhpCentavos =
    Math.round(
      sellingPricePhp * 100,
    );

  if (
    !Number.isSafeInteger(
      amountPhpCentavos,
    ) ||
    amountPhpCentavos <= 0
  ) {
    throw new Error(
      "The calculated PHP checkout amount is invalid.",
    );
  }

  return {
    supplierCostUsd,
    sellingPriceUsd,
    sellingPricePhp,
    amountPhpCentavos,
    markupPercent,
    usdToPhpRate,
  };
}