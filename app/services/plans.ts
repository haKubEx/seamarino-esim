import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  calculatePlanPrice,
} from "@/app/lib/pricing";
import {
  fetchEsimAccessPlans,
} from "@/app/services/esimAccess";

import type {
  EsimPackage,
} from "@/app/types/esim";

const DEFAULT_PLAN_CACHE_TTL_MS =
  300_000;

const DEFAULT_USD_TO_PHP_RATE =
  58;

const DEFAULT_MARKUP_PERCENT =
  20;

const configuredCacheTtl =
  Number(
    process.env
      .ESIM_PLAN_CACHE_TTL_MS ??
      DEFAULT_PLAN_CACHE_TTL_MS,
  );

const PLAN_CACHE_TTL_MS =
  Number.isFinite(
    configuredCacheTtl,
  ) &&
  configuredCacheTtl > 0
    ? configuredCacheTtl
    : DEFAULT_PLAN_CACHE_TTL_MS;

type PlanCache = {
  supplierPlans:
    | EsimPackage[]
    | null;

  expiresAt: number;

  pendingRequest:
    | Promise<EsimPackage[]>
    | null;
};

declare global {
  // eslint-disable-next-line no-var
  var seamarinoPlanCache:
    | PlanCache
    | undefined;
}

const planCache: PlanCache =
  globalThis
    .seamarinoPlanCache ?? {
    supplierPlans: null,
    expiresAt: 0,
    pendingRequest: null,
  };

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalThis.seamarinoPlanCache =
    planCache;
}

function normalizeText(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
): number {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue,
  )
    ? numericValue
    : fallback;
}

function normalizeBoolean(
  value: unknown,
  fallback = false,
): boolean {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return value !== 0;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      [
        "1",
        "true",
        "yes",
      ].includes(
        normalized,
      )
    ) {
      return true;
    }

    if (
      [
        "0",
        "false",
        "no",
      ].includes(
        normalized,
      )
    ) {
      return false;
    }
  }

  return fallback;
}

function normalizeDescriptionList(
  value: unknown,
): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const descriptions =
    value
      .map((item) =>
        normalizeText(item),
      )
      .filter(Boolean);

  return descriptions.length > 0
    ? descriptions
    : undefined;
}

function getLocationCodes(
  plan: EsimPackage,
): string[] {
  const location =
    normalizeText(
      plan.location,
    );

  if (!location) {
    return [];
  }

  return location
    .split(",")
    .map((code) =>
      code.trim(),
    )
    .filter(Boolean);
}

function normalizeSupplierPlan(
  supplierPlan: EsimPackage,
): EsimPackage | null {
  const packageCode =
    normalizeText(
      supplierPlan
        .packageCode,
    );

  if (!packageCode) {
    return null;
  }

  const price =
    normalizeNumber(
      supplierPlan.price,
    );

  const volume =
    normalizeNumber(
      supplierPlan.volume,
    );

  const duration =
    normalizeNumber(
      supplierPlan.duration,
    );

  const normalizedPlan:
    EsimPackage = {
    ...supplierPlan,

    packageCode,

    name:
      normalizeText(
        supplierPlan.name,
      ) ||
      packageCode,

    price,

    currencyCode:
      normalizeText(
        supplierPlan
          .currencyCode,
      ) ||
      "USD",

    location:
      normalizeText(
        supplierPlan.location,
      ),

    locationCode:
      normalizeText(
        supplierPlan
          .locationCode,
      ) ||
      undefined,

    speed:
      normalizeText(
        supplierPlan.speed,
      ) ||
      "Unknown",

    duration,

    durationUnit:
      normalizeText(
        supplierPlan
          .durationUnit,
      ) ||
      "DAY",

    volume,

    supportTopUpType:
      normalizeText(
        supplierPlan
          .supportTopUpType,
      ),

    description:
      normalizeText(
        supplierPlan
          .description,
      ) ||
      undefined,

    descriptionList:
      normalizeDescriptionList(
        supplierPlan
          .descriptionList,
      ),

    saleNote:
      normalizeText(
        supplierPlan
          .saleNote,
      ) ||
      undefined,

    featured:
      normalizeBoolean(
        supplierPlan.featured,
      ),

    favorite:
      normalizeBoolean(
        supplierPlan.favorite,
      ),
  };

  const locations =
    getLocationCodes(
      normalizedPlan,
    );

  return {
    ...normalizedPlan,

    isLocalPlan:
      locations.length <= 1,
  };
}

/**
 * Loads the supplier list into process memory.
 *
 * This avoids large Next.js Data Cache entries,
 * and simultaneous requests share one pending
 * supplier request.
 */
