"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type ReportResponse = {
  success: boolean;
  error?: string;

  period?: {
    start: string;
    end: string;
    rangeDays: number;
    previousStart: string;
    previousEnd: string;
  };

  summary?: {
    grossRevenuePhpCentavos: number;
    refundedPhpCentavos: number;
    netRevenuePhpCentavos: number;
    paidOrders: number;
    completedSales: number;
    averageOrderValuePhpCentavos: number;
    couponDiscountsPhpCentavos: number;
    walletUsedPhpCentavos: number;
    referralRewardsIssuedPhpCentavos: number;
    referralRewardTransactions: number;

    changes: {
      grossRevenuePercent: number;
      netRevenuePercent: number;
      paidOrdersPercent: number;
      completedSalesPercent: number;
    };
  };

  dailyRevenue?: {
    date: string;
    grossRevenuePhpCentavos: number;
    refundedPhpCentavos: number;
    netRevenuePhpCentavos: number;
  }[];

  topPlans?: {
    packageCode: string;
    planName: string;
    orders: number;
    revenuePhpCentavos: number;
  }[];

  paymentMethods?: {
    paymentMethod: string;
    orders: number;
    revenuePhpCentavos: number;
  }[];

  orderRows?: {
    referenceNumber: string;
    planName: string;
    packageCode: string;
    customerEmail: string;
    amountPhpCentavos: number;
    discountPhpCentavos: number;
    storeCreditUsedPhpCentavos: number;
    paymentMethod: string | null;
    status: string;
    esimStatus: string;
    paidAt: string | null;
    completedAt: string | null;
  }[];
};

const EMPTY_SUMMARY = {
  grossRevenuePhpCentavos: 0,
  refundedPhpCentavos: 0,
  netRevenuePhpCentavos: 0,
  paidOrders: 0,
  completedSales: 0,
  averageOrderValuePhpCentavos: 0,
  couponDiscountsPhpCentavos: 0,
  walletUsedPhpCentavos: 0,
  referralRewardsIssuedPhpCentavos: 0,
  referralRewardTransactions: 0,

  changes: {
    grossRevenuePercent: 0,
    netRevenuePercent: 0,
    paidOrdersPercent: 0,
    completedSalesPercent: 0,
  },
};

function formatMoney(
  centavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    centavos / 100,
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle:
        "medium",
    },
  ).format(
    new Date(value),
  );
}

function localDateInput(
  date: Date,
) {
  const offset =
    date.getTimezoneOffset() *
    60_000;

  return new Date(
    date.getTime() -
      offset,
  )
    .toISOString()
    .slice(0, 10);
}

function changeLabel(
  value: number,
) {
  const rounded =
    Math.round(
      value * 10,
    ) / 10;

  return `${
    rounded > 0
      ? "+"
      : ""
  }${rounded}%`;
}

function changeClass(
  value: number,
) {
  return value >= 0
    ? "text-emerald-700"
    : "text-red-700";
}

function escapeCsv(
  value: unknown,
) {
  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll(
    '"',
    '""',
  )}"`;
}

