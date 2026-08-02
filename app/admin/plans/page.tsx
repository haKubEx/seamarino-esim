"use client";

import {
  FormEvent,
  useState,
} from "react";

type AdminPlan = {
  packageCode: string;
  supplierName: string;
  displayName: string;
  customName: string | null;

  locationName: string;
  locationCode: string | null;

  volume: number;
  duration: number;
  durationUnit: string;

  enabled: boolean;
  featured: boolean;

  supplierCostUsd: number;
  markupAmountUsd: number;
  sellingPriceUsd: number;
  sellingPricePhp: number;
  amountPhpCentavos: number;
  usdToPhpRate: number;

  isGlobalPlan: boolean;
  markupTable?: "GLOBAL" | "STANDARD";

  volumeGb: number;
  volumeMb: number;

  updatedAt: string | null;
};

type PlansResponse = {
  success: boolean;
  plans?: AdminPlan[];
  total?: number;
  message?: string;
  error?: string;
};

function getSafeNumber(
  value: unknown,
  fallback = 0,
) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : fallback;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    getSafeNumber(value),
  );
}

function formatPhp(value: number) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    getSafeNumber(value),
  );
}

function formatVolume(bytes: number) {
  const safeBytes =
    getSafeNumber(bytes);

  if (safeBytes <= 0) {
    return "—";
  }

  const megabytes =
    safeBytes / 1024 / 1024;

  const gigabytes =
    safeBytes /
    1024 /
    1024 /
    1024;

  if (gigabytes < 1) {
    return `${Math.round(
      megabytes,
    )} MB`;
  }

  return `${
    Number.isInteger(gigabytes)
      ? gigabytes
      : gigabytes.toFixed(1)
  } GB`;
}

function formatDurationUnit(
  unit: string | undefined,
  duration: number,
) {
  const normalizedUnit =
    unit?.trim().toLowerCase() ||
    "day";

  if (duration === 1) {
    return normalizedUnit.endsWith("s")
      ? normalizedUnit.slice(0, -1)
      : normalizedUnit;
  }

  return normalizedUnit.endsWith("s")
    ? normalizedUnit
    : `${normalizedUnit}s`;
}

function getCoverageLabel(
  plan: AdminPlan,
) {
  const locationName =
    plan.locationName?.trim() || "";

  if (plan.isGlobalPlan) {
    return "120+ countries and regions";
  }

  if (!locationName) {
    return "Coverage information unavailable";
  }

  if (
    locationName
      .toLowerCase()
      .includes("countries covered")
  ) {
    return locationName;
  }

  if (locationName.includes(",")) {
    const locationCount =
      locationName
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .length;

    return `${locationCount} countries covered`;
  }

  return locationName;
}

function getPlanTypeLabel(
  plan: AdminPlan,
) {
  return plan.isGlobalPlan
    ? "GLOBAL"
    : "STANDARD";
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

  const [
    savingPackageCode,
    setSavingPackageCode,
  ] = useState<string | null>(
    null,
  );

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadPlans(
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault();

    if (!adminKey.trim()) {
      setError(
        "Enter your admin key.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const parameters =
        new URLSearchParams();

      if (search.trim()) {
        parameters.set(
          "search",
          search.trim(),
        );
      }

      const query =
        parameters.toString()
          ? `?${parameters.toString()}`
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
        plan.packageCode ===
        packageCode
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
      setError(
        "Enter your admin key.",
      );
      return;
    }

    try {
      setSavingPackageCode(
        plan.packageCode,
      );

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

      setMessage(
        `${plan.packageCode} was saved successfully.`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save plan.",
      );
    } finally {
      setSavingPackageCode(
        null,
      );
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            Plans Management
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Review supplier costs,
            automatic markup, selling
            prices, and storefront
            visibility.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
            >
              Dashboard
            </a>

            <a
              href="/admin/orders"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
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
          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_auto]">
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
              className="h-14 min-w-0 rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search country, package code, or plan"
              className="h-14 min-w-0 rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-[#0A2D62] px-7 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
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
          {plans.map((plan) => {
            const supplierCostUsd =
              getSafeNumber(
                plan.supplierCostUsd,
              );

            const markupAmountUsd =
              getSafeNumber(
                plan.markupAmountUsd,
              );

            const sellingPriceUsd =
              getSafeNumber(
                plan.sellingPriceUsd,
                supplierCostUsd +
                  markupAmountUsd,
              );

            const usdToPhpRate =
              getSafeNumber(
                plan.usdToPhpRate,
              );

            const sellingPricePhp =
              getSafeNumber(
                plan.sellingPricePhp,
                sellingPriceUsd *
                  usdToPhpRate,
              );

            const coverageLabel =
              getCoverageLabel(plan);

            return (
              <article
                key={plan.packageCode}
                className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid min-w-0 gap-7 p-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.25fr)_minmax(210px,0.75fr)_minmax(260px,0.9fr)_auto] 2xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="max-w-full truncate rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {plan.packageCode}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          plan.isGlobalPlan
                            ? "bg-amber-50 text-amber-700"
                            : "bg-violet-50 text-violet-700"
                        }`}
                      >
                        {getPlanTypeLabel(
                          plan,
                        )}
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

                    <h2
                      className="mt-4 line-clamp-2 break-words text-2xl font-black leading-tight text-slate-950"
                      title={
                        plan.displayName
                      }
                    >
                      {plan.displayName}
                    </h2>

                    <p
                      className="mt-2 truncate text-slate-500"
                      title={coverageLabel}
                    >
                      {coverageLabel}
                    </p>

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      {formatVolume(
                        plan.volume,
                      )}{" "}
                      •{" "}
                      {getSafeNumber(
                        plan.duration,
                        1,
                      )}{" "}
                      {formatDurationUnit(
                        plan.durationUnit,
                        getSafeNumber(
                          plan.duration,
                          1,
                        ),
                      )}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-slate-50 p-5">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Supplier cost
                      </p>

                      <p className="mt-1 text-3xl font-black text-slate-950">
                        {formatUsd(
                          supplierCostUsd,
                        )}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-bold text-slate-500">
                        Automatic markup
                      </p>

                      <p className="mt-1 text-2xl font-black text-blue-700">
                        +
                        {formatUsd(
                          markupAmountUsd,
                        )}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {plan.isGlobalPlan
                          ? "Global markup table"
                          : "Standard markup table"}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <p className="text-sm font-bold text-slate-500">
                        Customer selling price
                      </p>

                      <p className="mt-1 text-3xl font-black text-emerald-700">
                        {formatUsd(
                          sellingPriceUsd,
                        )}
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-600">
                        {formatPhp(
                          sellingPricePhp,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-5">
                    <div>
                      <label
                        htmlFor={`custom-name-${plan.packageCode}`}
                        className="mb-2 block text-sm font-bold text-slate-700"
                      >
                        Custom plan name
                      </label>

                      <input
                        id={`custom-name-${plan.packageCode}`}
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
                          plan.displayName ||
                          plan.supplierName
                        }
                        className="h-12 w-full min-w-0 rounded-xl border border-slate-300 px-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

                  <div className="flex items-end 2xl:h-full">
                    <button
                      type="button"
                      onClick={() =>
                        void savePlan(plan)
                      }
                      disabled={
                        savingPackageCode ===
                        plan.packageCode
                      }
                      className="w-full rounded-2xl bg-[#0A2D62] px-7 py-4 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 2xl:w-auto"
                    >
                      {savingPackageCode ===
                      plan.packageCode
                        ? "Saving..."
                        : "Save Plan"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

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