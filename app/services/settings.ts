import "server-only";

import { prisma } from "@/app/lib/prisma";

const DEFAULT_USD_TO_PHP_RATE = 58;

export async function getAppSettings() {
  return prisma.appSetting.upsert({
    where: {
      id: "main",
    },

    update: {},

    create: {
      id: "main",
      usdToPhpRate: DEFAULT_USD_TO_PHP_RATE,
    },
  });
}

export async function getUsdToPhpRate() {
  const settings = await getAppSettings();

  const rate = Number(settings.usdToPhpRate);

  if (!Number.isFinite(rate) || rate <= 0) {
    return DEFAULT_USD_TO_PHP_RATE;
  }

  return rate;
}

export async function updateUsdToPhpRate(
  newRate: number,
) {
  if (
    !Number.isFinite(newRate) ||
    newRate <= 0 ||
    newRate > 1000
  ) {
    throw new Error(
      "Enter a valid USD-to-PHP exchange rate.",
    );
  }

  return prisma.appSetting.upsert({
    where: {
      id: "main",
    },

    update: {
      usdToPhpRate: newRate,
    },

    create: {
      id: "main",
      usdToPhpRate: newRate,
    },
  });
}