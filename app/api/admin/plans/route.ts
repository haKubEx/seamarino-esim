import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupplierPlan = {
  packageCode?: string;
  name?: string;
  slug?: string;
  price?: number;
  retailPrice?: number;
  currencyCode?: string;
  volume?: number;
  duration?: number;
  durationUnit?: string;
  location?: string;
  locationCode?: string;
  locationNetworkList?: Array<{
    locationName?: string;
    locationCode?: string;
  }>;
};

type UpdatePlanBody = {
  packageCode?: unknown;
  enabled?: unknown;
  featured?: unknown;
  markupPercent?: unknown;
  customName?: unknown;
};

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.ADMIN_API_KEY?.trim();

  const suppliedKey =
    request.headers.get("x-admin-key")?.trim();

  return Boolean(
    configuredKey &&
      suppliedKey &&
      configuredKey === suppliedKey,
  );
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BASE_URL
      ?.trim()
      .replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  const vercelUrl =
    process.env.VERCEL_URL
      ?.trim()
      .replace(/\/+$/, "");

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

function getSupplierCostUsd(plan: SupplierPlan) {
  const rawPrice = Number(plan.price);

  if (
    !Number.isFinite(rawPrice) ||
    rawPrice < 0
  ) {
    return 0;
  }

  /*
   * eSIM Access package prices use:
   * 10000 = $1.00 USD.
   */
  return (
    Math.round(
      (rawPrice / 10000) * 100,
    ) / 100
  );
}
function getLocationName(plan: SupplierPlan) {
  if (plan.location?.trim()) {
    return plan.location.trim();
  }

  const firstLocation =
    plan.locationNetworkList?.[0];

  if (firstLocation?.locationName?.trim()) {
    return firstLocation.locationName.trim();
  }

  if (plan.locationCode?.trim()) {
    return plan.locationCode.trim();
  }

  return "Unknown";
}

async function getSupplierPlans() {
  const response = await fetch(
    `${getBaseUrl()}/api/plans`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const responseText = await response.text();

  let data: unknown;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      "The plans API returned invalid JSON.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Plans API failed with HTTP ${response.status}.`,
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "The plans API returned an invalid plan list.",
    );
  }

  return data as SupplierPlan[];
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(request.url);

    const search =
      url.searchParams.get("search")?.trim().toLowerCase() ??
      "";

    const supplierPlans =
      await getSupplierPlans();

    const savedSettings =
      await prisma.planSetting.findMany();

    const settingMap = new Map(
      savedSettings.map((setting) => [
        setting.packageCode,
        setting,
      ]),
    );

    const plans = supplierPlans
      .filter((plan) => {
        const packageCode =
          plan.packageCode?.trim();

        if (!packageCode) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchableText = [
          packageCode,
          plan.name,
          plan.slug,
          plan.location,
          plan.locationCode,
          getLocationName(plan),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(search);
      })
      .map((plan) => {
        const packageCode =
          plan.packageCode as string;

        const setting =
          settingMap.get(packageCode);

        const supplierCostUsd =
          getSupplierCostUsd(plan);

        const markupPercent =
          setting?.markupPercent ?? 20;

        const sellingPriceUsd =
          supplierCostUsd *
          (1 + markupPercent / 100);

        return {
          packageCode,
          supplierName:
            plan.name ?? packageCode,
          displayName:
            setting?.customName?.trim() ||
            plan.name ||
            packageCode,

          slug: plan.slug ?? null,
          locationName:
            getLocationName(plan),
          locationCode:
            plan.locationCode ?? null,

          volume:
            plan.volume ?? null,
          duration:
            plan.duration ?? null,
          durationUnit:
            plan.durationUnit ?? null,

          currencyCode:
            plan.currencyCode ?? "USD",

          supplierPriceRaw:
            plan.price ?? 0,
          supplierCostUsd,
          sellingPriceUsd,

          enabled:
            setting?.enabled ?? true,
          featured:
            setting?.featured ?? false,
          markupPercent,
          customName:
            setting?.customName ?? null,

          updatedAt:
            setting?.updatedAt ?? null,
        };
      })
      .sort((a, b) =>
        a.displayName.localeCompare(
          b.displayName,
        ),
      );

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length,
    });
  } catch (error) {
    console.error(
      "ADMIN PLANS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve plans.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body =
      (await request.json()) as UpdatePlanBody;

    const packageCode =
      typeof body.packageCode === "string"
        ? body.packageCode.trim()
        : "";

    if (!packageCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Package code is required.",
        },
        {
          status: 400,
        },
      );
    }

    const markupPercent =
      Number(body.markupPercent);

    if (
      !Number.isFinite(markupPercent) ||
      markupPercent < 0 ||
      markupPercent > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Markup percentage must be between 0 and 1000.",
        },
        {
          status: 400,
        },
      );
    }

    const enabled =
      typeof body.enabled === "boolean"
        ? body.enabled
        : true;

    const featured =
      typeof body.featured === "boolean"
        ? body.featured
        : false;

    const customName =
      typeof body.customName === "string" &&
      body.customName.trim()
        ? body.customName.trim()
        : null;

    const setting =
      await prisma.planSetting.upsert({
        where: {
          packageCode,
        },
        update: {
          enabled,
          featured,
          markupPercent,
          customName,
        },
        create: {
          packageCode,
          enabled,
          featured,
          markupPercent,
          customName,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Plan settings updated successfully.",
      setting,
    });
  } catch (error) {
    console.error(
      "ADMIN PLANS UPDATE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update plan settings.",
      },
      {
        status: 500,
      },
    );
  }
}