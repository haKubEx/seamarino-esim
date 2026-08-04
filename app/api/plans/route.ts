import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { fetchEsimAccessPlans } from "@/app/services/esimAccess";

import type { EsimPackage } from "@/app/types/esim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

function normalizeString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function normalizeSupplierPlan(
  plan: EsimPackage,
): EsimPackage | null {
  const packageCode =
    normalizeString(plan.packageCode);

  if (!packageCode) {
    return null;
  }

  const price = normalizeNumber(
    plan.price,
  );

  const volume = normalizeNumber(
    plan.volume,
  );

  const duration = normalizeNumber(
    plan.duration,
  );

  if (
    price <= 0 ||
    volume <= 0 ||
    duration <= 0
  ) {
    console.warn(
      "Skipping invalid supplier plan:",
      {
        packageCode,
        price,
        volume,
        duration,
      },
    );

    return null;
  }

  return {
    ...plan,

    packageCode,

    name:
      normalizeString(plan.name) ||
      packageCode,

    price,

    currencyCode:
      normalizeString(
        plan.currencyCode,
      ) || "USD",

    location:
      normalizeString(plan.location),

    locationCode:
      normalizeString(
        plan.locationCode,
      ) || undefined,

    speed:
      normalizeString(plan.speed),

    duration,

    durationUnit:
      normalizeString(
        plan.durationUnit,
      ) || "DAY",

    volume,

    supportTopUpType:
      normalizeString(
        plan.supportTopUpType,
      ),

    description:
      normalizeString(
        plan.description,
      ) || undefined,

    saleNote:
      normalizeString(
        plan.saleNote,
      ) || undefined,
  };
}

export async function GET() {
  try {
    const [
      supplierResponse,
      savedSettings,
    ] = await Promise.all([
      fetchEsimAccessPlans(),

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

    if (!Array.isArray(
      supplierResponse,
    )) {
      throw new Error(
        "The eSIM supplier returned an invalid plans response.",
      );
    }

    const settingsByPackageCode =
      new Map(
        savedSettings.map(
          (setting) => [
            setting.packageCode.trim(),
            setting,
          ],
        ),
      );

    const plans =
      supplierResponse
        .map((supplierPlan) =>
          normalizeSupplierPlan(
            supplierPlan,
          ),
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
              plan.packageCode,
            );

          /*
           * New supplier plans are enabled by default
           * until an admin explicitly disables them.
           */
          return setting?.enabled ?? true;
        })
        .map((plan) => {
          const setting =
            settingsByPackageCode.get(
              plan.packageCode,
            );

          const customName =
            setting?.customName?.trim();

          const markupPercent =
            Number(
              setting?.markupPercent ??
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
              Number.isFinite(
                markupPercent,
              ) &&
              markupPercent >= 0
                ? markupPercent
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

    return NextResponse.json(
      plans,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error(
      "PUBLIC PLANS API ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load eSIM plans.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}