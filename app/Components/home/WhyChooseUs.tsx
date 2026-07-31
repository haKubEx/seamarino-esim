const features = [
  {
    title: "Instant Delivery",
    description:
      "Receive your eSIM details digitally after your payment is successfully processed.",
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
          d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Global Coverage",
    description:
      "Choose data packages for countries, regions, and worldwide destinations.",
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
    title: "Secure Checkout",
    description:
      "Complete your purchase through a protected and reliable online payment process.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <path d="M7 10V7a5 5 0 0 1 10 0v3" strokeLinecap="round" />

        <rect x="4" y="10" width="16" height="11" rx="2" />

        <path d="M12 14v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Customer Support",
    description:
      "Get guidance before purchasing and assistance when installing your eSIM.",
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
          d="M4 13v-1a8 8 0 0 1 16 0v1"
          strokeLinecap="round"
        />

        <path
          d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z"
          strokeLinejoin="round"
        />

        <path d="M17 18c-.8 2-2.5 3-5 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Simple Installation",
    description:
      "Use the provided installation details and setup guide on a compatible device.",
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
    title: "No Physical SIM",
    description:
      "Stay connected without replacing or carrying an additional plastic SIM card.",
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
          d="M7 3h7l4 4v14H7V3Z"
          strokeLinejoin="round"
        />

        <path d="M14 3v5h5" strokeLinejoin="round" />

        <path
          d="M9.5 12h5M9.5 15h5"
          strokeLinecap="round"
        />

        <path
          d="m5 5 14 14"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-24">
      <div
        className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-bold text-[#0A2D62]">
            <span aria-hidden="true">⚓</span>
            Seamarino Benefits
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0A2D62] sm:text-5xl">
            Why Choose Seamarino eSIM?
          </h2>

          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Reliable digital connectivity designed for seafarers,
            travelers, OFWs, and digital nomads.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl"
            >
              <div
                className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-50 transition duration-300 group-hover:scale-125 group-hover:bg-blue-100"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A2D62] to-blue-600 text-white shadow-lg transition duration-300 group-hover:scale-105">
                    {feature.icon}
                  </div>

                  <span className="text-5xl font-black text-slate-100 transition group-hover:text-blue-100">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-black text-[#0A2D62]">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {feature.description}
                </p>

                <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-sky-400 to-blue-700 transition-all duration-500 group-hover:w-full" />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-[2rem] bg-gradient-to-r from-[#071f45] via-[#0A2D62] to-blue-700 px-6 py-10 text-center shadow-2xl sm:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">
            Connect without limits
          </p>

          <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            Prepare your mobile data before your next journey.
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
            Browse available destinations, compare plans, and choose
            the eSIM package that fits your trip.
          </p>

          <a
            href="/shop"
            className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Browse eSIM Plans
          </a>
        </div>
      </div>
    </section>
  );
}