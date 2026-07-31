import Link from "next/link";

const destinations = [
  {
    name: "Global",
    description: "200+ Countries",
    search: "Global",
    color: "from-sky-400 to-blue-700",
    iconType: "emoji",
    icon: "🌍",
  },
  {
    name: "Japan",
    description: "Fast 5G Coverage",
    search: "Japan",
    color: "from-red-500 to-pink-500",
    iconType: "flag",
    icon: "jp",
  },
  {
    name: "Singapore",
    description: "High-Speed Data",
    search: "Singapore",
    color: "from-red-600 to-orange-500",
    iconType: "flag",
    icon: "sg",
  },
  {
    name: "South Korea",
    description: "Unlimited Options",
    search: "South Korea",
    color: "from-blue-500 to-cyan-500",
    iconType: "flag",
    icon: "kr",
  },
  {
    name: "Thailand",
    description: "Tourist Favorite",
    search: "Thailand",
    color: "from-indigo-500 to-blue-600",
    iconType: "flag",
    icon: "th",
  },
  {
    name: "Malaysia",
    description: "Affordable Plans",
    search: "Malaysia",
    color: "from-emerald-500 to-green-600",
    iconType: "flag",
    icon: "my",
  },
  {
    name: "United States",
    description: "Premium Network",
    search: "USA",
    color: "from-blue-700 to-indigo-700",
    iconType: "flag",
    icon: "us",
  },
  {
    name: "Europe",
    description: "Multi-Country Travel",
    search: "Europe",
    color: "from-blue-600 to-sky-500",
    iconType: "flag",
    icon: "eu",
  },
];

export default function PopularDestinations() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-bold text-[#0A2D62]">
            <span aria-hidden="true">🌎</span>
            Most Popular Destinations
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0A2D62] sm:text-5xl">
            Travel Anywhere
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Choose your destination and enjoy fast, reliable mobile
            data with Seamarino eSIM.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((item) => (
            <Link
              key={item.name}
              href={`/shop?search=${encodeURIComponent(item.search)}`}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl"
            >
              <div
                className={`h-4 w-full bg-gradient-to-r ${item.color}`}
              />

              <div className="flex min-h-[340px] flex-col items-center px-6 py-10 text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100 transition duration-300 group-hover:scale-110 group-hover:ring-blue-300">
                  {item.iconType === "flag" ? (
                    <img
                      src={`https://flagcdn.com/w160/${item.icon}.png`}
                      alt={`${item.name} flag`}
                      width={96}
                      height={64}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                </div>

                <h3 className="mt-7 text-2xl font-black text-[#0A2D62]">
                  {item.name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <span className="mt-auto inline-flex items-center justify-center rounded-xl bg-[#0A2D62] px-6 py-3 text-sm font-bold text-white transition group-hover:bg-blue-600">
                  View Plans
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}