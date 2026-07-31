import Link from "next/link";

const statistics = [
  {
    value: "200+",
    label: "Destinations",
  },
  {
    value: "1",
    label: "Digital eSIM",
  },
  {
    value: "24/7",
    label: "Customer Support",
  },
  {
    value: "100%",
    label: "Online Setup",
  },
];

const planTypes = [
  {
    title: "Global Plans",
    description:
      "Travel across multiple continents using one convenient eSIM package.",
    icon: GlobeIcon,
    accent: "from-sky-400 to-blue-700",
    search: "Global",
    badge: "Worldwide",
  },
  {
    title: "Regional Plans",
    description:
      "Choose coverage for Europe, Asia, the Middle East, and other regions.",
    icon: MapIcon,
    accent: "from-blue-500 to-indigo-700",
    search: "Regional",
    badge: "Multi-country",
  },
  {
    title: "Local Plans",
    description:
      "Get dedicated mobile data for one specific country or destination.",
    icon: PinIcon,
    accent: "from-cyan-400 to-sky-600",
    search: "",
    badge: "Single country",
  },
];

const popularRegions = [
  {
    name: "Europe",
    description:
      "Travel between popular European destinations with one regional package.",
    search: "Europe",
    icon: "EU",
    gradient: "from-blue-700 to-indigo-500",
  },
  {
    name: "Asia",
    description:
      "Stay connected across major Asian travel and business destinations.",
    search: "Asia",
    icon: "AS",
    gradient: "from-sky-500 to-cyan-400",
  },
  {
    name: "North America",
    description:
      "Browse packages for the United States, Canada, Mexico, and beyond.",
    search: "North America",
    icon: "NA",
    gradient: "from-indigo-700 to-blue-500",
  },
  {
    name: "Middle East",
    description:
      "Reliable data packages for ports, airports, cities, and business hubs.",
    search: "Middle East",
    icon: "ME",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    name: "South America",
    description:
      "Explore flexible regional options for supported South American countries.",
    search: "South America",
    icon: "SA",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    name: "Africa",
    description:
      "Find local and multi-country data packages across supported destinations.",
    search: "Africa",
    icon: "AF",
    gradient: "from-orange-500 to-red-500",
  },
];

const benefits = [
  {
    title: "One eSIM, More Destinations",
    description:
      "Reduce the need to buy a separate physical SIM every time you cross a border.",
    icon: SimIcon,
  },
  {
    title: "Install Before Departure",
    description:
      "Prepare your eSIM while you still have access to a stable internet connection.",
    icon: PhoneIcon,
  },
  {
    title: "Keep Your Main Number",
    description:
      "Use your physical SIM for calls and messages while your eSIM handles mobile data.",
    icon: SignalIcon,
  },
  {
    title: "Designed for Seafarers",
    description:
      "Compare coverage for ports, international routes, stopovers, and shore leave.",
    icon: AnchorIcon,
  },
  {
    title: "Secure Online Checkout",
    description:
      "Choose your package and complete payment through a protected checkout process.",
    icon: LockIcon,
  },
  {
    title: "Digital Delivery",
    description:
      "Receive your installation information electronically after order processing.",
    icon: DeliveryIcon,
  },
];

const steps = [
  {
    number: "01",
    title: "Search your route",
    description:
      "Choose a country, region, or global plan that matches your destination.",
  },
  {
    number: "02",
    title: "Compare packages",
    description:
      "Review the data allowance, validity, supported locations, and network details.",
  },
  {
    number: "03",
    title: "Complete checkout",
    description:
      "Enter your customer information and continue through secure payment.",
  },
  {
    number: "04",
    title: "Install and connect",
    description:
      "Follow the installation instructions and activate the plan when appropriate.",
  },
];

