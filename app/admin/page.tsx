"use client";

import { FormEvent, useState } from "react";

type SettingsResponse = {
  success: boolean;
  usdToPhpRate?: number;
  updatedAt?: string;
  message?: string;
  error?: string;
};

type DashboardCardProps = {
  title: string;
  description: string;
  href?: string;
  buttonLabel: string;
  icon: string;
  disabled?: boolean;
};

function DashboardCard({
  title,
  description,
  href,
  buttonLabel,
  icon,
  disabled = false,
}: DashboardCardProps) {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
          {icon}
        </div>

        {disabled && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500">
            Coming Soon
          </span>
        )}
      </div>

      <h2 className="mt-6 text-2xl font-black text-slate-950">
        {title}
      </h2>

      <p className="mt-3 min-h-[84px] leading-7 text-slate-600">
        {description}
      </p>

      {href && !disabled ? (
        <a
          href={href}
          className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#0A2D62] px-5 py-4 font-black text-white transition hover:bg-blue-800"
        >
          {buttonLabel}
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-4 font-black text-slate-500"
        >
          {buttonLabel}
        </button>
      )}
    </article>
  );
}

export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState("");
  const [rate, setRate] = useState("58");
  const [currentRate, setCurrentRate] =
    useState<number | null>(null);
  const [updatedAt, setUpdatedAt] =
    useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSettings() {
    if (!adminKey.trim()) {
      setError("Enter your admin key.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/settings/exchange-rate",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "x-admin-key": adminKey.trim(),
          },
        },
      );

      const data =
        (await response.json()) as SettingsResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load settings.",
        );
      }

      const loadedRate = Number(data.usdToPhpRate);

      if (!Number.isFinite(loadedRate) || loadedRate <= 0) {
        throw new Error(
          "The saved exchange rate is invalid.",
        );
      }

      setCurrentRate(loadedRate);
      setRate(loadedRate.toString());
      setUpdatedAt(data.updatedAt ?? null);
      setMessage("Settings loaded successfully.");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveRate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!adminKey.trim()) {
      setError("Enter your admin key.");
      return;
    }

    const numericRate = Number(rate);

    if (
      !Number.isFinite(numericRate) ||
      numericRate <= 0 ||
      numericRate > 1000
    ) {
      setError(
        "Enter a valid USD-to-PHP exchange rate.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/settings/exchange-rate",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey.trim(),
          },
          body: JSON.stringify({
            usdToPhpRate: numericRate,
          }),
        },
      );

      const data =
        (await response.json()) as SettingsResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to update the exchange rate.",
        );
      }

      const savedRate = Number(data.usdToPhpRate);

      setCurrentRate(savedRate);
      setRate(savedRate.toString());
      setUpdatedAt(data.updatedAt ?? null);
      setMessage(
        data.message ||
          "Exchange rate updated successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the exchange rate.",
      );
    } finally {
      setLoading(false);
    }
  }

  const previewRate =
    Number(rate) > 0 ? Number(rate) : 0;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            Admin Dashboard
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Manage customer orders, exchange rates,
            eSIM fulfillment, pricing, and store
            operations from one place.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/admin/orders"
              className="inline-flex rounded-xl bg-white px-5 py-3 font-black text-[#0A2D62] transition hover:bg-blue-50"
            >
              Open Orders
            </a>

            <a
              href="/"
              className="inline-flex rounded-xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
            >
              View Storefront
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Orders"
            description="Search customers, inspect payments, view QR codes, and monitor fulfillment and email delivery."
            href="/admin/orders"
            buttonLabel="Manage Orders"
            icon="📦"
          />

          <DashboardCard
            title="Pricing"
            description="Update the USD-to-PHP rate used when creating new PayMongo checkout sessions."
            href="#exchange-rate"
            buttonLabel="Manage Pricing"
            icon="💵"
          />

          <DashboardCard
            title="Plans"
            description="Control which eSIM plans appear in your store and manage future pricing rules."
            buttonLabel="Manage Plans"
            icon="🌍"
            disabled
          />

          <DashboardCard
            title="Customers"
            description="View customer order history, total spending, and recent purchases."
            buttonLabel="View Customers"
            icon="👥"
            disabled
          />

          <DashboardCard
            title="Analytics"
            description="Review orders, completed sales, failed transactions, revenue, and top destinations."
            buttonLabel="View Analytics"
            icon="📈"
            disabled
          />

          <DashboardCard
            title="Email Delivery"
            description="Monitor eSIM email delivery, failed attempts, and future resend actions."
            href="/admin/orders"
            buttonLabel="Check Deliveries"
            icon="📧"
          />

          <DashboardCard
            title="Automation"
            description="Runhooks automatically checks supplier profiles and delivers issued eSIMs."
            buttonLabel="Automation Active"
            icon="⚙️"
            disabled
          />

          <DashboardCard
            title="Storefront"
            description="Open the public Seamarino eSIM storefront and check the customer buying experience."
            href="/"
            buttonLabel="Open Storefront"
            icon="🛒"
          />
        </section>

        <section
          id="exchange-rate"
          className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          <form
            onSubmit={saveRate}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9"
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Pricing Settings
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              USD to PHP exchange rate
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              This rate applies only to new orders.
              Existing orders keep the exchange rate
              used when they were created.
            </p>

            <div className="mt-8">
              <label
                htmlFor="adminKey"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Admin key
              </label>

              <input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(event) =>
                  setAdminKey(event.target.value)
                }
                autoComplete="current-password"
                placeholder="Enter ADMIN_API_KEY"
                className="h-14 w-full rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="mt-4 rounded-xl border border-[#0A2D62] px-5 py-3 font-bold text-[#0A2D62] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Load Current Settings"}
            </button>

            <div className="mt-8">
              <label
                htmlFor="usdToPhpRate"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                PHP value for $1 USD
              </label>

              <div className="flex items-center rounded-2xl border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                <span className="px-5 text-xl font-black text-slate-500">
                  ₱
                </span>

                <input
                  id="usdToPhpRate"
                  type="number"
                  min="1"
                  max="1000"
                  step="0.01"
                  value={rate}
                  onChange={(event) =>
                    setRate(event.target.value)
                  }
                  className="h-16 w-full rounded-r-2xl pr-5 text-2xl font-black outline-none"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-700">
                Conversion preview
              </p>

              <p className="mt-2 text-2xl font-black text-[#0A2D62]">
                $1.00 = ₱{previewRate.toFixed(2)}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                A $10.00 plan becomes approximately
                ₱{(previewRate * 10).toFixed(2)}.
              </p>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Save Exchange Rate"}
            </button>
          </form>

          <aside className="h-fit space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                Current Setting
              </p>

              <div className="mt-5 rounded-2xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">
                  Active exchange rate
                </p>

                <p className="mt-2 text-4xl font-black text-[#0A2D62]">
                  {currentRate === null
                    ? "Not loaded"
                    : `₱${currentRate.toFixed(2)}`}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  per $1 USD
                </p>
              </div>

              {updatedAt && (
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  Last updated:{" "}
                  {new Date(updatedAt).toLocaleString(
                    "en-PH",
                  )}
                </p>
              )}
            </div>

            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
              <p className="font-black text-emerald-900">
                Automation Status
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Runhooks is active and calls the
                fulfillment endpoint every five
                minutes.
              </p>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
              <p className="font-bold text-amber-900">
                Important
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Increasing the exchange rate raises
                the PHP checkout amount for new
                customers. Confirm the value carefully
                before saving.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}