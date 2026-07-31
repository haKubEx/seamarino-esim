import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Choose Your Destination",
    description:
      "Search for the country, region, or global plan that matches your trip.",
    icon: (
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
          d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3C9.6 5.5 8.4 8.5 8.4 12S9.6 18.5 12 21"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Purchase Your eSIM",
    description:
      "Select your preferred plan and complete your order through secure checkout.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 15h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Install Your eSIM",
    description:
      "Follow the installation guide and add the eSIM to your compatible device.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-8 w-8"
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
  {
    number: "04",
    title: "Connect When You Arrive",
    description:
      "Turn on the eSIM and mobile data according to the plan instructions.",
    icon: (
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
        <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div
        className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-bold text-[#0A2D62]">
            <span aria-hidden="true">📱</span>
            Simple eSIM Setup
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0A2D62] sm:text-5xl">
            How It Works
          </h2>

          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Choose a plan, complete your order, install your eSIM, and
            connect when you are ready to use your mobile data.
          </p>
        </div>

        <div className="relative mt-16">
          <div
            className="absolute left-[12.5%] right-[12.5%] top-[72px] hidden h-0.5 bg-gradient-to-r from-sky-200 via-blue-400 to-sky-200 lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="group relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl"
              >
                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A2D62] to-blue-600 text-white shadow-lg transition duration-300 group-hover:scale-105">
                  {step.icon}
                </div>

                <div className="absolute right-5 top-5 text-5xl font-black text-slate-100 transition group-hover:text-blue-100">
                  {step.number}
                </div>

                <div className="mt-7 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
                    Step {step.number}
                  </p>

                  <h3 className="mt-3 text-xl font-black text-[#0A2D62]">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>

                <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-sky-400 to-blue-700 transition-all duration-500 group-hover:w-full" />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex min-w-48 items-center justify-center rounded-2xl bg-[#0A2D62] px-7 py-4 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#071f45]"
          >
            Browse eSIM Plans
          </Link>

          <Link
            href="/faq"
            className="inline-flex min-w-48 items-center justify-center rounded-2xl border-2 border-[#0A2D62] px-7 py-4 font-bold text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
          >
            Read Installation FAQs
          </Link>
        </div>
      </div>
    </section>
  );
}