async function getSupplierPlans():
  Promise<EsimPackage[]> {
  const now =
    Date.now();

  if (
    planCache.supplierPlans &&
    planCache.expiresAt >
      now
  ) {
    console.info(
      "ESIM PLANS: Using memory cache",
      {
        packageCount:
          planCache
            .supplierPlans
            .length,

        expiresInMs:
          planCache
            .expiresAt -
          now,
      },
    );

    return planCache
      .supplierPlans;
  }

  if (
    planCache.pendingRequest
  ) {
    console.info(
      "ESIM PLANS: Waiting for existing supplier request",
    );

    return planCache
      .pendingRequest;
  }

  planCache.pendingRequest =
    fetchEsimAccessPlans()
      .then(
        (
          supplierPlans,
        ) => {
          if (
            !Array.isArray(
              supplierPlans,
            )
          ) {
            throw new Error(
              "The eSIM supplier returned an invalid plans response.",
            );
          }

          planCache.supplierPlans =
            supplierPlans;

          planCache.expiresAt =
            Date.now() +
            PLAN_CACHE_TTL_MS;

          console.info(
            "ESIM PLANS: Memory cache updated",
            {
              packageCount:
                supplierPlans
                  .length,

              ttlMs:
                PLAN_CACHE_TTL_MS,
            },
          );

          return supplierPlans;
        },
      )
      .catch(
        (
          error: unknown,
        ) => {
          if (
            planCache
              .supplierPlans
          ) {
            console.warn(
              "ESIM PLANS: Supplier refresh failed; using stale memory cache",
              {
                error:
                  error instanceof
                  Error
                    ? error.message
                    : String(
                        error,
                      ),
              },
            );

            planCache.expiresAt =
              Date.now() +
              60_000;

            return planCache
              .supplierPlans;
          }

          throw error;
        },
      )
      .finally(() => {
        planCache.pendingRequest =
          null;
      });

  return planCache
    .pendingRequest;
}

export async function getPlans():
  Promise<EsimPackage[]> {
  const [
    supplierPlans,
    savedSettings,
    appSetting,
  ] = await Promise.all([
    getSupplierPlans(),

    prisma.planSetting.findMany({
      select: {
        packageCode: true,
        enabled: true,
        featured: true,
        markupPercent: true,
        customName: true,
      },
    }),

    prisma.appSetting.findUnique({
      where: {
        id: "main",
      },

      select: {
        usdToPhpRate: true,
      },
    }),
  ]);

  const usdToPhpRate =
    Math.max(
      0,
      normalizeNumber(
        appSetting
          ?.usdToPhpRate,
        DEFAULT_USD_TO_PHP_RATE,
      ),
    );

  const settingsByPackageCode =
    new Map(
      savedSettings.map(
        (setting) => [
          setting.packageCode
            .trim()
            .toUpperCase(),

          setting,
        ],
      ),
    );

  return supplierPlans
    .map(
      normalizeSupplierPlan,
    )
    .filter(
      (
        plan,
      ): plan is EsimPackage =>
        plan !== null,
    )
    .filter((plan) => {
      const setting =
        settingsByPackageCode
          .get(
            plan.packageCode
              .toUpperCase(),
          );

      return (
        setting?.enabled ??
        true
      );
    })
    .map((plan) => {
      const setting =
        settingsByPackageCode
          .get(
            plan.packageCode
              .toUpperCase(),
          );

      const customName =
        normalizeText(
          setting?.customName,
        );

      const configuredMarkup =
        Math.max(
          0,
          normalizeNumber(
            setting
              ?.markupPercent,
            DEFAULT_MARKUP_PERCENT,
          ),
        );

      const pricing =
        calculatePlanPrice({
          supplierPrice:
            plan.price,

          volume:
            plan.volume,

          usdToPhpRate,

          markupPercent:
            configuredMarkup,
        });

      const locations =
        getLocationCodes(
          plan,
        );

      return {
        ...plan,

        name:
          customName ||
          plan.name,

        displayName:
          customName ||
          plan.name,

        enabled:
          setting?.enabled ??
          true,

        featured:
          setting?.featured ??
          plan.featured ??
          false,

        favorite:
          plan.favorite ??
          false,

        markupPercent:
          configuredMarkup,

        isLocalPlan:
          locations.length <= 1,

        supplierCostUsd:
          pricing
            .supplierCostUsd,

        markupAmountUsd:
          pricing
            .markupAmountUsd,

        sellingPriceUsd:
          pricing
            .sellingPriceUsd,

        sellingPricePhp:
          pricing
            .sellingPricePhp,

        amountPhpCentavos:
          pricing
            .amountPhpCentavos,

        volumeGb:
          pricing.volumeGb,

        volumeMb:
          pricing.volumeMb,
      };
    })
    .sort(
      (
        firstPlan,
        secondPlan,
      ) => {
        const firstFeatured =
          Boolean(
            firstPlan.featured,
          );

        const secondFeatured =
          Boolean(
            secondPlan.featured,
          );

        if (
          firstFeatured !==
          secondFeatured
        ) {
          return firstFeatured
            ? -1
            : 1;
        }

        return firstPlan
          .name
          .localeCompare(
            secondPlan.name,
          );
      },
    );
}

/**
 * Optional helper for admin tools and debugging.
 */
export function clearPlanMemoryCache():
  void {
  planCache.supplierPlans =
    null;

  planCache.expiresAt =
    0;

  planCache.pendingRequest =
    null;
}