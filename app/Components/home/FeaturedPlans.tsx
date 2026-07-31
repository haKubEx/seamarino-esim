import Link from "next/link";
import { featuredPlans } from "../../data/plans";

function getFlag(country: string) {
  switch (country.toLowerCase()) {
    case "japan":
      return "jp";
    case "singapore":
      return "sg";
    case "united states":
    case "usa":
      return "us";
    case "south korea":
      return "kr";
    case "thailand":
      return "th";
    case "malaysia":
      return "my";
    case "europe":
      return "eu";
    default:
      return "";
  }
}

export default function FeaturedPlans() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">

          <span className="inline-flex rounded-full bg-blue-100 px-5 py-2 text-sm font-bold text-[#0A2D62]">
            ⭐ Best Selling Plans
          </span>

          <h2 className="mt-6 text-5xl font-black text-[#0A2D62]">
            Featured eSIM Plans
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Our most popular eSIM plans trusted by travelers,
            OFWs and Filipino seafarers.
          </p>

        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">

          {featuredPlans.map((plan) => {

            const flag = getFlag(plan.country);

            return (

              <div
                key={plan.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl"
              >

                <div className="flex items-center justify-between bg-gradient-to-r from-[#0A2D62] to-blue-600 px-5 py-3">

                  <span className="text-sm font-bold text-white">
                    ⭐ Best Seller
                  </span>

                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                    eSIM
                  </span>

                </div>

                <div className="p-6">

                  <div className="flex justify-center">

                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100">

                      {flag ? (

                        <img
                          src={`https://flagcdn.com/w160/${flag}.png`}
                          alt={plan.country}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <span className="text-5xl">
                          🌍
                        </span>

                      )}

                    </div>

                  </div>

                  <h3 className="mt-6 text-center text-2xl font-black text-[#0A2D62]">
                    {plan.country}
                  </h3>

                  <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">

                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        📶 Data
                      </span>

                      <span className="font-bold text-[#0A2D62]">
                        {plan.data}
                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        📅 Validity
                      </span>

                      <span className="font-bold text-[#0A2D62]">
                        {plan.validity}
                      </span>

                    </div>

                  </div>

                  <div className="mt-8 text-center">

                    <p className="text-sm text-slate-500">
                      Starting From
                    </p>

                    <div className="mt-2 text-4xl font-black text-[#0A2D62]">
                      {plan.price}
                    </div>

                  </div>

                  <Link
                    href={`/shop?search=${encodeURIComponent(plan.country)}`}
                    className="mt-8 block rounded-2xl bg-[#0A2D62] py-4 text-center text-lg font-bold text-white transition hover:bg-blue-700"
                  >
                    View Plan →
                  </Link>

                </div>

              </div>

            );

          })}

        </div>

      </div>
    </section>
  );
}