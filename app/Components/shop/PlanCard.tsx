import Link from "next/link";

import { getCountryName } from "@/app/lib/countries";
import type { EsimPackage } from "@/app/types/esim";

type StorefrontPlan = EsimPackage & {
  displayName?: string;
  sellingPriceUsd?: number;
  sellingPricePhp?: number;
  amountPhpCentavos?: number;
  featured?: boolean;
  enabled?: boolean;
  isLocalPlan?: boolean;
  markupAmountUsd?: number;
  supplierCostUsd?: number;
  volumeGb?: number;
  volumeMb?: number;
};

function formatData(bytes: number) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "Data plan";
  }

  const megabytes =
    bytes / 1024 / 1024;

  const gigabytes =
    bytes / 1024 / 1024 / 1024;

  if (gigabytes < 1) {
    return `${Math.round(megabytes)} MB`;
  }

  return `${
    Number.isInteger(gigabytes)
      ? gigabytes
      : gigabytes.toFixed(1)
  } GB`;
}

function isDailyPlan(
  plan: StorefrontPlan,
) {
  return Number(plan.dataType) === 2;
}

function formatPlanData(
  plan: StorefrontPlan,
) {
  const data =
    formatData(plan.volume);

  return isDailyPlan(plan)
    ? `${data} / Day`
    : data;
}

function formatDurationUnit(
  unit: string | undefined,
  duration: number,
) {
  const normalized =
    unit?.trim().toLowerCase() ||
    "day";

  if (duration === 1) {
    return normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
  }

  return normalized.endsWith("s")
    ? normalized
    : `${normalized}s`;
}

function formatNetwork(
  speed?: string,
) {
  if (!speed?.trim()) {
    return "4G / LTE";
  }

  return speed.replaceAll(
    ",",
    " / ",
  );
}