export default function GlobalPlansPage() {
  return (
    <main className="overflow-hidden bg-slate-50">
      <HeroSection />

      <StatisticsSection />

      <PlanTypesSection />

      <RegionsSection />

      <BenefitsSection />

      <HowItWorksSection />

      <CompatibilityNotice />

      <FinalCallToAction />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#061936] text-white">
      <div
        className="absolute inset-0 opacity-20"
        aria-hidden="true"
      >
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-sky-400 blur-3xl" />

        <div className="absolute -right-36 bottom-0 h-[32rem] w-[32rem] rounded-full bg-blue-500 blur-3xl" />
      </div>

      <div
        className="absolute inset-0"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          className="h-full w-full opacity-20"
        >
          <defs>
            <pattern
              id="global-grid"
              width="70"
              height="70"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M70 0H0V70"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="url(#global-grid)"
          />

          <path
            d="M-40 580C250 430 430 690 720 525C985 374 1160 445 1510 260"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="10 12"
          />

          <path
            d="M-80 690C240 550 500 725 810 600C1040 507 1270 530 1510 420"
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
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            Worldwide Seamarino Coverage
          </span>

          <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            One eSIM.
            <span className="block bg-gradient-to-r from-sky-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              More of the world.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
            Explore local, regional, and worldwide mobile data packages
            designed for international travelers, OFWs, digital nomads,
            and Filipino seafarers.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop?search=Global"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Browse Global Plans
              <ArrowIcon />
            </Link>

            <Link
              href="/coverage"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              Explore Coverage
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {[
              "No physical SIM",
              "Secure checkout",
              "Digital delivery",
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
            className="absolute inset-x-14 bottom-8 h-28 rounded-full bg-sky-400/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative aspect-square">
            <div className="absolute inset-[10%] rounded-full border border-sky-300/20" />
            <div className="absolute inset-[18%] rounded-full border border-sky-300/20" />
            <div className="absolute inset-[26%] rounded-full border border-sky-300/20" />

            <div className="absolute inset-[14%] overflow-hidden rounded-full bg-gradient-to-br from-sky-300 via-blue-500 to-[#071f45] shadow-2xl shadow-blue-900">
              <svg
                viewBox="0 0 500 500"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="ocean-glow">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#061936" />
                  </radialGradient>
                </defs>

                <circle
                  cx="250"
                  cy="250"
                  r="250"
                  fill="url(#ocean-glow)"
                />

                <path
                  d="M112 137c28-38 87-62 130-44 25 10 27 38 47 49 24 14 63-8 82 17 18 24-6 61-28 72-29 14-65 4-92 21-31 19-33 68-65 84-28 14-67-2-75-31-7-27 18-50 20-77 1-28-39-55-19-91Z"
                  fill="#bfdbfe"
                  opacity="0.9"
                />

                <path
                  d="M287 279c25-24 66-30 93-8 27 22 12 63-7 84-21 24-58 30-83 10-28-22-28-62-3-86Z"
                  fill="#dbeafe"
                  opacity="0.9"
                />

                {[
                  [100, 180],
                  [190, 100],
                  [330, 145],
                  [382, 250],
                  [285, 345],
                  [150, 330],
                ].map(([x, y]) => (
                  <g key={`${x}-${y}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="#fbbf24"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="24"
                      fill="none"
                      stroke="#fbbf24"
                      opacity="0.45"
                    />
                  </g>
                ))}

                <path
                  d="M100 180C190 100 280 115 330 145M190 100C290 140 335 190 382 250M150 330C220 285 260 280 285 345M100 180C90 260 115 300 150 330"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="8 10"
                  opacity="0.7"
                />
              </svg>
            </div>

            <div className="absolute bottom-[8%] right-[5%] w-[42%] rotate-3 rounded-[2rem] border border-white/20 bg-[#071f45] p-4 shadow-2xl">
              <div className="rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-blue-800 to-[#061936] px-4 py-7 text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                  Seamarino
                </p>

                <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-sky-300/30 bg-sky-400/10">
                  <SignalIcon />
                </div>

                <p className="mt-7 text-xl font-black text-white">
                  Connected Worldwide
                </p>

                <div className="mt-7 rounded-xl bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-300">
                  ● Active connection
                </div>
              </div>
            </div>

            <div className="absolute bottom-[9%] left-[8%] w-[30%] -rotate-6 rounded-[1.8rem] border border-amber-300/40 bg-gradient-to-b from-blue-700 to-[#071f45] p-4 shadow-2xl">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-amber-300 p-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span
                    key={index}
                    className="aspect-square rounded-sm border border-amber-600/40 bg-amber-200"
                  />
                ))}
              </div>

              <p className="mt-4 text-center text-2xl font-black text-white">
                eSIM
              </p>
            </div>

            <div className="absolute left-[6%] top-[13%] flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur">
              <AnchorIcon />
            </div>

            <div className="absolute right-[10%] top-[9%] flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-xl shadow-xl">
              ✈
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ["Secure Payment", "Protected checkout"],
            ["Digital Delivery", "Online eSIM details"],
            ["Global Packages", "Multiple destinations"],
            ["Customer Support", "Help when needed"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
                ✓
              </span>

              <div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm text-blue-200">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatisticsSection() {
  return (
    <section className="relative z-10 -mt-1 bg-white">
      <div className="mx-auto grid max-w-7xl gap-0 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {statistics.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-6 py-6 text-center ${
              index > 0 ? "sm:border-l sm:border-slate-200" : ""
            }`}
          >
            <p className="text-4xl font-black text-[#0A2D62]">
              {stat.value}
            </p>

            <p className="mt-2 text-sm font-bold uppercase tracking-[0.15em] text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanTypesSection() {
  return (
    <section className="relative bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Choose your connection"
          title="A plan for every kind of journey"
          description="Compare worldwide, regional, and country-specific packages based on where you are traveling."
        />

        <div className="mt-14 grid gap-7 lg:grid-cols-3">
          {planTypes.map((plan) => {
            const Icon = plan.icon;

            return (
              <Link
                key={plan.title}
                href={
                  plan.search
                    ? `/shop?search=${encodeURIComponent(plan.search)}`
                    : "/shop"
                }
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${plan.accent}`}
                />

                <div className="flex items-start justify-between gap-5">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.accent} text-white shadow-lg`}
                  >
                    <Icon />
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700">
                    {plan.badge}
                  </span>
                </div>

                <h3 className="mt-8 text-3xl font-black text-[#0A2D62]">
                  {plan.title}
                </h3>

                <p className="mt-4 min-h-20 leading-7 text-slate-600">
                  {plan.description}
                </p>

                <span className="mt-8 inline-flex items-center gap-2 font-black text-blue-700">
                  Explore Plans
                  <ArrowIcon />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RegionsSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular regions"
          title="Connect across the world"
          description="Search plans by region and compare the packages available for your route."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {popularRegions.map((region) => (
            <Link
              key={region.name}
              href={`/shop?search=${encodeURIComponent(region.search)}`}
              className="group relative min-h-72 overflow-hidden rounded-[2rem] border border-slate-200 bg-[#071f45] p-7 text-white shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${region.gradient} opacity-80 transition duration-500 group-hover:scale-110`}
              />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_40%)]" />

              <div className="relative flex h-full flex-col">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-black backdrop-blur">
                  {region.icon}
                </div>

                <h3 className="mt-8 text-3xl font-black">
                  {region.name}
                </h3>

                <p className="mt-3 leading-7 text-white/85">
                  {region.description}
                </p>

                <span className="mt-auto inline-flex items-center gap-2 pt-8 font-black">
                  View Region
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
          eyebrow="Built for global movement"
          title="Connectivity designed around your journey"
          description="Seamarino combines digital convenience, international coverage, and a maritime-first identity."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.title}
                className="group rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:-translate-y-2 hover:border-sky-300/40 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
                    <Icon />
                  </div>

                  <span className="text-5xl font-black text-white/5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-black">
                  {benefit.title}
                </h3>

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

function HowItWorksSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Simple process"
          title="From destination to connection"
          description="Find your package and prepare your eSIM through four clear steps."
        />

        <div className="relative mt-14">
          <div
            className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-sky-300 via-blue-600 to-sky-300 lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="relative rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A2D62] to-blue-600 text-xl font-black text-white shadow-xl">
                  {step.number}
                </div>

                <h3 className="mt-7 text-2xl font-black text-[#0A2D62]">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompatibilityNotice() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-sky-50 to-blue-100 p-8 shadow-xl sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
        <div>
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">
            Device Compatibility
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
            Check your device before purchasing
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            Your phone must support eSIM and usually needs to be
            carrier-unlocked. Device compatibility can vary by model,
            region, and network provider.
          </p>

          <Link
            href="/faq"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#0A2D62] px-7 py-4 font-black text-white transition hover:bg-blue-800"
          >
            Read Compatibility FAQs
            <ArrowIcon />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="rounded-[2.5rem] bg-[#071f45] p-6 shadow-2xl">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-800 to-[#061936] p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["eSIM Support", "Required"],
                  ["Carrier Lock", "Must be unlocked"],
                  ["Internet", "Needed for setup"],
                  ["Device Model", "Check compatibility"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5"
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
              Ready to connect?
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Choose the plan that follows your journey.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
              Browse worldwide, regional, and local eSIM packages from
              one Seamarino storefront.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-w-48 items-center justify-center rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Browse All Plans
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

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path
        d="M3 12h18M12 3c2.4 2.6 3.7 5.6 3.7 9S14.4 18.4 12 21M12 3C9.6 5.6 8.3 8.6 8.3 12S9.6 18.4 12 21"
        strokeLinecap="round"
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

function PinIcon() {
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
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        strokeLinejoin="round"
      />

      <circle cx="12" cy="10" r="2.5" />
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

function SignalIcon() {
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
        d="M5 9.5a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 16.5a2 2 0 0 1 2 0"
        strokeLinecap="round"
      />

      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M7 10V7a5 5 0 0 1 10 0v3" strokeLinecap="round" />
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M12 14v3" strokeLinecap="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
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