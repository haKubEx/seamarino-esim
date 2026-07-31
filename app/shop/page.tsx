import ShopPlans from "../Components/shop/ShopPlans";

const benefits = [
  {
    title: "Instant delivery",
    description: "Receive your eSIM details after successful payment.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Worldwide plans",
    description: "Browse local, regional, and global data packages.",
    icon: (
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
          d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21M12 3C9.5 5.7 8.2 8.7 8.2 12S9.5 18.3 12 21"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Keep your SIM",
    description: "Use mobile data without replacing your physical SIM.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <rect x="7" y="2" width="10" height="20" rx="2" />

        <path d="M10 18h4" strokeLinecap="round" />

        <path
          d="m9.5 11 1.5 1.5 3.5-4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-sky-100/80 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-bold text-blue-700">
              <span
                className="h-2 w-2 rounded-full bg-blue-600"
                aria-hidden="true"
              />
              Global eSIM Plans
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Find the right data plan for your next journey.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Compare affordable eSIM packages for countries and regions
              worldwide. Purchase online, install digitally, and stay connected
              without changing your physical SIM.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#browse-plans"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0A2D62] px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Browse Plans
              </a>

              <a
                href="/faq"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
              >
                How eSIM Works
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-7">
              <div className="rounded-[1.6rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-6 text-white sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">
                      Seamarino eSIM
                    </p>

                    <h2 className="mt-3 text-3xl font-black">
                      Travel connected.
                    </h2>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-9 w-9"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 3h7l4 4v14H7V3Z"
                        strokeLinejoin="round"
                      />

                      <path d="M14 3v5h5" strokeLinejoin="round" />

                      <path
                        d="M9.5 12h5M9.5 15h5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit.title}
                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/10 p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0A2D62]">
                        {benefit.icon}
                      </div>

                      <div>
                        <h3 className="font-black text-white">
                          {benefit.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-blue-100">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl lg:block"
              aria-hidden="true"
            >
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                Coverage
              </p>

              <p className="mt-1 text-lg font-black text-[#0A2D62]">
                Countries & Regions
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="browse-plans" className="scroll-mt-24">
        <ShopPlans />
      </section>
    </main>
  );
}