import ShopPlans from "@/app/Components/shop/ShopPlans";

export const dynamic =
  "force-dynamic";

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 px-4 py-16 text-center text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-200">
            Seamarino
            eSIM
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Shop eSIM
            Plans
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
            Find
            affordable
            mobile data
            plans for your
            destination.
            Activate
            online without
            changing your
            physical SIM.
          </p>
        </div>
      </section>

      <ShopPlans />
    </main>
  );
}