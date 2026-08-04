"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

type CustomerOrder = {
  id: string;
  referenceNumber: string;
  packageCode: string;
  planName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellingPriceUsd: number;
  amountPhpCentavos: number;
  usdToPhpRate: number;
  currency: string;
  status: string;
  paymentStatus: string;
  esimStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  iccid: string | null;
  esimOrderId: string | null;
  supplierEsimStatus: string | null;
  completedAt: string | null;
  createdAt: string;
};

type CustomerDetails = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;

  stats: {
    totalOrders: number;
    paidOrders: number;
    deliveredOrders: number;
    totalSpentCentavos: number;
    averageOrderCentavos: number;
  };

  orders: CustomerOrder[];
};

type CustomerResponse = {
  success: boolean;
  error?: string;
  customer?: CustomerDetails;
};

function formatMoney(
  amountCentavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    },
  ).format(
    amountCentavos / 100,
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function getStatusClass(
  status: string,
) {
  switch (status) {
    case "PAID":
    case "COMPLETED":
    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PROCESSING":
    case "ISSUED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function AdminCustomerDetailsPage() {
  const params = useParams<{
    id: string;
  }>();

  const customerId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [
    customer,
    setCustomer,
  ] = useState<CustomerDetails | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadCustomer =
    useCallback(async () => {
      const adminKey =
        localStorage.getItem(
          "adminKey",
        ) ?? "";

      if (!adminKey) {
        setLoading(false);

        setError(
          "Open the Admin Dashboard, enter your admin key, and load the settings first.",
        );

        return;
      }

      if (!customerId) {
        setLoading(false);

        setError(
          "Missing customer ID.",
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/admin/customers/${encodeURIComponent(
              customerId,
            )}`,
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
          (await response.json()) as CustomerResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.customer
        ) {
          throw new Error(
            data.error ||
              "Unable to load customer details.",
          );
        }

        setCustomer(
          data.customer,
        );
      } catch (
        loadError
      ) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load customer details.",
        );
      } finally {
        setLoading(false);
      }
    }, [customerId]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="h-64 animate-pulse rounded-[2rem] bg-slate-200" />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[1.6rem] bg-slate-200"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin/customers"
            className="font-black text-blue-700 hover:underline"
          >
            ← Back to Customers
          </Link>

          <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-8">
            <h1 className="text-2xl font-black text-red-950">
              Unable to load customer
            </h1>

            <p className="mt-3 leading-7 text-red-800">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadCustomer()
              }
              className="mt-6 rounded-2xl bg-red-700 px-6 py-3 font-black text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const statCards = [
    {
      label: "Total Orders",
      value:
        customer.stats.totalOrders,
    },
    {
      label: "Paid Orders",
      value:
        customer.stats.paidOrders,
    },
    {
      label: "Delivered eSIMs",
      value:
        customer.stats.deliveredOrders,
    },
    {
      label: "Lifetime Spending",
      value: formatMoney(
        customer.stats
          .totalSpentCentavos,
      ),
    },
    {
      label: "Average Order",
      value: formatMoney(
        customer.stats
          .averageOrderCentavos,
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/customers"
          className="font-black text-blue-700 hover:underline"
        >
          ← Back to Customers
        </Link>

        <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Customer Profile
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            {customer.name}
          </h1>

          <div className="mt-6 grid gap-4 text-blue-100 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                Email
              </p>

              <p className="mt-2 break-all font-semibold text-white">
                {customer.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                Phone
              </p>

              <p className="mt-2 font-semibold text-white">
                {customer.phone ||
                  "No phone number"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                Joined
              </p>

              <p className="mt-2 font-semibold text-white">
                {formatDate(
                  customer.createdAt,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-300">
                Email Status
              </p>

              <p className="mt-2 font-semibold text-white">
                {customer.emailVerified
                  ? "Verified"
                  : "Not verified"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map(
            (card) => (
              <article
                key={card.label}
                className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                  {card.label}
                </p>

                <p className="mt-3 text-3xl font-black text-slate-950">
                  {card.value}
                </p>
              </article>
            ),
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Purchase History
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Customer Orders
            </h2>
          </div>

          {customer.orders.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-4xl">
                📦
              </p>

              <h3 className="mt-4 text-xl font-black text-slate-950">
                No orders yet
              </h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Plan
                    </th>

                    <th className="px-6 py-4">
                      Amount
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>

                    <th className="px-6 py-4">
                      eSIM
                    </th>

                    <th className="px-6 py-4">
                      ICCID
                    </th>

                    <th className="px-6 py-4">
                      Purchased
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customer.orders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="border-t border-slate-100 align-top transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-950">
                            {
                              order.referenceNumber
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              order.status
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-950">
                            {
                              order.planName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              order.packageCode
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5 font-black text-slate-950">
                          {formatMoney(
                            order.amountPhpCentavos,
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              order.paymentStatus,
                            )}`}
                          >
                            {
                              order.paymentStatus
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              order.esimStatus,
                            )}`}
                          >
                            {
                              order.esimStatus
                            }
                          </span>
                        </td>

                        <td className="px-6 py-5 font-mono text-xs text-slate-600">
                          {order.iccid ||
                            "—"}
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                          {formatDate(
                            order.createdAt,
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/orders?search=${encodeURIComponent(
                              order.referenceNumber,
                            )}`}
                            className="inline-flex rounded-xl bg-[#0A2D62] px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
                          >
                            Open Order
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}