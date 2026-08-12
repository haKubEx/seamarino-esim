import CouponsManager from "./CouponsManager";

export const dynamic =
  "force-dynamic";

export default function AdminCouponsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
            Seamarino Admin
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Coupon Management
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Create fixed peso discounts,
            control plan eligibility,
            monitor usage, and enable or
            disable promotions.
          </p>
        </div>

        <CouponsManager />
      </div>
    </main>
  );
}