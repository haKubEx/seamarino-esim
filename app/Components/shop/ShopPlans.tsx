"use client";

import { useEffect, useMemo, useState } from "react";

import PlanCard from "./PlanCard";

import type { EsimPackage } from "@/app/types/esim";

type SortOption =
  | "recommended"
  | "price-low"
  | "price-high"
  | "data-high"
  | "validity-high";

const PLANS_PER_PAGE = 24;

const quickDestinations = [
  "Global",
  "Asia",
  "Europe",
  "Japan",
  "Singapore",
  "United States",
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />

      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 7h10M4 12h7M4 17h4" strokeLinecap="round" />

      <path
        d="m16 15 3 3 3-3M19 18V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function ShopPlans() {
  const [plans, setPlans] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(PLANS_PER_PAGE);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/plans", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load plans. Server responded with ${response.status}.`,
          );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The plans API returned invalid data.");
        }

        setPlans(data as EsimPackage[]);
      } catch (caughtError) {
        console.error("SHOP PLANS ERROR:", caughtError);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load eSIM plans.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  useEffect(() => {
    setVisibleCount(PLANS_PER_PAGE);
  }, [searchTerm, sortBy]);

  const filteredPlans = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return plans;
    }

    return plans.filter((plan) => {
      const searchableText = [
        plan.name,
        plan.location,
        plan.locationCode,
        plan.description,
        plan.saleNote,
        plan.speed,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [plans, searchTerm]);

  const sortedPlans = useMemo(() => {
    const sorted = [...filteredPlans];

    switch (sortBy) {
      case "price-low":
        return sorted.sort(
          (firstPlan, secondPlan) =>
            firstPlan.price - secondPlan.price,
        );

      case "price-high":
        return sorted.sort(
          (firstPlan, secondPlan) =>
            secondPlan.price - firstPlan.price,
        );

      case "data-high":
        return sorted.sort(
          (firstPlan, secondPlan) =>
            secondPlan.volume - firstPlan.volume,
        );

      case "validity-high":
        return sorted.sort(
          (firstPlan, secondPlan) =>
            secondPlan.duration - firstPlan.duration,
        );

      default:
        return sorted;
    }
  }, [filteredPlans, sortBy]);

  const visiblePlans = sortedPlans.slice(0, visibleCount);
  const hasMorePlans = visiblePlans.length < sortedPlans.length;

  function clearFilters() {
    setSearchTerm("");
    setSortBy("recommended");
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />

          <div className="mt-4 h-16 animate-pulse rounded-2xl bg-slate-100" />

          <div className="mt-5 flex gap-3">
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>

        <div className="mt-12">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-10 w-72 max-w-full animate-pulse rounded bg-slate-200" />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="h-14 w-14 rounded-2xl bg-slate-200" />

              <div className="mt-6 h-5 w-2/3 rounded bg-slate-200" />

              <div className="mt-3 h-4 w-full rounded bg-slate-100" />

              <div className="mt-8 grid grid-cols-3 gap-2">
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
              </div>

              <div className="mt-8 h-10 w-1/2 rounded bg-slate-200" />

              <div className="mt-6 h-12 rounded-2xl bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
            !
          </div>

          <h2 className="mt-6 text-2xl font-black text-red-950">
            Plans could not be loaded
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 rounded-2xl bg-red-700 px-7 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-800"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7 lg:p-8">
        <div
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                Search destinations
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Where do you need mobile data?
              </h2>
            </div>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {plans.length.toLocaleString()} plans available
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <label
                htmlFor="plan-search"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Country or region
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
                  <SearchIcon />
                </div>

                <input
                  id="plan-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search Japan, Europe, Global..."
                  autoComplete="off"
                  className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-14 pr-14 text-base font-semibold text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-0 flex items-center px-5 text-slate-500 transition hover:text-slate-950"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <ClearIcon />
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="plan-sort"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
              >
                <SortIcon />
                Sort plans
              </label>

              <div className="relative">
                <select
                  id="plan-sort"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className="h-16 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 pr-12 text-base font-bold text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="data-high">Data: Highest First</option>
                  <option value="validity-high">
                    Validity: Longest First
                  </option>
                </select>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600"
                  aria-hidden="true"
                >
                  <path
                    d="m7 10 5 5 5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-slate-700">
              Popular destinations
            </p>

            <div className="flex flex-wrap gap-2.5">
              {quickDestinations.map((destination) => {
                const isActive =
                  searchTerm.toLowerCase() === destination.toLowerCase();

                return (
                  <button
                    key={destination}
                    type="button"
                    onClick={() =>
                      setSearchTerm(isActive ? "" : destination)
                    }
                    className={`rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                      isActive
                        ? "border-[#0A2D62] bg-[#0A2D62] text-white shadow-md"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {destination}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Available packages
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Choose your eSIM plan
          </h2>

          {searchTerm && (
            <p className="mt-3 text-slate-600">
              Results matching{" "}
              <span className="font-bold text-slate-900">
                “{searchTerm}”
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
            Showing{" "}
            <span className="font-black text-slate-950">
              {visiblePlans.length}
            </span>{" "}
            of{" "}
            <span className="font-black text-slate-950">
              {sortedPlans.length}
            </span>
          </p>

          {(searchTerm || sortBy !== "recommended") && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {visiblePlans.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-9 w-9"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />

              <path d="m20 20-3.5-3.5" strokeLinecap="round" />

              <path d="M8.5 11h5" strokeLinecap="round" />
            </svg>
          </div>

          <h3 className="mt-6 text-2xl font-black text-slate-950">
            No plans found
          </h3>

          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
            We could not find a plan matching your search. Try another
            country, region, or destination name.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-7 rounded-2xl bg-[#0A2D62] px-7 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            View All Plans
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.packageCode}
                plan={plan}
              />
            ))}
          </div>

          {hasMorePlans && (
            <div className="mt-14 flex flex-col items-center">
              <p className="mb-4 text-sm text-slate-500">
                You have viewed {visiblePlans.length} of{" "}
                {sortedPlans.length} plans
              </p>

              <button
                type="button"
                onClick={() =>
                  setVisibleCount(
                    (currentCount) =>
                      currentCount + PLANS_PER_PAGE,
                  )
                }
                className="inline-flex items-center gap-3 rounded-2xl border-2 border-[#0A2D62] bg-white px-8 py-4 font-black text-[#0A2D62] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0A2D62] hover:text-white hover:shadow-lg"
              >
                Load More Plans

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="m7 10 5 5 5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}