"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Settings = {
  id: string;
  usdToPhpRate: number;
  defaultMarkupPercent: number;
  referralRewardPhp: number;
  referredRewardPhp: number;
  minimumReferralDataBytes: string;
  minimumReferralDataGb: number;
  maximumWalletUsagePercent: number;
  walletTopupEnabled: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  defaultApn: string;
  updatedAt: string;
};

type SettingsResponse = {
  success: boolean;
  error?: string;
  message?: string;
  settings?: Settings;
};

type FormState = {
  usdToPhpRate: string;
  defaultMarkupPercent: string;
  referralRewardPhp: string;
  referredRewardPhp: string;
  minimumReferralDataGb: string;
  maximumWalletUsagePercent: string;
  walletTopupEnabled: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  defaultApn: string;
};

const EMPTY_FORM: FormState = {
  usdToPhpRate: "58",
  defaultMarkupPercent: "20",
  referralRewardPhp: "50",
  referredRewardPhp: "50",
  minimumReferralDataGb: "10",
  maximumWalletUsagePercent:
    "100",
  walletTopupEnabled: false,
  maintenanceMode: false,
  supportEmail:
    "support@seamarinoesim.com",
  defaultApn: "internet",
};

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Never";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Never";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default function AdminSettingsClient() {
  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      EMPTY_FORM,
    );

  const [
    updatedAt,
    setUpdatedAt,
  ] = useState<string | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "adminKey",
      );

    if (saved) {
      setAdminKey(saved);
    }
  }, []);

  function applySettings(
    settings: Settings,
  ) {
    setForm({
      usdToPhpRate:
        String(
          settings.usdToPhpRate,
        ),

      defaultMarkupPercent:
        String(
          settings.defaultMarkupPercent,
        ),

      referralRewardPhp:
        String(
          settings.referralRewardPhp,
        ),

      referredRewardPhp:
        String(
          settings.referredRewardPhp,
        ),

      minimumReferralDataGb:
        String(
          settings.minimumReferralDataGb,
        ),

      maximumWalletUsagePercent:
        String(
          settings.maximumWalletUsagePercent,
        ),

      walletTopupEnabled:
        settings.walletTopupEnabled,

      maintenanceMode:
        settings.maintenanceMode,

      supportEmail:
        settings.supportEmail,

      defaultApn:
        settings.defaultApn,
    });

    setUpdatedAt(
      settings.updatedAt,
    );
  }

  async function loadSettings() {
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

      window.localStorage.setItem(
        "adminKey",
        adminKey.trim(),
      );

      const response =
        await fetch(
          "/api/admin/settings",
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
        (await response.json()) as
          SettingsResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.settings
      ) {
        throw new Error(
          data.error ||
            "Unable to load settings.",
        );
      }

      applySettings(
        data.settings,
      );

      setMessage(
        "System settings loaded.",
      );
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

  async function saveSettings(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!adminKey.trim()) {
      setError(
        "Enter your admin key.",
      );
      return;
    }

    const confirmed =
      form.maintenanceMode
        ? window.confirm(
            "Maintenance mode is enabled. Save these settings?",
          )
        : true;

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/admin/settings",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              "x-admin-key":
                adminKey.trim(),
            },

            body:
              JSON.stringify({
                usdToPhpRate:
                  form.usdToPhpRate,

                defaultMarkupPercent:
                  form.defaultMarkupPercent,

                referralRewardPhp:
                  form.referralRewardPhp,

                referredRewardPhp:
                  form.referredRewardPhp,

                minimumReferralDataGb:
                  form.minimumReferralDataGb,

                maximumWalletUsagePercent:
                  Number(
                    form.maximumWalletUsagePercent,
                  ),

                walletTopupEnabled:
                  form.walletTopupEnabled,

                maintenanceMode:
                  form.maintenanceMode,

                supportEmail:
                  form.supportEmail,

                defaultApn:
                  form.defaultApn,
              }),
          },
        );

      const data =
        (await response.json()) as
          SettingsResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.settings
      ) {
        throw new Error(
          data.error ||
            "Unable to save settings.",
        );
      }

      applySettings(
        data.settings,
      );

      setMessage(
        data.message ||
          "System settings saved.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            System Settings
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Manage pricing, referral
            rewards, wallet rules,
            customer support details, and
            storefront availability.
          </p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Admin Key
              </span>

              <input
                type="password"
                value={adminKey}
                onChange={(event) =>
                  setAdminKey(
                    event.target.value,
                  )
                }
                placeholder="Enter admin key"
                autoComplete="current-password"
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                void loadSettings()
              }
              disabled={loading}
              className="min-h-14 self-end rounded-2xl bg-[#0A2D62] px-8 font-black text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Load Settings"}
            </button>
          </div>

          {updatedAt && (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Last updated:{" "}
              {formatDate(
                updatedAt,
              )}
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
              {message}
            </div>
          )}
        </section>

        <form
          onSubmit={
            saveSettings
          }
          className="mt-8 space-y-8"
        >
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Pricing
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Store pricing rules
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block font-black text-slate-800">
                  USD to PHP Rate
                </span>

                <input
                  type="number"
                  min="0.01"
                  max="500"
                  step="0.01"
                  value={
                    form.usdToPhpRate
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        usdToPhpRate:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Default Markup (%)
                </span>

                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.01"
                  value={
                    form.defaultMarkupPercent
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        defaultMarkupPercent:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600">
              Referral Program
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Reward qualification
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Referrer Reward (PHP)
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.referralRewardPhp
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        referralRewardPhp:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Referred Reward (PHP)
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.referredRewardPhp
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        referredRewardPhp:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Minimum Data (GB)
                </span>

                <input
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  value={
                    form.minimumReferralDataGb
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        minimumReferralDataGb:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-600">
              Wallet
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Store-credit controls
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Maximum Wallet Usage (%)
                </span>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    form.maximumWalletUsagePercent
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        maximumWalletUsagePercent:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
                <input
                  type="checkbox"
                  checked={
                    form.walletTopupEnabled
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        walletTopupEnabled:
                          event.target.checked,
                      }),
                    )
                  }
                  className="h-5 w-5 accent-emerald-700"
                />

                <span>
                  <strong className="block text-slate-950">
                    Wallet Top-up
                  </strong>

                  <span className="mt-1 block text-sm text-slate-500">
                    Allow customers to add
                    paid wallet credit.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-600">
              Store Operations
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Support and availability
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Support Email
                </span>

                <input
                  type="email"
                  value={
                    form.supportEmail
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        supportEmail:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label>
                <span className="mb-2 block font-black text-slate-800">
                  Default APN
                </span>

                <input
                  value={
                    form.defaultApn
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        defaultApn:
                          event.target.value,
                      }),
                    )
                  }
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-5 md:col-span-2">
                <input
                  type="checkbox"
                  checked={
                    form.maintenanceMode
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        maintenanceMode:
                          event.target.checked,
                      }),
                    )
                  }
                  className="h-5 w-5 accent-red-700"
                />

                <span>
                  <strong className="block text-red-800">
                    Maintenance Mode
                  </strong>

                  <span className="mt-1 block text-sm text-red-600">
                    Mark the storefront as
                    temporarily unavailable.
                    Enforcement must also be
                    connected to your
                    storefront middleware or
                    layout.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[#0A2D62] px-8 py-4 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Settings..."
                : "Save System Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}