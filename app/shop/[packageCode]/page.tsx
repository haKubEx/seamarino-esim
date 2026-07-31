import Link from "next/link";
import { notFound } from "next/navigation";

import { getCountryName } from "@/app/lib/countries";
import { getSellingPrice } from "@/app/lib/pricing";
import { getPlans } from "@/app/services/plans";
import type { EsimPackage } from "@/app/types/esim";

interface PlanDetailsPageProps {
  params: Promise<{
    packageCode: string;
  }>;
}

function formatData(bytes: number) {
  const gb = bytes / 1024 / 1024 / 1024;

  if (gb < 1) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb)} MB`;
  }

  return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
}

function formatDurationUnit(unit: string, duration: number) {
  const normalized = unit.trim().toLowerCase();

  if (!normalized) {
    return duration === 1 ? "day" : "days";
  }

  if (duration === 1) {
    return normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
  }

  return normalized.endsWith("s")
    ? normalized
    : `${normalized}s`;
}

function formatNetwork(speed?: string) {
  if (!speed?.trim()) {
    return "4G / LTE";
  }

  return speed.replaceAll(",", " / ");
}

function getRegionName(plan: EsimPackage, locationCount: number) {
  const searchableText = [
    plan.name,
    plan.description,
    plan.saleNote,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (searchableText.includes("global")) {
    return "Global eSIM";
  }

  if (searchableText.includes("europe")) {
    return "Europe eSIM";
  }

  if (searchableText.includes("asia")) {
    return "Asia eSIM";
  }

  if (searchableText.includes("africa")) {
    return "Africa eSIM";
  }

  if (
    searchableText.includes("middle east") ||
    searchableText.includes("mideast")
  ) {
    return "Middle East eSIM";
  }

  if (
    searchableText.includes("north america") ||
    searchableText.includes("usa canada")
  ) {
    return "North America eSIM";
  }

  if (
    searchableText.includes("south america") ||
    searchableText.includes("latin america")
  ) {
    return "South America eSIM";
  }

  return `${locationCount}-Country Regional eSIM`;
}

function DataIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M7 3h7l4 4v14H7V3Z"
        strokeLinejoin="round"
      />

      <path d="M14 3v5h5" strokeLinejoin="round" />

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
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />

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
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M5 18h2v2H5v-2Z" />
      <path d="M9 14h2v6H9v-6Z" />
      <path d="M13 10h2v10h-2V10Z" />
      <path d="M17 6h2v14h-2V6Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21M12 3C9.5 5.6 8.2 8.6 8.2 12S9.5 18.4 12 21"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function PlanDetailsPage({
  params,
}: PlanDetailsPageProps) {
  const { packageCode } = await params;
  const decodedPackageCode = decodeURIComponent(packageCode);

  const plans: EsimPackage[] = await getPlans();

  const plan = plans.find(
    (item) => item.packageCode === decodedPackageCode,
  );

  if (!plan) {
    notFound();
  }

  const locations = plan.location
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  const isRegion = locations.length > 1;
  const countryCode = locations[0] ?? "";

  const destinationName = isRegion
    ? getRegionName(plan, locations.length)
    : getCountryName(countryCode);

  const sellingPrice = getSellingPrice(
    plan.price,
    plan.volume,
  );

  const validity = `${plan.duration} ${formatDurationUnit(
    plan.durationUnit,
    plan.duration,
  )}`;

  const benefits = [
    "Digital eSIM delivered after successful payment",
    "No physical SIM card replacement required",
    "Secure online checkout",
    "Installation guidance available",
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0A2D62] shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span aria-hidden="true">←</span>
            Back to plans
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                {isRegion ? (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 text-5xl">
                    <span aria-hidden="true">🌍</span>
                  </div>
                ) : countryCode ? (
                  <img
                    src={`https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`}
                    alt={`${destinationName} flag`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl" aria-hidden="true">
                    🌐
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                  {isRegion
                    ? `${locations.length} countries included`
                    : "Local eSIM plan"}
                </p>

                <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {plan.name}
                </h1>

                <p className="mt-3 text-lg font-semibold text-slate-600">
                  {destinationName}
                </p>
              </div>
            </div>

            {plan.favorite && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">
                <span aria-hidden="true">★</span>
                Popular plan
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-16">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Plan overview
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Stay connected in {destinationName}
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              {plan.description ||
                `Use this ${destinationName} eSIM for reliable mobile data during your trip. Install it digitally on a compatible device without removing your physical SIM.`}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <DataIcon />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Mobile data
                </p>

                <p className="mt-1 text-xl font-black text-slate-950">
                  {formatData(plan.volume)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <CalendarIcon />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Validity
                </p>

                <p className="mt-1 text-xl font-black text-slate-950">
                  {validity}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <SignalIcon />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Network
                </p>

                <p className="mt-1 text-xl font-black text-slate-950">
                  {formatNetwork(plan.speed)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <GlobeIcon />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Coverage
                </p>

                <p className="mt-1 text-xl font-black text-slate-950">
                  {isRegion
                    ? `${locations.length} countries`
                    : destinationName}
                </p>
              </div>
            </div>
          </section>

          {plan.descriptionList?.length > 0 && (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                Included with this plan
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Plan information
              </h2>

              <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                {plan.descriptionList.map(
                  (description, index) => (
                    <li
                      key={`${description}-${index}`}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckIcon />
                      </span>

                      <span className="leading-7">
                        {description}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Why choose this plan
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Simple digital connectivity
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm">
                    <CheckIcon />
                  </span>

                  <p className="font-semibold leading-7 text-slate-700">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-6 text-white sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                Order summary
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {destinationName}
              </h2>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-blue-100">
                {plan.name}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">
                    Data
                  </span>

                  <strong className="text-slate-950">
                    {formatData(plan.volume)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">
                    Validity
                  </span>

                  <strong className="text-slate-950">
                    {validity}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">
                    Network
                  </span>

                  <strong className="text-right text-slate-950">
                    {formatNetwork(plan.speed)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">
                    Top-up
                  </span>

                  <strong className="text-slate-950">
                    {plan.supportTopUpType > 0
                      ? "Supported"
                      : "Not supported"}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">
                    Delivery
                  </span>

                  <strong className="text-emerald-700">
                    Digital eSIM
                  </strong>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Total price
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-[#0A2D62]">
                    ${sellingPrice}
                  </span>

                  <span className="pb-1 text-sm font-bold text-slate-500">
                    USD
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Final amount for this eSIM package.
                </p>
              </div>

              <Link
                href={`/checkout?packageCode=${encodeURIComponent(
                  plan.packageCode,
                )}`}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-6 py-4 font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Continue to Checkout
                <span aria-hidden="true">→</span>
              </Link>

              <div className="mt-5 space-y-2 text-center text-xs font-semibold text-slate-500">
                <p>🔒 Secure online checkout</p>
                <p>⚡ Digital delivery after payment</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}