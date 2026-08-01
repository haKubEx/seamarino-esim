"use client";

import {
  FormEvent,
  useState,
} from "react";

type AdminPlan = {
  packageCode: string;
  supplierName: string;
  displayName: string;

  slug: string | null;
  locationName: string;
  locationCode: string | null;

  volume: number | null;
  duration: number | null;
  durationUnit: string | null;

  currencyCode: string;

  supplierPriceRaw: number;
  supplierCostUsd: number;
  sellingPriceUsd: number;

  enabled: boolean;
  featured: boolean;
  markupPercent: number;
  customName: string | null;

  updatedAt: string | null;
};

type PlansResponse = {
  success: boolean;
  plans?: AdminPlan[];
  total?: number;
  message?: string;
  error?: string;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

function formatVolume(
  bytes: number | null,
) {
  if (!bytes) {
    return "—";
  }

  const gigabytes =
    bytes / 1024 / 1024 / 1024;

  return `${Number(
    gigabytes.toFixed(2),
  )} GB`;
}

export default function AdminPlansPage() {
  const [adminKey, setAdminKey] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [plans, setPlans] =
    useState<AdminPlan[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [savingCode, setSavingCode] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadPlans(
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault();

    if (!adminKey.trim()) {
      setError("Enter your admin key.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim(),
        );
      }

      const query =
        params.toString()
          ? `?${params.toString()}`
          : "";

      const response =
        await fetch(
          `/api/admin/plans${query}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "x-admin-key":
                adminKey.trim(),
            },
          },
        );

      const data =
        (await response.json()) as PlansResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load plans.",
        );
      }

      setPlans(data.plans ?? []);

      setMessage(
        `${data.total ?? 0} plans loaded.`,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load plans.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateLocalPlan(
    packageCode: string,
    changes: Partial<AdminPlan>,
  ) {
    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.packageCode === packageCode
          ? {
              ...plan,
              ...changes,
            }
          : plan,
      ),
    );
  }

  async function savePlan(
    plan: AdminPlan,
  ) {
    if (!adminKey.trim()) {
      setError("Enter your admin key.");
      return;
    }

    try {
      setSavingCode(plan.packageCode);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/admin/plans",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              "x-admin-key":
                adminKey.trim(),
            },
            body: JSON.stringify({
              packageCode:
                plan.packageCode,
              enabled:
                plan.enabled,
              featured:
                plan.featured,
              markupPercent:
                plan.markupPercent,
              customName:
                plan.customName,
            }),
          },
        );

      const data =
        (await response.json()) as PlansResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to save plan.",
        );
      }

      const newSellingPrice =
        plan.supplierCostUsd *
        (1 +
          plan.markupPercent /
            100);

      updateLocalPlan(
        plan.packageCode,
        {
          sellingPriceUsd:
            newSellingPrice,
        },
      );

      setMessage(
        `${plan.packageCode} was updated successfully.`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save plan.",
      );
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            Plans Management
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Enable or hide plans,
            change markup percentages,
            customize names, and choose
            featured packages.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white"
            >
              Dashboard
            </a>

            <a
              href="/admin/orders"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white"
            >
              Orders
            </a>

            <a
              href="/"
              className="rounded-xl bg-white px-5 py-3 font-black text-[#0A2D62]"
            >
              Storefront
            </a>
          </div>
        </section>

        <form
          onSubmit={loadPlans}
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 lg:grid-cols-[300px_1fr_auto]">
            <input
              type="password"
              value={adminKey}
              onChange={(event) =>
                setAdminKey(
                  event.target.value,
                )
              }
              autoComplete="current-password"
              placeholder="Enter ADMIN_API_KEY"
              className="h-14 rounded-2xl border border-slate-300 px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search country, package code or plan name"
              className="h-14 rounded-2xl border border-slate-300 px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-[#0A2D62] px-7 font-black text-white disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Load Plans"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-5">
          {plans.map((plan) => (
            <article
              key={plan.packageCode}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr_1fr_auto] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      {plan.packageCode}
                    </span>

                    {plan.featured && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        FEATURED
                      </span>
                    )}

                    {!plan.enabled && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                        HIDDEN
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    {plan.displayName}
                  </h2>

                  <p className="mt-1 text-slate-500">
                    {plan.locationName}
                  </p>

                  <p className="mt-3 text-sm text-slate-500">
                    {formatVolume(
                      plan.volume,
                    )}{" "}
                    •{" "}
                    {plan.duration ?? "—"}{" "}
                    {plan.durationUnit ??
                      ""}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Supplier cost
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {formatUsd(
                      plan.supplierCostUsd,
                    )}
                  </p>

                  <p className="mt-4 text-sm font-bold text-slate-500">
                    Estimated selling price
                  </p>

                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {formatUsd(
                      plan.supplierCostUsd *
                        (1 +
                          plan.markupPercent /
                            100),
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Custom plan name
                    </label>

                    <input
                      type="text"
                      value={
                        plan.customName ??
                        ""
                      }
                      onChange={(event) =>
                        updateLocalPlan(
                          plan.packageCode,
                          {
                            customName:
                              event.target
                                .value,
                          },
                        )
                      }
                      placeholder={
                        plan.supplierName
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Markup percentage
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.01"
                      value={
                        plan.markupPercent
                      }
                      onChange={(event) =>
                        updateLocalPlan(
                          plan.packageCode,
                          {
                            markupPercent:
                              Number(
                                event.target
                                  .value,
                              ),
                          },
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-500"
                    />
                  </div>

                  <label className="flex items-center gap-3 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={
                        plan.enabled
                      }
                      onChange={(event) =>
                        updateLocalPlan(
                          plan.packageCode,
                          {
                            enabled:
                              event.target
                                .checked,
                          },
                        )
                      }
                      className="h-5 w-5"
                    />

                    Enabled
                  </label>

                  <label className="flex items-center gap-3 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={
                        plan.featured
                      }
                      onChange={(event) =>
                        updateLocalPlan(
                          plan.packageCode,
                          {
                            featured:
                              event.target
                                .checked,
                          },
                        )
                      }
                      className="h-5 w-5"
                    />

                    Featured
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void savePlan(plan)
                  }
                  disabled={
                    savingCode ===
                    plan.packageCode
                  }
                  className="rounded-2xl bg-[#0A2D62] px-6 py-4 font-black text-white disabled:opacity-50"
                >
                  {savingCode ===
                  plan.packageCode
                    ? "Saving..."
                    : "Save Plan"}
                </button>
              </div>
            </article>
          ))}

          {!loading &&
            plans.length === 0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-16 text-center text-slate-500">
                Enter your admin key and
                click Load Plans.
              </div>
            )}
        </section>
      </div>
    </main>
  );
}