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
  volumeGb: number;
  volumeMb: number;
  isGlobalPlan: boolean;
};

export type CalculatePlanPriceOptions = {
  /*
   * Pass a preloaded exchange rate to avoid
   * querying AppSetting repeatedly.
   */
  usdToPhpRate?: number;

  /*
   * Pass the preloaded PlanSetting enabled
   * value to avoid querying PlanSetting again.
   */
  enabled?: boolean;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
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

  return (
    volumeBytes /
    1024 /
    1024 /
    1024
  );
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isGlobalPlan(
  plan: EsimPackage,
) {
  const searchableText = [
    plan.name,
    plan.packageCode,
    plan.location,
    plan.locationCode,
    plan.description,
    plan.saleNote,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  return (
    searchableText.includes("global") ||
    searchableText.includes(
      "worldwide",
    ) ||
    searchableText.includes(
      "world wide",
    )
  );
}

function getStandardMarkupUsd(
  volumeBytes: number,
) {
  const volumeMb =
    getVolumeMb(volumeBytes);

  const volumeGb =
    getVolumeGb(volumeBytes);

  if (volumeMb <= 100) {
    return 0.5;
  }

  if (volumeMb <= 500) {
    return 0.7;
  }

  if (volumeGb <= 1) {
    return 1;
  }

  if (volumeGb <= 3) {
    return 2;
  }

  if (volumeGb <= 5) {
    return 3;
  }

  if (volumeGb <= 10) {
    return 3;
  }

  if (volumeGb <= 15) {
    return 3;
  }

  if (volumeGb <= 20) {
    return 3;
  }

  if (volumeGb <= 30) {
    return 3;
  }

  if (volumeGb <= 50) {
    return 5.5;
  }

  return 5.5;
}

function getGlobalMarkupUsd(
  volumeBytes: number,
) {
  const volumeMb =
    getVolumeMb(volumeBytes);

  const volumeGb =
    getVolumeGb(volumeBytes);

  if (volumeMb <= 100) {
    return 1;
  }

  if (volumeMb <= 500) {
    return 1;
  }

  if (volumeGb <= 1) {
    return 2;
  }

  if (volumeGb <= 3) {
    return 4;
  }

  if (volumeGb <= 5) {
    return 6;
  }

  if (volumeGb <= 10) {
    return 8;
  }

  if (volumeGb <= 15) {
    return 9;
  }

  if (volumeGb <= 20) {
    return 10;
  }

  if (volumeGb <= 30) {
    return 12;
  }

  if (volumeGb <= 50) {
    return 15;
  }

  return 15;
}

function validatePackageCode(
  plan: EsimPackage,
) {
  const packageCode =
    plan.packageCode?.trim();

  if (!packageCode) {
    throw new Error(
      "The eSIM package code is missing.",
    );
  }

  return packageCode;
}

async function resolvePlanEnabled({
  packageCode,
  suppliedEnabled,
}: {
  packageCode: string;
  suppliedEnabled:
    | boolean
    | undefined;
}) {
  /*
   * When the caller already loaded all plan
   * settings, use that supplied value and do
   * not perform another database query.
   */
  if (
    typeof suppliedEnabled ===
    "boolean"
  ) {
    return suppliedEnabled;
  }

  /*
   * Backward-compatible fallback for routes
   * that still call calculatePlanPrice(plan)
   * without preloading PlanSetting.
   */
  const planSetting =
    await prisma.planSetting.findUnique({
      where: {
        packageCode,
      },

      select: {
        enabled: true,
      },
    });

  return planSetting?.enabled ?? true;
}

async function resolveUsdToPhpRate(
  suppliedRate:
    | number
    | undefined,
) {
  /*
   * The public plans API passes one preloaded
   * exchange rate for the whole package list.
   */
  if (
    typeof suppliedRate ===
    "number"
  ) {
    return suppliedRate;
  }

  /*
   * Backward-compatible fallback for checkout
   * and other individual-plan callers.
   */
  return getUsdToPhpRate();
}

export async function calculatePlanPrice(
  plan: EsimPackage,
  options: CalculatePlanPriceOptions = {},
): Promise<CalculatedPlanPrice> {
  const packageCode =
    validatePackageCode(plan);

  const enabled =
    await resolvePlanEnabled({
      packageCode,

      suppliedEnabled:
        options.enabled,
    });

  if (!enabled) {
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
   * eSIM Access price format:
   *
   * 10000 = $1.00 USD
   */
  const supplierCostUsd =
    roundCurrency(
      rawSupplierPrice / 10000,
    );

  const volumeBytes =
    Number(plan.volume);

  if (
    !Number.isFinite(
      volumeBytes,
    ) ||
    volumeBytes <= 0
  ) {
    throw new Error(
      "The data allowance for this plan is invalid.",
    );
  }

  const volumeMb =
    getVolumeMb(volumeBytes);

  const volumeGb =
    getVolumeGb(volumeBytes);

  const globalPlan =
    isGlobalPlan(plan);

  const markupAmountUsd =
    globalPlan
      ? getGlobalMarkupUsd(
          volumeBytes,
        )
      : getStandardMarkupUsd(
          volumeBytes,
        );

  const usdToPhpRate =
    await resolveUsdToPhpRate(
      options.usdToPhpRate,
    );

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
    volumeGb,
    volumeMb,
    isGlobalPlan:
      globalPlan,
  };
}