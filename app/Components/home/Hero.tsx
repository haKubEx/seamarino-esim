"use client";

import Link from "next/link";
import { useState } from "react";

const benefits = [
  {
    title: "Instant Activation",
    description: "Receive your eSIM details digitally",
    icon: "⚡",
  },
  {
    title: "Global Coverage",
    description: "Plans for worldwide destinations",
    icon: "🌍",
  },
  {
    title: "Easy Installation",
    description: "Follow the included setup guide",
    icon: "📱",
  },
];

const trustItems = [
  {
    title: "Secure Payment",
    description: "Protected online checkout",
    icon: "🔒",
  },
  {
    title: "Customer Support",
    description: "Help when you need it",
    icon: "🎧",
  },
  {
    title: "Easy Setup",
    description: "Digital installation guide",
    icon: "📱",
  },
  {
    title: "Refund Policy",
    description: "For eligible purchases",
    icon: "↻",
  },
];

export default function Hero() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <div
        className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:min-h-[680px] lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-sm font-bold text-[#0A2D62] shadow-sm">
            <span aria-hidden="true">🌍</span>
            Trusted by Travelers and Filipino Seafarers
          </div>

          <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-[#0A2D62] sm:text-6xl lg:text-[64px]">
            Stay Connected
            <span className="mt-1 block text-sky-500">
              Without Limits
            </span>
          </h1>

          <div className="mt-6 h-1.5 w-28 rounded-full bg-amber-400" />

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            Affordable eSIM data plans for seafarers, travelers,
            OFWs, and digital nomads. Prepare your mobile data before
            arriving at your next destination.
          </p>

          <form
            action="/shop"
            method="GET"
            className="mt-8 flex max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
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

              <label htmlFor="hero-destination" className="sr-only">
                Search destination
              </label>

              <input
                id="hero-destination"
                name="search"
                type="search"
                placeholder="Where do you need internet?"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              aria-label="Search eSIM plans"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />

                <path
                  d="m20 20-4-4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A2D62] px-7 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#071f45]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M6 8h12l1 13H5L6 8Z"
                  strokeLinejoin="round"
                />

                <path
                  d="M9 8V6a3 3 0 0 1 6 0v2"
                  strokeLinecap="round"
                />
              </svg>

              Shop eSIM Plans
            </Link>

            <Link
              href="/coverage"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#0A2D62] bg-white/70 px-7 py-4 text-base font-bold text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />

                <path
                  d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3C9.6 5.5 8.4 8.5 8.4 12S9.6 18.5 12 21"
                  strokeLinecap="round"
                />
              </svg>

              View Coverage
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  {benefit.icon}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#0A2D62]">
                    {benefit.title}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {benefit.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-3xl lg:max-w-none">
          <div
            className="absolute inset-x-12 bottom-4 h-24 rounded-full bg-blue-950/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl">
            {!imageFailed ? (
              <img
                src="/images/hero-illustration.png"
                alt="Seamarino eSIM global connectivity illustration"
                width={900}
                height={760}
                onError={() => setImageFailed(true)}
                className="h-auto w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center bg-gradient-to-br from-[#0A2D62] to-sky-600 px-8 text-center text-white">
                <div className="text-7xl" aria-hidden="true">
                  🌍
                </div>

                <h2 className="mt-5 text-3xl font-black">
                  Hero image not found
                </h2>

                <p className="mt-3 max-w-md text-blue-100">
                  Save the image as
                  public/images/hero-illustration.png
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TrustBar />
    </section>
  );
}

function TrustBar() {
  return (
    <div className="relative z-20 border-y border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {trustItems.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-4 rounded-2xl px-3 py-2"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
              {item.icon}
            </div>

            <div>
              <p className="font-bold text-[#0A2D62]">
                {item.title}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}