"use client";

import {
  FormEvent,
  useState,
} from "react";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type EsimStatus =
  | "NOT_ORDERED"
  | "PROCESSING"
  | "ISSUED"
  | "DELIVERED"
  | "FAILED";

type AdminOrder = {
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

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  esimStatus: EsimStatus;

  paymentMethod: string | null;
  paidAt: string | null;

  esimOrderId: string | null;
  esimTranNo: string | null;
  iccid: string | null;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
  smdpStatus: string | null;
  supplierEsimStatus: string | null;
  apn: string | null;

  emailSent: boolean;
  emailSentAt: string | null;
  emailAttempts: number;

  processingAttempts: number;
  profileCheckAttempts: number;

  lastError: string | null;

  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

type OrdersResponse = {
  success: boolean;
  orders?: AdminOrder[];

  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  error?: string;
};

const STATUS_OPTIONS = [
  "",
  "PENDING",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
];

function formatPhp(centavos: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(centavos / 100);
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(
  dateValue: string | null,
) {
  if (!dateValue) {
    return "—";
  }

  return new Date(
    dateValue,
  ).toLocaleString("en-PH");
}

function getStatusClasses(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
    case "DELIVERED":
    case "PAID":
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

function StatusBadge({
  value,
}: {
  value: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
        value,
      )}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-all font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [adminKey, setAdminKey] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState<AdminOrder | null>(
    null,
  );

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadOrders(
    requestedPage = 1,
  ) {
    if (!adminKey.trim()) {
      setError(
        "Enter your admin key.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams({
          page:
            requestedPage.toString(),
          pageSize: "20",
        });

      if (search.trim()) {
        params.set(
          "search",
          search.trim(),
        );
      }

      if (status) {
        params.set(
          "status",
          status,
        );
      }

      const response =
        await fetch(
          `/api/admin/orders?${params.toString()}`,
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
        (await response.json()) as OrdersResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load orders.",
        );
      }

      setOrders(
        data.orders ?? [],
      );

      setPage(
        data.pagination?.page ??
          requestedPage,
      );

      setTotal(
        data.pagination?.total ??
          0,
      );

      setTotalPages(
        data.pagination
          ?.totalPages ?? 1,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void loadOrders(1);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-5 rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
              Seamarino Administration
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Orders Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-blue-100">
              Monitor customer
              payments, eSIM
              fulfillment, and email
              delivery.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-white/30 px-5 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Exchange Rate
            </a>

            <a
              href="/"
              className="rounded-xl bg-white px-5 py-3 font-bold text-[#0A2D62]"
            >
              Storefront
            </a>
          </div>
        </section>

        <form
          onSubmit={submitSearch}
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 lg:grid-cols-[280px_1fr_220px_auto]">
            <input
              type="password"
              value={adminKey}
              onChange={(event) =>
                setAdminKey(
                  event.target.value,
                )
              }
              placeholder="Enter ADMIN_API_KEY"
              autoComplete="current-password"
              className="h-14 rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search reference, customer, email, phone, or plan"
              className="h-14 rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
              className="h-14 rounded-2xl border border-slate-300 bg-white px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option || "ALL"
                    }
                    value={option}
                  >
                    {option ||
                      "All statuses"}
                  </option>
                ),
              )}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-2xl bg-[#0A2D62] px-7 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Load Orders"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Matching orders
            </p>

            <p className="mt-2 text-4xl font-black text-[#0A2D62]">
              {total}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Current page
            </p>

            <p className="mt-2 text-4xl font-black text-[#0A2D62]">
              {page}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Total pages
            </p>

            <p className="mt-2 text-4xl font-black text-[#0A2D62]">
              {totalPages}
            </p>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">
                    Order
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Plan
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Order status
                  </th>

                  <th className="px-5 py-4">
                    Payment
                  </th>

                  <th className="px-5 py-4">
                    eSIM
                  </th>

                  <th className="px-5 py-4">
                    Email
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-5">
                        <p className="max-w-[190px] break-all text-sm font-black text-slate-900">
                          {
                            order.referenceNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            order.createdAt,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold text-slate-900">
                          {
                            order.customerName
                          }
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-500">
                          {
                            order.customerEmail
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            order.customerPhone
                          }
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold text-slate-900">
                          {
                            order.planName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            order.packageCode
                          }
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-black text-slate-900">
                          {formatPhp(
                            order.amountPhpCentavos,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatUsd(
                            order.sellingPriceUsd,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge
                          value={
                            order.status
                          }
                        />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge
                          value={
                            order.paymentStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge
                          value={
                            order.esimStatus
                          }
                        />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge
                          value={
                            order.emailSent
                              ? "DELIVERED"
                              : "PENDING"
                          }
                        />
                      </td>

                      <td className="px-5 py-5">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              order,
                            )
                          }
                          className="rounded-xl border border-[#0A2D62] px-4 py-2 text-sm font-black text-[#0A2D62] transition hover:bg-blue-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}

                {!loading &&
                  orders.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        No orders loaded.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 p-5">
            <button
              type="button"
              disabled={
                loading ||
                page <= 1
              }
              onClick={() =>
                void loadOrders(
                  page - 1,
                )
              }
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <p className="text-sm font-bold text-slate-600">
              Page {page} of{" "}
              {totalPages}
            </p>

            <button
              type="button"
              disabled={
                loading ||
                page >= totalPages
              }
              onClick={() =>
                void loadOrders(
                  page + 1,
                )
              }
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
          <div className="mx-auto my-8 max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Order Details
                </p>

                <h2 className="mt-2 break-all text-2xl font-black text-slate-950">
                  {
                    selectedOrder.referenceNumber
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null,
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-2 font-bold"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <StatusBadge
                value={
                  selectedOrder.status
                }
              />

              <StatusBadge
                value={
                  selectedOrder.paymentStatus
                }
              />

              <StatusBadge
                value={
                  selectedOrder.esimStatus
                }
              />

              <StatusBadge
                value={
                  selectedOrder.emailSent
                    ? "DELIVERED"
                    : "PENDING"
                }
              />
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Detail
                label="Customer"
                value={
                  selectedOrder.customerName
                }
              />

              <Detail
                label="Email"
                value={
                  selectedOrder.customerEmail
                }
              />

              <Detail
                label="Phone"
                value={
                  selectedOrder.customerPhone
                }
              />

              <Detail
                label="Plan"
                value={
                  selectedOrder.planName
                }
              />

              <Detail
                label="Package code"
                value={
                  selectedOrder.packageCode
                }
              />

              <Detail
                label="PHP amount"
                value={formatPhp(
                  selectedOrder.amountPhpCentavos,
                )}
              />

              <Detail
                label="USD selling price"
                value={formatUsd(
                  selectedOrder.sellingPriceUsd,
                )}
              />

              <Detail
                label="Exchange rate"
                value={`₱${selectedOrder.usdToPhpRate.toFixed(
                  2,
                )} per USD`}
              />

              <Detail
                label="Payment method"
                value={
                  selectedOrder.paymentMethod ??
                  "—"
                }
              />

              <Detail
                label="Paid at"
                value={formatDate(
                  selectedOrder.paidAt,
                )}
              />

              <Detail
                label="Supplier order"
                value={
                  selectedOrder.esimOrderId ??
                  "—"
                }
              />

              <Detail
                label="eSIM transaction"
                value={
                  selectedOrder.esimTranNo ??
                  "—"
                }
              />

              <Detail
                label="ICCID"
                value={
                  selectedOrder.iccid ??
                  "—"
                }
              />

              <Detail
                label="APN"
                value={
                  selectedOrder.apn ??
                  "—"
                }
              />

              <Detail
                label="SM-DP status"
                value={
                  selectedOrder.smdpStatus ??
                  "—"
                }
              />

              <Detail
                label="Supplier eSIM status"
                value={
                  selectedOrder.supplierEsimStatus ??
                  "—"
                }
              />

              <Detail
                label="Email attempts"
                value={selectedOrder.emailAttempts.toString()}
              />

              <Detail
                label="Profile checks"
                value={selectedOrder.profileCheckAttempts.toString()}
              />

              <Detail
                label="Created"
                value={formatDate(
                  selectedOrder.createdAt,
                )}
              />

              <Detail
                label="Completed"
                value={formatDate(
                  selectedOrder.completedAt,
                )}
              />

              <Detail
                label="Email sent"
                value={
                  selectedOrder.emailSent
                    ? formatDate(
                        selectedOrder.emailSentAt,
                      )
                    : "No"
                }
              />
            </div>

            {selectedOrder.qrCodeUrl && (
              <div className="mt-7 rounded-2xl bg-slate-50 p-6 text-center">
                <p className="font-black text-slate-800">
                  eSIM QR Code
                </p>

                <img
                  src={
                    selectedOrder.qrCodeUrl
                  }
                  alt="eSIM QR code"
                  className="mx-auto mt-4 h-64 w-64 rounded-xl bg-white p-3 shadow"
                />
              </div>
            )}

            {selectedOrder.activationCode && (
              <div className="mt-5">
                <p className="text-sm font-black uppercase tracking-wider text-slate-500">
                  Activation Code
                </p>

                <p className="mt-2 break-all rounded-2xl bg-slate-100 p-4 font-mono text-sm">
                  {
                    selectedOrder.activationCode
                  }
                </p>
              </div>
            )}

            {selectedOrder.lastError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-black text-red-700">
                  Last Error
                </p>

                <p className="mt-2 break-words text-sm text-red-700">
                  {
                    selectedOrder.lastError
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}