"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Order = {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  packageCode: string;
  status: string;
  paymentStatus: string;
  esimStatus: string;
  amountPhpCentavos: number;
  createdAt: string;
};

type DashboardResponse = {
  success: boolean;
  error?: string;
  recentOrders?: Order[];
};

function formatMoney(
  amountPhpCentavos: number,
): string {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(
      amountPhpCentavos,
    ) / 100,
  );
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        "Asia/Manila",
    },
  ).format(date);
}

function getStatusClasses(
  status: string,
): string {
  switch (
    status
      .trim()
      .toUpperCase()
  ) {
    case "PAID":
    case "COMPLETED":
    case "DELIVERED":
    case "ISSUED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PROCESSING":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PENDING":
    case "NOT_ORDERED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "FAILED":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "REFUNDED":
      return "border-violet-200 bg-violet-50 text-violet-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function StatusBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
        value,
      )}`}
    >
      {label}: {value}
    </span>
  );
}

export default function RecentOrders() {
  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadOrders =
    useCallback(async () => {
      const adminKey =
        localStorage.getItem(
          "adminKey",
        ) ?? "";

      if (!adminKey) {
        setOrders([]);
        setLoading(false);

        setError(
          "Enter your admin key and load the dashboard settings first.",
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
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Unable to load recent orders.",
          );
        }

        setOrders(
          data.recentOrders ??
            [],
        );

        setError("");
      } catch (
        caughtError
      ) {
        setOrders([]);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Unable to load recent orders.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadOrders();

    const timer =
      window.setInterval(
        () => {
          void loadOrders();
        },
        10_000,
      );

    function handleAdminKeyUpdate() {
      setLoading(true);

      void loadOrders();
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
        timer,
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
  }, [loadOrders]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Live Activity
            </p>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              Live
            </span>
          </div>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Recent Orders
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Automatically refreshed every 10 seconds.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setLoading(true);

              void loadOrders();
            }}
            disabled={loading}
            className="rounded-2xl border-2 border-[#0A2D62] bg-white px-5 py-3 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            href="/admin/orders"
            className="rounded-2xl bg-[#0A2D62] px-5 py-3 font-black text-white transition hover:bg-blue-800"
          >
            View All
          </Link>
        </div>
      </div>

      {error && (
        <div className="m-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-800">
          {error}
        </div>
      )}

      {loading &&
      orders.length === 0 ? (
        <div className="space-y-3 p-6 sm:p-8">
          {Array.from({
            length: 5,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-slate-100"
              />
            ),
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <th className="px-6 py-4">
                  Reference
                </th>

                <th className="px-6 py-4">
                  Customer
                </th>

                <th className="px-6 py-4">
                  Plan
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Amount
                </th>

                <th className="px-6 py-4">
                  Created
                </th>

                <th className="px-6 py-4 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map(
                (order) => (
                  <tr
                    key={
                      order.id
                    }
                    className="border-b border-slate-100 align-top transition hover:bg-blue-50/40"
                  >
                    <td className="px-6 py-5">
                      <p className="max-w-[210px] break-all font-mono text-xs font-black text-blue-700">
                        {
                          order.referenceNumber
                        }
                      </p>

                      <p className="mt-2 font-mono text-xs font-semibold text-slate-400">
                        {
                          order.packageCode
                        }
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700">
                          {order.customerName
                            .trim()
                            .charAt(
                              0,
                            )
                            .toUpperCase() ||
                            "C"}
                        </div>

                        <div className="min-w-0">
                          <p className="font-black text-slate-900">
                            {
                              order.customerName
                            }
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {
                              order.customerEmail
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[240px] font-bold text-slate-900">
                        {
                          order.planName
                        }
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex max-w-[260px] flex-wrap gap-2">
                        <StatusBadge
                          label="Payment"
                          value={
                            order.paymentStatus
                          }
                        />

                        <StatusBadge
                          label="Order"
                          value={
                            order.status
                          }
                        />

                        <StatusBadge
                          label="eSIM"
                          value={
                            order.esimStatus
                          }
                        />
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 font-black text-slate-950">
                      {formatMoney(
                        order.amountPhpCentavos,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-slate-600">
                      {formatDate(
                        order.createdAt,
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/orders?search=${encodeURIComponent(
                          order.referenceNumber,
                        )}`}
                        className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ),
              )}

              {!loading &&
                orders.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        7
                      }
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                        📦
                      </div>

                      <h3 className="mt-5 text-xl font-black text-slate-950">
                        No recent orders
                      </h3>

                      <p className="mt-2 text-slate-500">
                        New customer orders will appear here.
                      </p>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}