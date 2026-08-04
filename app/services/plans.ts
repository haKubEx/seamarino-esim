import "server-only";

import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";

import type { EsimPackage } from "@/app/types/esim";

const PLAN_CACHE_TTL_MS =
  Number(
    process.env.ESIM_PLAN_CACHE_TTL_MS ??
      "300000",
  );

type PlanCache = {
  supplierPlans: EsimPackage[] | null;
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
  globalThis.seamarinoPlanCache ?? {
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
  return typeof value === "string"
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

function normalizeSupplierPlan(
  supplierPlan: EsimPackage,
): EsimPackage | null {
  const packageCode =
    normalizeText(
      supplierPlan.packageCode,
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

  return {
    ...supplierPlan,

    packageCode,

    name:
      normalizeText(
        supplierPlan.name,
      ) || packageCode,

    price,

    currencyCode:
      normalizeText(
        supplierPlan.currencyCode,
      ) || "USD",

    location:
      normalizeText(
        supplierPlan.location,
      ),

    locationCode:
      normalizeText(
        supplierPlan.locationCode,
      ) || undefined,

    speed:
      normalizeText(
        supplierPlan.speed,
      ) || "Unknown",

    duration,

    durationUnit:
      normalizeText(
        supplierPlan.durationUnit,
      ) || "DAY",

    volume,

    supportTopUpType:
      normalizeText(
        supplierPlan.supportTopUpType,
      ),

    description:
      normalizeText(
        supplierPlan.description,
      ) || undefined,

    saleNote:
      normalizeText(
        supplierPlan.saleNote,
      ) || undefined,
  };
}

/**
 * Loads the large supplier response into process memory.
 *
 * This avoids Next.js Data Cache's per-item size limit.
 * Simultaneous requests share one pending supplier request.
 */
async function getSupplierPlans(): Promise<
  EsimPackage[]
> {
  const now =
    Date.now();

  if (
    planCache.supplierPlans &&
    planCache.expiresAt > now
  ) {
    console.info(
      "ESIM PLANS: Using memory cache",
      {
        packageCount:
          planCache
            .supplierPlans
            .length,

        expiresInMs:
          planCache.expiresAt -
          now,
      },
    );

    return planCache.supplierPlans;
  }

  if (
    planCache.pendingRequest
  ) {
    console.info(
      "ESIM PLANS: Waiting for existing supplier request",
    );

    return planCache.pendingRequest;
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
                supplierPlans.length,

              ttlMs:
                PLAN_CACHE_TTL_MS,
            },
          );

          return supplierPlans;
        },
      )
      .catch((error) => {
        /*
         * If a refresh fails but an older list exists,
         * continue serving that list instead of taking
         * the store offline.
         */
        if (
          planCache.supplierPlans
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

          return planCache.supplierPlans;
        }

        throw error;
      })
      .finally(() => {
        planCache.pendingRequest =
          null;
      });

  return planCache.pendingRequest;
}

export async function getPlans(): Promise<
  EsimPackage[]
> {
  const [
    supplierPlans,
    savedSettings,
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
  ]);

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
        settingsByPackageCode.get(
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
        settingsByPackageCode.get(
          plan.packageCode
            .toUpperCase(),
        );

      const customName =
        normalizeText(
          setting?.customName,
        );

      const configuredMarkup =
        normalizeNumber(
          setting?.markupPercent,
          20,
        );

      return {
        ...plan,

        name:
          customName ||
          plan.name,

        featured:
          setting?.featured ??
          false,

        markupPercent:
          configuredMarkup >= 0
            ? configuredMarkup
            : 20,
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

        return firstPlan.name.localeCompare(
          secondPlan.name,
        );
      },
    );
}

/**
 * Optional helper for admin tools or debugging.
 */
export function clearPlanMemoryCache() {
  planCache.supplierPlans =
    null;

  planCache.expiresAt =
    0;

  planCache.pendingRequest =
    null;
}