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
  volumeMb: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function getVolumeMb(volumeBytes: number) {
  if (
    !Number.isFinite(volumeBytes) ||
    volumeBytes <= 0
  ) {
    return 0;
  }

  return volumeBytes / 1024 / 1024;
}

function getVolumeGb(volumeBytes: number) {
  if (
    !Number.isFinite(volumeBytes) ||
    volumeBytes <= 0
  ) {
    return 0;
  }

  return volumeBytes / 1024 / 1024 / 1024;
}

function approximatelyEqual(
  firstValue: number,
  secondValue: number,
  tolerance: number,
) {
  return (
    Math.abs(firstValue - secondValue) <=
    tolerance
  );
}

function getLocalPlanMarkupUsd(
  volumeBytes: number,
) {
  const volumeMb =
    getVolumeMb(volumeBytes);

  const volumeGb =
    getVolumeGb(volumeBytes);

  /*
   * Local plans smaller than 1 GB.
   */
  if (
    approximatelyEqual(
      volumeMb,
      100,
      1,
    )
  ) {
    return 0.5;
  }

  if (
    approximatelyEqual(
      volumeMb,
      500,
      1,
    )
  ) {
    return 0.7;
  }

  /*
   * Whole-GB local plans.
   */
  const roundedGb =
    Math.round(volumeGb);

  const markupByGb: Record<
    number,
    number
  > = {
    1: 1,
    3: 2,
    5: 3,
    10: 3,
    15: 3,
    20: 3,
    30: 3,
    50: 5.5,
  };

  return markupByGb[roundedGb] ?? 0;
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
    "balkans",
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
    countLocationCodes(
      plan.location,
    );

  /*
   * More than one location means regional,
   * combo, or multi-country.
   */
  if (locationCount > 1) {
    return false;
  }

  /*
   * A single location normally means
   * a local-country package.
   */
  if (locationCount === 1) {
    return true;
  }

  if (
    typeof plan.locationCode ===
      "string" &&
    plan.locationCode.trim()
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
        packageCode:
          plan.packageCode,
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
    !Number.isFinite(
      rawSupplierPrice,
    ) ||
    rawSupplierPrice <= 0
  ) {
    throw new Error(
      "The supplier price for this plan is invalid.",
    );
  }

  /*
   * eSIM Access returns prices in
   * thousandths of one US dollar.
   *
   * Example:
   * 47000 = $47.00
   */
  const supplierCostUsd =
    roundCurrency(
      rawSupplierPrice / 1000,
    );

  const volumeBytes =
    Number(plan.volume);

  const volumeMb =
    getVolumeMb(
      volumeBytes,
    );

  const volumeGb =
    getVolumeGb(
      volumeBytes,
    );

  const isLocalPlan =
    determineIsLocalPlan(
      plan,
    );

  /*
   * Apply automatic markup only to
   * local-country plans.
   *
   * Regional, combo, and global plans
   * receive no automatic local markup.
   */
  const markupAmountUsd =
    isLocalPlan
      ? getLocalPlanMarkupUsd(
          volumeBytes,
        )
      : 0;

  const usdToPhpRate =
    await getUsdToPhpRate();

  if (
    !Number.isFinite(
      usdToPhpRate,
    ) ||
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
    volumeMb,
  };
}