"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type DashboardStatsData = {
  todayRevenueCentavos: number;
  monthRevenueCentavos: number;
  todayOrders: number;
  monthPaidOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  failedOrders: number;
  deliveredEsims: number;
  totalCustomers: number;
  deliverySuccessRate: number;
  averageFulfillmentSeconds: number;
};

type DashboardResponse = {
  success: boolean;
  error?: string;
  stats?: DashboardStatsData;
};

type CardDefinition = {
  key: keyof DashboardStatsData;
  title: string;
  icon: string;
  color: string;
  format:
    | "money"
    | "number"
    | "percentage"
    | "duration";
};

const cards:
  CardDefinition[] = [
    {
      key:
        "todayRevenueCentavos",
      title:
        "Today's Revenue",
      icon: "💰",
      color:
        "from-emerald-500 to-green-600",
      format: "money",
    },
    {
      key:
        "monthRevenueCentavos",
      title:
        "Month Revenue",
      icon: "📈",
      color:
        "from-teal-500 to-emerald-700",
      format: "money",
    },
    {
      key:
        "todayOrders",
      title:
        "Paid Today",
      icon: "🛒",
      color:
        "from-blue-500 to-blue-700",
      format: "number",
    },
    {
      key:
        "monthPaidOrders",
      title:
        "Paid This Month",
      icon: "💳",
      color:
        "from-indigo-500 to-indigo-700",
      format: "number",
    },
    {
      key:
        "pendingOrders",
      title:
        "Pending Orders",
      icon: "⏳",
      color:
        "from-amber-500 to-orange-500",
      format: "number",
    },
    {
      key:
        "processingOrders",
      title:
        "Processing",
      icon: "⚙️",
      color:
        "from-sky-500 to-blue-600",
      format: "number",
    },
    {
      key:
        "completedOrders",
      title:
        "Completed",
      icon: "✅",
      color:
        "from-violet-500 to-purple-700",
      format: "number",
    },
    {
      key:
        "failedOrders",
      title:
        "Failed",
      icon: "❌",
      color:
        "from-red-500 to-rose-700",
      format: "number",
    },
    {
      key:
        "deliveredEsims",
      title:
        "Delivered eSIMs",
      icon: "📲",
      color:
        "from-cyan-500 to-sky-600",
      format: "number",
    },
    {
      key:
        "totalCustomers",
      title:
        "Customers",
      icon: "👥",
      color:
        "from-pink-500 to-rose-600",
      format: "number",
    },
    {
      key:
        "deliverySuccessRate",
      title:
        "Delivery Success",
      icon: "🎯",
      color:
        "from-lime-500 to-green-700",
      format:
        "percentage",
    },
    {
      key:
        "averageFulfillmentSeconds",
      title:
        "Average Fulfillment",
      icon: "⚡",
      color:
        "from-slate-600 to-slate-800",
      format:
        "duration",
    },
  ];

function formatMoney(
  centavos: number,
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    },
  ).format(
    Number(centavos) / 100,
  );
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-PH",
  ).format(
    Number(value),
  );
}

function formatDuration(
  seconds: number,
): string {
  const normalizedSeconds =
    Math.max(
      0,
      Math.round(
        Number(seconds),
      ),
    );

  if (
    normalizedSeconds <
    60
  ) {
    return `${normalizedSeconds}s`;
  }

  const minutes =
    Math.floor(
      normalizedSeconds /
        60,
    );

  const remainingSeconds =
    normalizedSeconds %
    60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remainingMinutes =
    minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

function formatCardValue(
  value: number,
  format:
    CardDefinition["format"],
): string {
  switch (format) {
    case "money":
      return formatMoney(
        value,
      );

    case "percentage":
      return `${Number(
        value,
      ).toFixed(1)}%`;

    case "duration":
      return formatDuration(
        value,
      );

    case "number":
    default:
      return formatNumber(
        value,
      );
  }
}

export default function DashboardStats() {
  const [
    stats,
    setStats,
  ] = useState<
    DashboardStatsData | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadDashboard =
    useCallback(async () => {
      const adminKey =
        localStorage.getItem(
          "adminKey",
        ) ?? "";

      if (!adminKey) {
        setStats(null);
        setLoading(false);

        setError(
          "Enter your admin key and load the current settings to view dashboard statistics.",
        );

        return;
      }

      try {
        const response =
          await fetch(
            "/api/admin/dashboard",
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                "x-admin-key":
                  adminKey,
              },

              cache:
                "no-store",
            },
          );

        const data =
          (await response.json()) as
            DashboardResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.stats
        ) {
          throw new Error(
            data.error ||
              "Unable to load dashboard statistics.",
          );
        }

        setStats(
          data.stats,
        );

        setError("");
      } catch (
        caughtError
      ) {
        setStats(null);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Unable to load dashboard statistics.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadDashboard();

    const interval =
      window.setInterval(
        () => {
          void loadDashboard();
        },
        10_000,
      );

    function handleAdminKeyUpdate() {
      setLoading(true);

      void loadDashboard();
    }

    window.addEventListener(
      "admin-key-updated",
      handleAdminKeyUpdate,
    );

    window.addEventListener(
      "storage",
      handleAdminKeyUpdate,
    );

    return () => {
      window.clearInterval(
        interval,
      );

      window.removeEventListener(
        "admin-key-updated",
        handleAdminKeyUpdate,
      );

      window.removeEventListener(
        "storage",
        handleAdminKeyUpdate,
      );
    };
  }, [loadDashboard]);

  if (
    loading &&
    !stats
  ) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: 12,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl bg-slate-200"
            />
          ),
        )}
      </div>
    );
  }

  if (
    error &&
    !stats
  ) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="font-black text-amber-950">
          Dashboard statistics unavailable
        </p>

        <p className="mt-2 leading-7 text-amber-800">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            setLoading(true);

            void loadDashboard();
          }}
          className="mt-5 rounded-2xl bg-amber-700 px-5 py-3 font-black text-white transition hover:bg-amber-800"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Business Overview
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Live Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />

            Live
          </span>

          <button
            type="button"
            onClick={() => {
              setLoading(true);

              void loadDashboard();
            }}
            disabled={loading}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(
          (card) => {
            const value =
              Number(
                stats[
                  card.key
                ],
              );

            return (
              <article
                key={
                  card.key
                }
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.color} p-6 text-white shadow-xl`}
              >
                <div
                  className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10"
                  aria-hidden="true"
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/80">
                      {card.title}
                    </p>

                    <p className="mt-4 break-words text-3xl font-black sm:text-4xl">
                      {formatCardValue(
                        Number.isFinite(
                          value,
                        )
                          ? value
                          : 0,
                        card.format,
                      )}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner">
                    {card.icon}
                  </div>
                </div>
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}