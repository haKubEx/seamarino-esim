import Link from "next/link";

const coverageStats = [
  {
    value: "200+",
    label: "Destinations",
    description: "Countries and regions worldwide",
  },
  {
    value: "4G / 5G",
    label: "Network Access",
    description: "Depending on plan and local operator",
  },
  {
    value: "24/7",
    label: "Digital Access",
    description: "Purchase plans whenever you need them",
  },
  {
    value: "1",
    label: "Digital eSIM",
    description: "No physical SIM replacement required",
  },
];

const regions = [
  {
    name: "Asia",
    code: "AS",
    description:
      "Explore local and regional packages for Japan, Singapore, Thailand, Malaysia, South Korea, and more.",
    search: "Asia",
    gradient: "from-cyan-400 via-sky-500 to-blue-700",
    countries: ["Japan", "Singapore", "Thailand", "South Korea"],
  },
  {
    name: "Europe",
    code: "EU",
    description:
      "Travel across popular European destinations using regional or country-specific eSIM packages.",
    search: "Europe",
    gradient: "from-blue-500 via-indigo-600 to-violet-700",
    countries: ["France", "Italy", "Spain", "Germany"],
  },
  {
    name: "North America",
    code: "NA",
    description:
      "Browse mobile data plans for the United States, Canada, Mexico, and supported regional destinations.",
    search: "North America",
    gradient: "from-indigo-500 via-blue-600 to-sky-600",
    countries: ["United States", "Canada", "Mexico"],
  },
  {
    name: "South America",
    code: "SA",
    description:
      "Stay connected across supported countries in South America with local and regional packages.",
    search: "South America",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    countries: ["Brazil", "Argentina", "Chile", "Peru"],
  },
  {
    name: "Middle East",
    code: "ME",
    description:
      "Find coverage for major ports, airports, business centers, and travel destinations across the region.",
    search: "Middle East",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    countries: ["UAE", "Saudi Arabia", "Qatar", "Israel"],
  },
  {
    name: "Africa",
    code: "AF",
    description:
      "Choose from supported country and regional packages across major destinations in Africa.",
    search: "Africa",
    gradient: "from-orange-400 via-amber-500 to-yellow-500",
    countries: ["South Africa", "Egypt", "Morocco", "Kenya"],
  },
];

const popularDestinations = [
  {
    name: "Japan",
    code: "jp",
    search: "Japan",
    label: "Fast local coverage",
  },
  {
    name: "Singapore",
    code: "sg",
    search: "Singapore",
    label: "Reliable high-speed data",
  },
  {
    name: "United States",
    code: "us",
    search: "USA",
    label: "Nationwide travel options",
  },
  {
    name: "Thailand",
    code: "th",
    search: "Thailand",
    label: "Popular tourist destination",
  },
  {
    name: "South Korea",
    code: "kr",
    search: "South Korea",
    label: "Modern mobile networks",
  },
  {
    name: "Malaysia",
    code: "my",
    search: "Malaysia",
    label: "Affordable local packages",
  },
  {
    name: "Spain",
    code: "es",
    search: "Spain",
    label: "European local plans",
  },
  {
    name: "Brazil",
    code: "br",
    search: "Brazil",
    label: "South American coverage",
  },
];

const coverageBenefits = [
  {
    title: "Local Network Partners",
    description:
      "Plans connect through supported mobile operators available in each destination.",
    icon: TowerIcon,
  },
  {
    title: "Country and Regional Plans",
    description:
      "Choose a dedicated country package or one plan covering multiple destinations.",
    icon: MapIcon,
  },
  {
    title: "Designed for Travel",
    description:
      "Prepare your mobile data before arriving at your next port, airport, or city.",
    icon: PlaneIcon,
  },
  {
    title: "Made for Seafarers",
    description:
      "Compare plans for shore leave, port visits, deployments, and international routes.",
    icon: AnchorIcon,
  },
  {
    title: "Keep Your Main SIM",
    description:
      "Continue using your physical SIM while your eSIM handles mobile data.",
    icon: SimIcon,
  },
  {
    title: "Digital Installation",
    description:
      "Install your eSIM using the provided setup information on a compatible device.",
    icon: PhoneIcon,
  },
];

