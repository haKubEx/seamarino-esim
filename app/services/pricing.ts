import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getUsdToPhpRate } from "@/app/services/settings";
import type { EsimPackage } from "@/app/types/esim";

export type CalculatedPlanPrice = {
  supplierCostUsd: number;
  markupAmountUsd: number;
  sellingPriceUsd: number;
  sellingPricePhp: number;
  amountPhpCentavos: number;
  usdToPhpRate: number;
  isLocalPlan: boolean;
  volumeGb: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getVolumeGb(volumeBytes: number) {
  if (
    !Number.isFinite(volumeBytes) ||
    volumeBytes <= 0
  ) {
    return 0;
  }

  return (
    volumeBytes /
    1024 /
    1024 /
    1024
  );
}

function getLocalPlanMarkupUsd(
  volumeBytes: number,
) {
  const volumeGb =
    getVolumeGb(volumeBytes);

  /*
   * Round the supplier volume because
   * packages normally represent whole GB values.
   */
  const roundedGb =
    Math.round(volumeGb);

  const markupByGb: Record<
    number,
    number
  > = {
    1: 1,
    3: 2,
    5: 2,
    10: 3,
    15: 3,
    20: 3,
    30: 3,
    50: 5.5,
  };

  return markupByGb[roundedGb] ?? 0;
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isExcludedPackage(
  plan: EsimPackage,
) {
  const searchableText = [
    plan.name,
    plan.packageCode,
    plan.location,
    plan.locationCode,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  /*
   * These packages must not receive the
   * automatic local-country markup.
   */
  const excludedWords = [
    "global",
    "regional",
    "region",
    "combo",
    "multi-country",
    "multi country",
    "world",
    "worldwide",
    "europe",
    "asia",
    "africa",
    "middle east",
    "north america",
    "south america",
    "oceania",
    "balkan",
    "caribbean",
  ];

  return excludedWords.some((word) =>
    searchableText.includes(word),
  );
}

function countLocationCodes(
  location: string | undefined,
) {
  if (!location?.trim()) {
    return 0;
  }

  return location
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean).length;
}

function determineIsLocalPlan(
  plan: EsimPackage,
) {
  if (isExcludedPackage(plan)) {
    return false;
  }

  const locationCount =
    countLocationCodes(plan.location);

  /*
   * A comma-separated location list indicates
   * a regional or multi-country package.
   */
  if (locationCount > 1) {
    return false;
  }

  /*
   * A single location code normally indicates
   * a local-country plan.
   */
  if (
    locationCount === 1 ||
    plan.locationCode?.trim()
  ) {
    return true;
  }

  return false;
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
   * eSIM Access returns its price in
   * thousandths of one US dollar.
   *
   * Example:
   * 47000 becomes $47.00.
   */
  const supplierCostUsd =
    roundCurrency(
      rawSupplierPrice / 1000,
    );

  const volume =
    Number(plan.volume);

  const volumeGb =
    getVolumeGb(volume);

  const isLocalPlan =
    determineIsLocalPlan(plan);

  /*
   * Apply the GB markup only to local plans.
   * Regional, combo, and global packages get $0.
   */
  const markupAmountUsd =
    isLocalPlan
      ? getLocalPlanMarkupUsd(volume)
      : 0;

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
      supplierCostUsd +
        markupAmountUsd,
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
    markupAmountUsd,
    sellingPriceUsd,
    sellingPricePhp,
    amountPhpCentavos,
    usdToPhpRate,
    isLocalPlan,
    volumeGb,
  };
}