function formatUsd(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatPhp(value: number) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function getLocationCodes(
  location: string | undefined,
) {
  if (!location?.trim()) {
    return [];
  }

  return location
    .split(",")
    .map((code) =>
      code.trim(),
    )
    .filter(Boolean);
}

function getRegionName(
  plan: StorefrontPlan,
  locationCount: number,
) {
  const combinedText = [
    plan.displayName,
    plan.name,
    plan.description,
    plan.saleNote,
    plan.location,
    plan.locationCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    combinedText.includes(
      "global",
    ) ||
    combinedText.includes(
      "worldwide",
    )
  ) {
    return "Global eSIM";
  }

  if (
    combinedText.includes(
      "europe",
    )
  ) {
    return "Europe eSIM";
  }

  if (
    combinedText.includes(
      "asia",
    )
  ) {
    return "Asia eSIM";
  }

  if (
    combinedText.includes(
      "africa",
    )
  ) {
    return "Africa eSIM";
  }

  if (
    combinedText.includes(
      "middle east",
    ) ||
    combinedText.includes(
      "mideast",
    )
  ) {
    return "Middle East eSIM";
  }

  if (
    combinedText.includes(
      "north america",
    ) ||
    combinedText.includes(
      "usa canada",
    )
  ) {
    return "North America eSIM";
  }

  if (
    combinedText.includes(
      "south america",
    ) ||
    combinedText.includes(
      "latin america",
    )
  ) {
    return "South America eSIM";
  }

  if (
    combinedText.includes(
      "caribbean",
    )
  ) {
    return "Caribbean eSIM";
  }

  if (
    combinedText.includes(
      "balkan",
    )
  ) {
    return "Balkans eSIM";
  }

  if (
    combinedText.includes(
      "combo",
    )
  ) {
    return (
      plan.displayName ||
      plan.name ||
      "Combo eSIM"
    );
  }

  return `${locationCount}-Country eSIM`;
}

function DataIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M7 3h7l4 4v14H7V3Z"
        strokeLinejoin="round"
      />

      <path
        d="M14 3v5h5"
        strokeLinejoin="round"
      />

      <path
        d="M10 12h4M10 15h4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />

      <path
        d="M8 3v4M16 3v4M3 10h18"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 18h2v2H5v-2Z" />
      <path d="M9 14h2v6H9v-6Z" />
      <path d="M13 10h2v10h-2V10Z" />
      <path d="M17 6h2v14h-2V6Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PlanCard({
  plan,
}: {
  plan: StorefrontPlan;
}) {
  const locations =
    getLocationCodes(
      plan.location,
    );

  const locationCount =
    locations.length;

  const isRegion =
    plan.isLocalPlan === false ||
    locationCount > 1;

  const countryCode =
    locations[0] ||
    plan.locationCode?.trim() ||
    "";

  const destinationName =
    isRegion
      ? getRegionName(
          plan,
          locationCount,
        )
      : getCountryName(
          countryCode,
        );

  const planName =
    plan.displayName?.trim() ||
    plan.name?.trim() ||
    `${destinationName} mobile data plan`;

  const rawDuration =
    Number(plan.duration);

  const duration =
    Number.isFinite(
      rawDuration,
    ) &&
    rawDuration > 0
      ? rawDuration
      : 1;

  const dailyPlan =
    isDailyPlan(plan);

  const formattedValidity =
    dailyPlan
      ? "1–30 Days"
      : `${duration} ${formatDurationUnit(
          plan.durationUnit,
          duration,
        )}`;

  const sellingPricePhp =
    Number(
      plan.sellingPricePhp,
    );

  const sellingPriceUsd =
    Number(
      plan.sellingPriceUsd,
    );

  const amountPhpCentavos =
    Number(
      plan.amountPhpCentavos,
    );

  const validPhpPrice =
    Number.isFinite(
      sellingPricePhp,
    ) &&
    sellingPricePhp > 0
      ? sellingPricePhp
      : Number.isFinite(
            amountPhpCentavos,
          ) &&
          amountPhpCentavos > 0
        ? amountPhpCentavos /
          100
        : 0;

  const validUsdPrice =
    Number.isFinite(
      sellingPriceUsd,
    ) &&
    sellingPriceUsd > 0
      ? sellingPriceUsd
      : 0;

  const isFeatured =
    plan.featured === true ||
    plan.favorite === true;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-950/10">
      <div
        className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-blue-50 transition duration-500 group-hover:scale-125 group-hover:bg-blue-100"
        aria-hidden="true"
      />

      {isFeatured && (
        <div className="absolute right-4 top-4 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800 shadow-sm">
            <span aria-hidden="true">
              ★
            </span>

            Featured
          </span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4 pr-20">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            {isRegion ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 text-3xl">
                <span aria-hidden="true">
                  🌍
                </span>
              </div>
            ) : countryCode ? (
              <img
                src={`https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`}
                alt={`${destinationName} flag`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span
                className="text-3xl"
                aria-hidden="true"
              >
                🌐
              </span>
            )}
          </div>

          <div className="min-w-0 pt-1">
            <p className="text-xs font-black uppercase tracking-[0.17em] text-blue-600">
              {isRegion
                ? locationCount > 1
                  ? `${locationCount} countries`
                  : "Regional eSIM"
                : "Local eSIM"}
            </p>

            <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-slate-950">
              {destinationName}
            </h2>
          </div>
        </div>

        <div className="mt-5 min-h-[52px]">
          <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-600">
            {planName}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center transition group-hover:bg-blue-50/60">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
              <DataIcon />
            </div>

            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Data
            </p>

            <p className="mt-1 truncate text-sm font-black text-slate-950">
              {formatPlanData(
                plan,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center transition group-hover:bg-blue-50/60">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
              <CalendarIcon />
            </div>

            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Validity
            </p>

            <p className="mt-1 truncate text-sm font-black text-slate-950">
              {formattedValidity}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center transition group-hover:bg-blue-50/60">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
              <SignalIcon />
            </div>

            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Network
            </p>

            <p
              className="mt-1 truncate text-sm font-black text-slate-950"
              title={formatNetwork(
                plan.speed,
              )}
            >
              {formatNetwork(
                plan.speed,
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Instant delivery
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            Digital eSIM
          </span>

          {!isRegion && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
              Local plan
            </span>
          )}

          {dailyPlan && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              Daily plan · choose 1–30 days
            </span>
          )}
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dailyPlan
                  ? "From / 1 Day"
                  : "Price"}
              </p>

              {validPhpPrice > 0 ? (
                <>
                  <div className="mt-1">
                    <span className="text-3xl font-black tracking-tight text-[#0A2D62]">
                      {formatPhp(
                        validPhpPrice,
                      )}
                    </span>
                  </div>

                  {validUsdPrice > 0 && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      About{" "}
                      {formatUsd(
                        validUsdPrice,
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-lg font-black text-slate-700">
                  Price unavailable
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">
                No physical SIM
              </p>

              <p className="mt-1 text-xs font-bold text-slate-600">
                Online activation
              </p>
            </div>
          </div>

          <Link
            href={`/shop/${encodeURIComponent(
              plan.packageCode,
            )}`}
            aria-label={`View ${destinationName} eSIM plan`}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition duration-300 hover:from-blue-800 hover:to-blue-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            View Plan
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}