export default function AdminReportsClient() {
  const now =
    useMemo(
      () => new Date(),
      [],
    );

  const initialStart =
    useMemo(
      () =>
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() -
            29,
        ),
      [now],
    );

  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState(
    localDateInput(
      initialStart,
    ),
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    localDateInput(now),
  );

  const [
    summary,
    setSummary,
  ] = useState(
    EMPTY_SUMMARY,
  );

  const [
    dailyRevenue,
    setDailyRevenue,
  ] = useState<
    NonNullable<
      ReportResponse["dailyRevenue"]
    >
  >([]);

  const [
    topPlans,
    setTopPlans,
  ] = useState<
    NonNullable<
      ReportResponse["topPlans"]
    >
  >([]);

  const [
    paymentMethods,
    setPaymentMethods,
  ] = useState<
    NonNullable<
      ReportResponse["paymentMethods"]
    >
  >([]);

  const [
    orderRows,
    setOrderRows,
  ] = useState<
    NonNullable<
      ReportResponse["orderRows"]
    >
  >([]);

  const [
    periodLabel,
    setPeriodLabel,
  ] = useState("");

  const [
    loading,
    setLoading,
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

  async function loadReport(
    event?:
      FormEvent<HTMLFormElement>,
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

      window.localStorage.setItem(
        "adminKey",
        adminKey.trim(),
      );

      const params =
        new URLSearchParams({
          start:
            startDate,
          end:
            endDate,
        });

      const response =
        await fetch(
          `/api/admin/reports?${params.toString()}`,
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
          ReportResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load reports.",
        );
      }

      setSummary(
        data.summary ??
          EMPTY_SUMMARY,
      );

      setDailyRevenue(
        data.dailyRevenue ??
          [],
      );

      setTopPlans(
        data.topPlans ??
          [],
      );

      setPaymentMethods(
        data.paymentMethods ??
          [],
      );

      setOrderRows(
        data.orderRows ??
          [],
      );

      setPeriodLabel(
        data.period
          ? `${formatDate(
              data.period.start,
            )} – ${formatDate(
              data.period.end,
            )}`
          : "",
      );

      setMessage(
        "Sales report loaded successfully.",
      );
    } catch (loadError) {
      setSummary(
        EMPTY_SUMMARY,
      );
      setDailyRevenue([]);
      setTopPlans([]);
      setPaymentMethods([]);
      setOrderRows([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(
    days: number,
  ) {
    const end =
      new Date();

    const start =
      new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate() -
          (days - 1),
      );

    setStartDate(
      localDateInput(start),
    );

    setEndDate(
      localDateInput(end),
    );
  }

  function exportCsv() {
    if (
      orderRows.length === 0
    ) {
      setError(
        "Load a report with paid orders before exporting.",
      );
      return;
    }

    const headers = [
      "Reference",
      "Paid At",
      "Customer Email",
      "Plan",
      "Package Code",
      "Amount PHP",
      "Coupon Discount PHP",
      "Wallet Used PHP",
      "Payment Method",
      "Order Status",
      "eSIM Status",
    ];

    const rows =
      orderRows.map(
        (order) => [
          order.referenceNumber,
          order.paidAt ??
            "",
          order.customerEmail,
          order.planName,
          order.packageCode,
          (
            order.amountPhpCentavos /
            100
          ).toFixed(2),
          (
            order.discountPhpCentavos /
            100
          ).toFixed(2),
          (
            order.storeCreditUsedPhpCentavos /
            100
          ).toFixed(2),
          order.paymentMethod ??
            "",
          order.status,
          order.esimStatus,
        ],
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCsv)
          .join(","),
      )
      .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        "a",
      );

    anchor.href = url;
    anchor.download =
      `seamarino-sales-${startDate}-to-${endDate}.csv`;

    anchor.click();

    URL.revokeObjectURL(
      url,
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Sales Reports
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Track paid revenue,
            fulfillment, refunds,
            discounts, wallet usage, and
            referral reward costs.
          </p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            onSubmit={
              loadReport
            }
            className="grid gap-4 lg:grid-cols-3"
          >
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
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Start Date
              </span>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                End Date
              </span>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="flex flex-wrap gap-3 lg:col-span-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset(7)
                }
                className="rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 font-black text-slate-700"
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(30)
                }
                className="rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 font-black text-slate-700"
              >
                Last 30 Days
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(90)
                }
                className="rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 font-black text-slate-700"
              >
                Last 90 Days
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="min-h-14 flex-1 rounded-2xl bg-[#0A2D62] px-6 font-black text-white disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Load Report"}
              </button>

              <button
                type="button"
                onClick={
                  exportCsv
                }
                className="min-h-14 rounded-2xl bg-emerald-700 px-5 font-black text-white"
              >
                Export CSV
              </button>
            </div>
          </form>

          {periodLabel && (
            <p className="mt-5 font-bold text-slate-600">
              Reporting period:{" "}
              {periodLabel}
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

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                "Gross Revenue",
              value:
                formatMoney(
                  summary.grossRevenuePhpCentavos,
                ),
              change:
                summary.changes
                  .grossRevenuePercent,
            },
            {
              label:
                "Net Revenue",
              value:
                formatMoney(
                  summary.netRevenuePhpCentavos,
                ),
              change:
                summary.changes
                  .netRevenuePercent,
            },
            {
              label:
                "Paid Orders",
              value:
                String(
                  summary.paidOrders,
                ),
              change:
                summary.changes
                  .paidOrdersPercent,
            },
            {
              label:
                "Completed Sales",
              value:
                String(
                  summary.completedSales,
                ),
              change:
                summary.changes
                  .completedSalesPercent,
            },
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {card.label}
              </p>

              <p className="mt-3 text-3xl font-black text-slate-950">
                {card.value}
              </p>

              <p
                className={`mt-2 text-sm font-black ${changeClass(
                  card.change,
                )}`}
              >
                {changeLabel(
                  card.change,
                )}{" "}
                vs previous period
              </p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label:
                "Refunded",
              value:
                formatMoney(
                  summary.refundedPhpCentavos,
                ),
            },
            {
              label:
                "Average Order Value",
              value:
                formatMoney(
                  summary.averageOrderValuePhpCentavos,
                ),
            },
            {
              label:
                "Coupon Discounts",
              value:
                formatMoney(
                  summary.couponDiscountsPhpCentavos,
                ),
            },
            {
              label:
                "Wallet Credit Used",
              value:
                formatMoney(
                  summary.walletUsedPhpCentavos,
                ),
            },
            {
              label:
                "Referral Rewards",
              value:
                formatMoney(
                  summary.referralRewardsIssuedPhpCentavos,
                ),
            },
            {
              label:
                "Reward Transactions",
              value:
                String(
                  summary.referralRewardTransactions,
                ),
            },
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {card.label}
              </p>

              <p className="mt-3 text-2xl font-black text-slate-950">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Daily Revenue
            </h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="pb-3">
                      Date
                    </th>
                    <th className="pb-3">
                      Gross
                    </th>
                    <th className="pb-3">
                      Refunds
                    </th>
                    <th className="pb-3">
                      Net
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dailyRevenue.map(
                    (day) => (
                      <tr
                        key={
                          day.date
                        }
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 font-bold text-slate-700">
                          {
                            day.date
                          }
                        </td>

                        <td className="py-3 font-bold text-slate-900">
                          {formatMoney(
                            day.grossRevenuePhpCentavos,
                          )}
                        </td>

                        <td className="py-3 font-bold text-red-700">
                          {formatMoney(
                            day.refundedPhpCentavos,
                          )}
                        </td>

                        <td className="py-3 font-black text-emerald-700">
                          {formatMoney(
                            day.netRevenuePhpCentavos,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Top-Selling Plans
            </h2>

            <div className="mt-6 space-y-4">
              {topPlans.length ===
              0 ? (
                <p className="text-slate-500">
                  No paid plan sales in
                  this period.
                </p>
              ) : (
                topPlans.map(
                  (
                    plan,
                    index,
                  ) => (
                    <div
                      key={`${plan.packageCode}-${plan.planName}`}
                      className="rounded-2xl bg-slate-50 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-slate-950">
                            {index +
                              1}
                            .{" "}
                            {
                              plan.planName
                            }
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {
                              plan.packageCode
                            }
                          </p>
                        </div>

                        <p className="font-black text-emerald-700">
                          {formatMoney(
                            plan.revenuePhpCentavos,
                          )}
                        </p>
                      </div>

                      <p className="mt-3 text-sm text-slate-600">
                        {
                          plan.orders
                        }{" "}
                        paid order
                        {plan.orders ===
                        1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  ),
                )
              )}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">
            Payment Methods
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paymentMethods.map(
              (method) => (
                <article
                  key={
                    method.paymentMethod
                  }
                  className="rounded-2xl bg-slate-50 p-5"
                >
                  <p className="font-black text-slate-950">
                    {
                      method.paymentMethod
                    }
                  </p>

                  <p className="mt-2 text-2xl font-black text-emerald-700">
                    {formatMoney(
                      method.revenuePhpCentavos,
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      method.orders
                    }{" "}
                    paid order
                    {method.orders ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}