const coverageNotes = [
  {
    title: "Network speed varies",
    description:
      "Available 3G, 4G, LTE, or 5G access depends on the plan, device, local operator, and location.",
  },
  {
    title: "Coverage is plan-specific",
    description:
      "Always open the individual plan details to confirm the supported countries and networks.",
  },
  {
    title: "Device compatibility is required",
    description:
      "Your phone must support eSIM and may need to be carrier-unlocked before installation.",
  },
];

export default function CoveragePage() {
  return (
    <main className="overflow-hidden bg-slate-50">
      <CoverageHero />

      <CoverageStats />

      <RegionsSection />

      <PopularDestinationsSection />

      <BenefitsSection />

      <SeafarerSection />

      <CoverageInformation />

      <FinalCallToAction />
    </main>
  );
}

function CoverageHero() {
  return (
    <section className="relative overflow-hidden bg-[#061936] text-white">
      <div
        className="absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full bg-blue-500/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <svg
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <pattern
              id="coverage-grid"
              width="65"
              height="65"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M65 0H0V65"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="url(#coverage-grid)"
          />

          <path
            d="M-50 570C240 380 470 700 760 500C1020 320 1220 450 1500 235"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="10 12"
          />

          <path
            d="M-80 690C260 530 500 745 820 590C1090 460 1280 520 1510 410"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="8 14"
          />
        </svg>
      </div>

      <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-black text-sky-200 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Seamarino Global Coverage
          </span>

          <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Connected across
            <span className="block bg-gradient-to-r from-sky-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              the world.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
            Search local, regional, and global eSIM coverage for your
            destination, international route, shore leave, or next journey.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Search Coverage
              <ArrowIcon />
            </Link>

            <Link
              href="/global-plans"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              View Global Plans
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {[
              "Local plans",
              "Regional coverage",
              "Global packages",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-xs text-[#061936]">
                  ✓
                </span>

                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div
            className="absolute inset-x-16 bottom-8 h-28 rounded-full bg-sky-400/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative aspect-square">
            <div className="absolute inset-[6%] rounded-full border border-sky-300/15" />
            <div className="absolute inset-[15%] rounded-full border border-sky-300/20" />
            <div className="absolute inset-[24%] rounded-full border border-sky-300/20" />

            <div className="absolute inset-[13%] overflow-hidden rounded-full bg-gradient-to-br from-sky-300 via-blue-500 to-[#071f45] shadow-2xl shadow-blue-950">
              <svg
                viewBox="0 0 500 500"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="coverage-ocean">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="55%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#061936" />
                  </radialGradient>
                </defs>

                <circle
                  cx="250"
                  cy="250"
                  r="250"
                  fill="url(#coverage-ocean)"
                />

                <path
                  d="M104 142c37-48 103-66 148-37 22 14 25 43 45 55 23 14 60-6 79 17 19 24-3 62-26 76-30 18-70 9-96 30-28 22-29 68-63 84-32 15-73-5-77-40-3-27 24-48 25-75 2-30-58-65-35-110Z"
                  fill="#dbeafe"
                  opacity="0.92"
                />

                <path
                  d="M290 285c25-28 69-37 99-14 30 24 15 68-6 91-24 27-66 32-93 9-29-24-27-61 0-86Z"
                  fill="#bfdbfe"
                  opacity="0.9"
                />

                {[
                  [97, 191],
                  [184, 105],
                  [327, 147],
                  [391, 253],
                  [290, 355],
                  [151, 337],
                  [250, 223],
                ].map(([x, y]) => (
                  <g key={`${x}-${y}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="#fbbf24"
                    />

                    <circle
                      cx={x}
                      cy={y}
                      r="22"
                      fill="none"
                      stroke="#fbbf24"
                      opacity="0.45"
                    />
                  </g>
                ))}

                <path
                  d="M97 191C164 112 246 110 327 147M184 105C283 137 342 190 391 253M151 337C209 290 257 286 290 355M97 191C90 265 116 309 151 337M250 223C284 189 309 171 327 147M250 223C296 250 348 258 391 253"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="8 10"
                  opacity="0.7"
                />
              </svg>
            </div>

            <div className="absolute bottom-[6%] right-[4%] w-[41%] rotate-3 rounded-[2rem] border border-white/20 bg-[#071f45] p-4 shadow-2xl">
              <div className="rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-blue-800 to-[#061936] p-5 text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                  Network
                </p>

                <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-sky-300/30 bg-sky-400/10 text-sky-300">
                  <SignalIcon />
                </div>

                <p className="mt-6 text-xl font-black text-white">
                  Global Coverage
                </p>

                <p className="mt-2 text-sm text-blue-200">
                  Local network access
                </p>
              </div>
            </div>

            <div className="absolute left-[5%] top-[15%] flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur">
              <AnchorIcon />
            </div>

            <div className="absolute right-[10%] top-[10%] flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-xl shadow-xl">
              ✈
            </div>

            <div className="absolute bottom-[15%] left-[4%] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sky-200 backdrop-blur">
              <MapIcon />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverageStats() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-0 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {coverageStats.map((stat, index) => (
          <article
            key={stat.label}
            className={`px-6 py-7 text-center ${
              index > 0
                ? "border-t border-slate-200 sm:border-l sm:border-t-0"
                : ""
            }`}
          >
            <p className="text-4xl font-black text-[#0A2D62]">
              {stat.value}
            </p>

            <h2 className="mt-2 font-black text-slate-900">
              {stat.label}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {stat.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RegionsSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Regional coverage"
          title="Explore coverage by region"
          description="Choose a region to view local and multi-country eSIM packages available for your journey."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <Link
              key={region.name}
              href={`/shop?search=${encodeURIComponent(region.search)}`}
              className="group relative min-h-[360px] overflow-hidden rounded-[2rem] border border-slate-200 bg-[#071f45] p-7 text-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${region.gradient} opacity-90 transition duration-500 group-hover:scale-110`}
              />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_42%)]" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-black backdrop-blur">
                    {region.code}
                  </div>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide backdrop-blur">
                    Regional plan
                  </span>
                </div>

                <h2 className="mt-8 text-3xl font-black">
                  {region.name}
                </h2>

                <p className="mt-3 leading-7 text-white/85">
                  {region.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {region.countries.map((country) => (
                    <span
                      key={country}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90"
                    >
                      {country}
                    </span>
                  ))}
                </div>

                <span className="mt-auto inline-flex items-center gap-2 pt-8 font-black">
                  View Coverage
                  <ArrowIcon />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularDestinationsSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular destinations"
          title="Find local coverage fast"
          description="Browse frequently searched destinations and open matching eSIM plans."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularDestinations.map((destination) => (
            <Link
              key={destination.name}
              href={`/shop?search=${encodeURIComponent(
                destination.search,
              )}`}
              className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                <img
                  src={`https://flagcdn.com/w160/${destination.code}.png`}
                  alt={`${destination.name} flag`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-[#0A2D62]">
                  {destination.name}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {destination.label}
                </p>

                <span className="mt-2 inline-flex items-center gap-1 text-sm font-black text-blue-700">
                  View plans
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#0A2D62] bg-white px-7 py-4 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
          >
            Browse All Destinations
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-[#071f45] py-20 text-white sm:py-24">
      <div
        className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          light
          eyebrow="Coverage advantages"
          title="Built for international movement"
          description="Seamarino helps travelers and seafarers prepare mobile data before reaching their destination."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coverageBenefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.title}
                className="group rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-sky-300/40 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
                    <Icon />
                  </div>

                  <span className="text-5xl font-black text-white/5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h2 className="mt-7 text-2xl font-black">
                  {benefit.title}
                </h2>

                <p className="mt-4 leading-7 text-blue-100">
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SeafarerSection() {
  return (
    <section className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
            <AnchorIcon />
            Coverage for Seafarers
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Prepare your connection before your next port.
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Search plans for shore leave, crew changes, stopovers,
            international deployments, and destinations along your route.
          </p>

          <div className="mt-8 space-y-4">
            {[
              "Compare local and regional coverage",
              "Keep your physical SIM active",
              "Install before leaving the vessel",
              "Contact support when assistance is needed",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                  ✓
                </span>

                <p className="font-bold text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0A2D62] px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            Search eSIM Plans
            <ArrowIcon />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="rounded-[2.5rem] bg-[#071f45] p-6 shadow-2xl">
            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-800 via-[#0A2D62] to-[#061936] p-7">
              <div
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                      Seamarino
                    </p>

                    <h3 className="mt-2 text-3xl font-black text-white">
                      Port Connectivity
                    </h3>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                    <AnchorIcon />
                  </div>
                </div>

                <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                      <SignalIcon />
                    </div>

                    <div>
                      <p className="font-black text-white">
                        Ready to connect
                      </p>

                      <p className="mt-1 text-sm text-blue-200">
                        Activate according to your plan instructions
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Plan Type", "Local / Regional"],
                      ["Delivery", "Digital eSIM"],
                      ["Installation", "Compatible phone"],
                      ["Usage", "Mobile data"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="text-xs font-black uppercase tracking-wide text-sky-300">
                          {label}
                        </p>

                        <p className="mt-2 font-black text-white">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-4 text-blue-200">
                  <span>⚓</span>
                  <div className="h-px flex-1 bg-white/15" />
                  <span>🌍</span>
                  <div className="h-px flex-1 bg-white/15" />
                  <span>📱</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverageInformation() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Before purchasing"
          title="Important coverage information"
          description="Review these details before choosing and activating your eSIM package."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {coverageNotes.map((note, index) => (
            <article
              key={note.title}
              className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-black text-blue-700">
                {index + 1}
              </span>

              <h2 className="mt-6 text-2xl font-black text-slate-950">
                {note.title}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {note.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
              <InformationIcon />
            </div>

            <div>
              <h2 className="text-xl font-black text-amber-950">
                Always check the individual plan
              </h2>

              <p className="mt-3 max-w-4xl leading-7 text-amber-800">
                Country availability, supported networks, top-up options,
                validity, mobile speed, and activation rules can vary between
                packages. The plan details page is the final source for the
                package you are purchasing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCallToAction() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#061936] via-[#0A2D62] to-blue-700 px-6 py-14 text-white shadow-2xl sm:px-10 lg:px-16">
        <div
          className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
              Search your destination
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Find the coverage that fits your journey.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
              Compare local, regional, and global plans using Seamarino’s
              live eSIM catalog.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-w-48 items-center justify-center rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Browse Plans
            </Link>

            <Link
              href="/contact"
              className="inline-flex min-w-48 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white transition hover:bg-white/20"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  light?: boolean;
};

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={`text-sm font-black uppercase tracking-[0.22em] ${
          light ? "text-sky-300" : "text-blue-600"
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-4 text-4xl font-black tracking-tight sm:text-5xl ${
          light ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>

      <p
        className={`mt-5 text-lg leading-8 ${
          light ? "text-blue-100" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 transition-transform group-hover:translate-x-1"
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

function SignalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="M5 9.5a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 16.5a2 2 0 0 1 2 0"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="19"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"
        strokeLinejoin="round"
      />

      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function AnchorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="2" />

      <path
        d="M12 7v13M5 12H2c0 5.5 4.5 10 10 10s10-4.5 10-10h-3M8 10h8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m5 9 3 3-3 3M19 9l-3 3 3 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TowerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M12 8v13M8 21h8" strokeLinecap="round" />

      <path
        d="M8 8a6 6 0 0 1 8 0M5 5a10 10 0 0 1 14 0"
        strokeLinecap="round"
      />

      <circle cx="12" cy="8" r="1.5" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path
        d="m2 16 8-3V4a2 2 0 0 1 4 0v9l8 3v2l-8-1v3l2 2v1l-4-1-4 1v-1l2-2v-3l-8 1v-2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SimIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
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

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />

      <path d="M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function InformationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path
        d="M12 11v6M12 7.5h.01"
        strokeLinecap="round"
      />
    </svg>
  );
}