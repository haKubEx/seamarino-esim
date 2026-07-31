"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const popularSearches = [
  "Japan",
  "Singapore",
  "South Korea",
  "Thailand",
  "Malaysia",
  "USA",
  "Europe",
  "Global",
];

export default function SearchPlans() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      router.push("/shop");
      return;
    }

    router.push(`/shop?search=${encodeURIComponent(query)}`);
  }

  function selectPopularSearch(destination: string) {
    setSearchTerm(destination);
    router.push(`/shop?search=${encodeURIComponent(destination)}`);
  }

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-white py-16 sm:py-20">
      <div
        className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-bold text-[#0A2D62]">
            <span aria-hidden="true">🔎</span>
            Search eSIM Plans
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0A2D62] sm:text-5xl">
            Find Your Destination
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Search for a country, region, or global package and find
            the right eSIM plan for your next journey.
          </p>
        </div>

        <form
          onSubmit={submitSearch}
          className="mx-auto mt-10 flex max-w-4xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl sm:flex-row"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 shrink-0 text-[#0A2D62]"
              aria-hidden="true"
            >
              <path
                d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                strokeLinejoin="round"
              />

              <circle cx="12" cy="10" r="2.5" />
            </svg>

            <label htmlFor="destination-search" className="sr-only">
              Search destination
            </label>

            <input
              id="destination-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search country, region, or global plan..."
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-5 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0A2D62] px-8 py-4 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#071f45] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" strokeLinecap="round" />
            </svg>

            Search Plans
          </button>
        </form>

        <div className="mt-7">
          <p className="text-center text-sm font-semibold text-slate-500">
            Popular searches
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {popularSearches.map((destination) => (
              <button
                key={destination}
                type="button"
                onClick={() => selectPopularSearch(destination)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#0A2D62]"
              >
                {destination}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}