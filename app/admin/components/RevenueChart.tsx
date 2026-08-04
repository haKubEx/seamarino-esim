"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type RevenuePoint = {
  date: string;
  dateKey: string;
  revenueCentavos: number;
  orderCount: number;
};

type DashboardResponse = {
  success: boolean;
  error?: string;
  revenueChart?: RevenuePoint[];
};

function formatCurrency(
  centavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    },
  ).format(
    centavos / 100,
  );
}

function formatCompactCurrency(
  centavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      notation: "compact",
      maximumFractionDigits: 1,
    },
  ).format(
    centavos / 100,
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(value),
  );
}

export default function RevenueChart() {
  const [
    points,
    setPoints,
  ] = useState<RevenuePoint[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadChart =
    useCallback(async () => {
      const adminKey =
        localStorage.getItem(
          "adminKey",
        ) ?? "";

      if (!adminKey) {
        setLoading(false);

        setError(
          "Enter your admin key and load the current settings first.",
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
                "x-admin-key":
                  adminKey,
              },

              cache:
                "no-store",
            },
          );

        const data =
          (await response.json()) as DashboardResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Unable to load revenue data.",
          );
        }

        setPoints(
          data.revenueChart ??
            [],
        );

        setError("");
      } catch (
        chartError
      ) {
        setError(
          chartError instanceof
            Error
            ? chartError.message
            : "Unable to load revenue data.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadChart();

    const timer =
      window.setInterval(
        () => {
          void loadChart();
        },
        10000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [loadChart]);

  const totalRevenueCentavos =
    useMemo(
      () =>
        points.reduce(
          (
            total,
            point,
          ) =>
            total +
            point.revenueCentavos,
          0,
        ),
      [points],
    );

  const totalOrders =
    useMemo(
      () =>
        points.reduce(
          (
            total,
            point,
          ) =>
            total +
            point.orderCount,
          0,
        ),
      [points],
    );

  const maximumRevenue =
    useMemo(
      () =>
        Math.max(
          ...points.map(
            (point) =>
              point.revenueCentavos,
          ),
          1,
        ),
      [points],
    );

  if (loading) {
    return (
      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />

        <div className="mt-8 h-72 animate-pulse rounded-3xl bg-slate-100" />
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Sales Analytics
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Revenue — Last 30 Days
          </h2>

          <p className="mt-3 text-slate-600">
            Paid order revenue grouped
            by payment date.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadChart();
          }}
          className="rounded-2xl border-2 border-[#0A2D62] bg-white px-5 py-3 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
        >
          Refresh Chart
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-800">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">
                30-Day Revenue
              </p>

              <p className="mt-2 text-3xl font-black text-emerald-950">
                {formatCurrency(
                  totalRevenueCentavos,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">
                Paid Orders
              </p>

              <p className="mt-2 text-3xl font-black text-blue-950">
                {totalOrders}
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="flex h-72 items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-5 pb-5 pt-8">
                {points.map(
                  (
                    point,
                    index,
                  ) => {
                    const height =
                      point.revenueCentavos >
                      0
                        ? Math.max(
                            8,
                            (point.revenueCentavos /
                              maximumRevenue) *
                              100,
                          )
                        : 2;

                    const showLabel =
                      index === 0 ||
                      index ===
                        points.length -
                          1 ||
                      index % 5 === 0;

                    return (
                      <div
                        key={
                          point.dateKey
                        }
                        className="group flex min-w-0 flex-1 flex-col items-center justify-end"
                      >
                        <div className="relative flex h-52 w-full items-end justify-center">
                          <div
                            title={`${formatDate(
                              point.date,
                            )}: ${formatCurrency(
                              point.revenueCentavos,
                            )} from ${
                              point.orderCount
                            } order(s)`}
                            className="w-full max-w-6 rounded-t-lg bg-[#0A2D62] transition hover:bg-blue-600"
                            style={{
                              height: `${height}%`,
                            }}
                          />

                          <div className="pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-xl group-hover:block">
                            {formatCompactCurrency(
                              point.revenueCentavos,
                            )}
                            {" · "}
                            {
                              point.orderCount
                            }{" "}
                            order
                            {point.orderCount ===
                            1
                              ? ""
                              : "s"}
                          </div>
                        </div>

                        <p className="mt-3 h-5 text-[10px] font-bold text-slate-500">
                          {showLabel
                            ? formatDate(
                                point.date,
                              )
                            : ""}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          {totalOrders === 0 && (
            <p className="mt-5 text-center text-sm text-slate-500">
              No paid orders were
              recorded during the last
              30 days.
            </p>
          )}
        </>
      )}
    </section>
  );
}