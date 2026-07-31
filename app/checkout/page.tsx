import Link from "next/link";
import { redirect } from "next/navigation";

import { getCountryName } from "@/app/lib/countries";
import { getSellingPrice } from "@/app/lib/pricing";
import { getPlans } from "@/app/services/plans";
import type { EsimPackage } from "@/app/types/esim";

interface CheckoutPageProps {
  searchParams: Promise<{
    packageCode?: string;
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

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />

      <path
        d="M4 21a8 8 0 0 1 16 0"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />

      <path
        d="m4 7 8 6 8-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
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
        d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2L21 14v3a4 4 0 0 1-4 4C9.3 21 3 14.7 3 7a4 4 0 0 1 4-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      className="h-4 w-4"
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

function LockIcon() {
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
        d="M7 10V7a5 5 0 0 1 10 0v3"
        strokeLinecap="round"
      />

      <rect x="4" y="10" width="16" height="11" rx="2" />

      <path d="M12 14v3" strokeLinecap="round" />
    </svg>
  );
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { packageCode } = await searchParams;

  if (!packageCode) {
    redirect("/shop");
  }

  const plans: EsimPackage[] = await getPlans();
  const decodedPackageCode = decodeURIComponent(packageCode);

  const plan = plans.find(
    (item) => item.packageCode === decodedPackageCode,
  );

  if (!plan) {
    redirect("/shop");
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

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/shop/${encodeURIComponent(plan.packageCode)}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0A2D62] shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span aria-hidden="true">←</span>
            Back to plan
          </Link>

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                <LockIcon />
                Secure checkout
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Complete your eSIM order
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Enter your contact information carefully. Your order
                confirmation and eSIM details will be sent to the email
                address you provide.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                Secure payment
              </span>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                Digital delivery
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-1">
            <div className="flex min-w-fit items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A2D62] text-sm font-black text-white">
                1
              </span>

              <span className="font-bold text-slate-950">
                Customer details
              </span>
            </div>

            <div className="h-px min-w-10 flex-1 bg-slate-300" />

            <div className="flex min-w-fit items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-600">
                2
              </span>

              <span className="font-semibold text-slate-500">
                Payment
              </span>
            </div>

            <div className="h-px min-w-10 flex-1 bg-slate-300" />

            <div className="flex min-w-fit items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-600">
                3
              </span>

              <span className="font-semibold text-slate-500">
                eSIM delivery
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-16">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="border-b border-slate-100 pb-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Customer information
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Where should we send your eSIM?
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Make sure your email address is correct before continuing
              to payment.
            </p>
          </div>

          <form
            action="/api/checkout"
            method="POST"
            className="mt-8 space-y-6"
          >
            <input
              type="hidden"
              name="packageCode"
              value={plan.packageCode}
            />

            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Full name
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                  <UserIcon />
                </div>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-14 pr-5 text-base font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Email address
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                  <EmailIcon />
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="juan@example.com"
                  className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-14 pr-5 text-base font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your receipt and eSIM installation details will be sent
                here.
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Phone number
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                  <PhoneIcon />
                </div>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+63 912 345 6789"
                  className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-14 pr-5 text-base font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 transition hover:border-blue-200">
              <input
                type="checkbox"
                name="acceptedTerms"
                required
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#0A2D62]"
              />

              <span className="text-sm leading-7 text-slate-700">
                I confirm that my device supports eSIM and agree to the{" "}
                <Link
                  href="/terms"
                  className="font-bold text-[#0A2D62] underline-offset-4 hover:underline"
                >
                  terms and conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/refund-policy"
                  className="font-bold text-[#0A2D62] underline-offset-4 hover:underline"
                >
                  refund policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Proceed to Secure Payment

              <span aria-hidden="true">→</span>
            </button>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckIcon />
                </span>
                Secure checkout
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckIcon />
                </span>
                Instant processing
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckIcon />
                </span>
                Email delivery
              </div>
            </div>
          </form>
        </section>

        <aside className="h-fit lg:sticky lg:top-28">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-6 text-white sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                Order summary
              </p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm">
                  {isRegion ? (
                    <span className="text-4xl" aria-hidden="true">
                      🌍
                    </span>
                  ) : countryCode ? (
                    <img
                      src={`https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`}
                      alt={`${destinationName} flag`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl" aria-hidden="true">
                      🌐
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sky-200">
                    {destinationName}
                  </p>

                  <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-white">
                    {plan.name}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">Data</span>

                  <strong className="text-slate-950">
                    {formatData(plan.volume)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">Validity</span>

                  <strong className="text-slate-950">
                    {validity}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">Network</span>

                  <strong className="max-w-[180px] text-right text-slate-950">
                    {formatNetwork(plan.speed)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <span className="text-slate-600">Top-up</span>

                  <strong className="text-slate-950">
                    {plan.supportTopUpType > 0
                      ? "Supported"
                      : "Not supported"}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">Delivery</span>

                  <strong className="text-emerald-700">
                    Digital eSIM
                  </strong>
                </div>
              </div>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-bold text-slate-700">
                    Total
                  </span>

                  <div className="text-right">
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-black tracking-tight text-[#0A2D62]">
                        ${sellingPrice}
                      </span>

                      <span className="pb-1 text-xs font-bold text-slate-500">
                        USD
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Final price for this eSIM package.
                </p>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <LockIcon />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Secure payment
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Your payment will be processed securely through
                    PayMongo.
                  </p>
                </div>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                You will be redirected to the payment page after submitting
                your information.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}