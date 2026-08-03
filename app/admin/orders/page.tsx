"use client";

import {
  FormEvent,
  useCallback,
  useState,
} from "react";

const ORDER_STATUSES = [
  "",
  "PENDING",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatusFilter =
  (typeof ORDER_STATUSES)[number];

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

  status: string;
  paymentStatus: string;
  esimStatus: string;

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

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type OrdersResponse = {
  success: boolean;
  orders?: AdminOrder[];
  pagination?: Pagination;
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
  ).format(getSafeNumber(value));
}

function formatPhpCentavos(
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
    getSafeNumber(centavos) / 100,
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function getStatusClasses(
  status: string,
) {
  switch (
    status.trim().toUpperCase()
  ) {
    case "COMPLETED":
    case "DELIVERED":
    case "PAID":
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
  const normalizedValue =
    value?.trim() || "UNKNOWN";

  return (
    <div>
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
          normalizedValue,
        )}`}
      >
        {normalizedValue}
      </span>
    </div>
  );
}

function DetailItem({
  label,
  value,
  monospace = false,
}: {
  label: string;
  value:
    | string
    | number
    | null
    | undefined;
  monospace?: boolean;
}) {
  const displayedValue =
    value === null ||
    value === undefined ||
    value === ""
      ? "—"
      : String(value);

  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold text-slate-700 ${
          monospace
            ? "font-mono"
            : ""
        }`}
        title={displayedValue}
      >
        {displayedValue}
      </p>
    </div>
  );
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] =
    useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() =>
        void copyValue()
      }
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
    >
      {copied
        ? "Copied"
        : `Copy ${label}`}
    </button>
  );
}

export default function AdminOrdersPage() {
  const [adminKey, setAdminKey] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<OrderStatusFilter>("");

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const loadOrders = useCallback(
    async (
      requestedPage = 1,
    ) => {
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

        parameters.set(
          "page",
          String(requestedPage),
        );

        parameters.set(
          "pageSize",
          String(
            pagination.pageSize,
          ),
        );

        if (search.trim()) {
          parameters.set(
            "search",
            search.trim(),
          );
        }

        if (status) {
          parameters.set(
            "status",
            status,
          );
        }

        const response =
          await fetch(
            `/api/admin/orders?${parameters.toString()}`,
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

        setPagination(
          data.pagination ?? {
            page: requestedPage,
            pageSize:
              pagination.pageSize,
            total: 0,
            totalPages: 1,
          },
        );

        setMessage(
          `${data.pagination?.total ?? 0} order${
            data.pagination?.total === 1
              ? ""
              : "s"
          } found.`,
        );
      } catch (loadError) {
        setOrders([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load orders.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      adminKey,
      pagination.pageSize,
      search,
      status,
    ],
  );

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await loadOrders(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setOrders([]);
    setMessage("");
    setError("");

    setPagination({
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            Customer Orders
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Search orders, confirm
            payments, monitor supplier
            fulfillment, inspect QR
            details, and verify customer
            email delivery.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/admin"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
            >
              Dashboard
            </a>

            <a
              href="/admin/plans"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
            >
              Manage Plans
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
  onSubmit={handleSearch}
  className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
>
  <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_220px_auto_auto]">
    <div>
      <label
        htmlFor="adminKey"
        className="mb-2 block text-sm font-black text-slate-900"
      >
        Admin key
      </label>

      <input
        id="adminKey"
        type="password"
        value={adminKey}
        onChange={(event) =>
          setAdminKey(
            event.target.value,
          )
        }
        autoComplete="current-password"
        placeholder="Enter ADMIN_API_KEY"
        className="h-16 w-full min-w-0 rounded-2xl border-2 border-slate-400 bg-white px-5 text-lg font-bold tracking-wide text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <div>
      <label
        htmlFor="orderSearch"
        className="mb-2 block text-sm font-black text-slate-900"
      >
        Search orders
      </label>

      <input
        id="orderSearch"
        type="search"
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value,
          )
        }
        placeholder="Reference, customer, email, phone, plan, or package"
        className="h-16 w-full min-w-0 rounded-2xl border-2 border-slate-400 bg-white px-5 text-lg font-semibold text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <div>
      <label
        htmlFor="statusFilter"
        className="mb-2 block text-sm font-black text-slate-900"
      >
        Order status
      </label>

      <select
        id="statusFilter"
        value={status}
        onChange={(event) =>
          setStatus(
            event.target
              .value as OrderStatusFilter,
          )
        }
        className="h-16 w-full rounded-2xl border-2 border-slate-400 bg-white px-5 text-base font-black text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {ORDER_STATUSES.map(
          (statusOption) => (
            <option
              key={
                statusOption ||
                "ALL"
              }
              value={
                statusOption
              }
            >
              {statusOption ||
                "All statuses"}
            </option>
          ),
        )}
      </select>
    </div>

    <div className="flex items-end">
      <button
        type="submit"
        disabled={loading}
        className="h-16 w-full rounded-2xl bg-[#0A2D62] px-7 text-base font-black text-white shadow-md transition hover:bg-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Loading..."
          : "Load Orders"}
      </button>
    </div>

    <div className="flex items-end">
      <button
        type="button"
        onClick={clearFilters}
        disabled={loading}
        className="h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-base font-black text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
      >
        Clear
      </button>
    </div>
  </div>
</form>

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

        <section className="mt-6 space-y-6">
          {orders.map((order) => {
            const phpAmount =
              formatPhpCentavos(
                order.amountPhpCentavos,
              );

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 font-mono text-xs font-black text-blue-700">
                          {
                            order.referenceNumber
                          }
                        </span>

                        <span className="rounded-full bg-slate-200 px-3 py-1 font-mono text-xs font-black text-slate-700">
                          {
                            order.packageCode
                          }
                        </span>

                        {order.emailSent && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            EMAIL SENT
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 break-words text-2xl font-black text-slate-950">
                        {order.planName}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Created{" "}
                        {formatDate(
                          order.createdAt,
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-5">
                      <StatusBadge
                        label="Order"
                        value={order.status}
                      />

                      <StatusBadge
                        label="Payment"
                        value={
                          order.paymentStatus
                        }
                      />

                      <StatusBadge
                        label="eSIM"
                        value={
                          order.esimStatus
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-6 xl:grid-cols-[1fr_1fr_1.15fr]">
                  <section className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Customer
                    </h3>

                    <div className="mt-5 grid gap-4">
                      <DetailItem
                        label="Name"
                        value={
                          order.customerName
                        }
                      />

                      <DetailItem
                        label="Email"
                        value={
                          order.customerEmail
                        }
                      />

                      <DetailItem
                        label="Phone"
                        value={
                          order.customerPhone
                        }
                      />

                      <div className="flex flex-wrap gap-2">
                        <CopyButton
                          value={
                            order.customerEmail
                          }
                          label="email"
                        />

                        <CopyButton
                          value={
                            order.referenceNumber
                          }
                          label="reference"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Payment
                    </h3>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <DetailItem
                        label="Selling price"
                        value={formatUsd(
                          order.sellingPriceUsd,
                        )}
                      />

                      <DetailItem
                        label="Paid amount"
                        value={phpAmount}
                      />

                      <DetailItem
                        label="Exchange rate"
                        value={`₱${getSafeNumber(
                          order.usdToPhpRate,
                        ).toFixed(
                          2,
                        )} / USD`}
                      />

                      <DetailItem
                        label="Currency"
                        value={
                          order.currency
                        }
                      />

                      <DetailItem
                        label="Payment method"
                        value={
                          order.paymentMethod
                        }
                      />

                      <DetailItem
                        label="Paid at"
                        value={formatDate(
                          order.paidAt,
                        )}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-lg font-black text-slate-950">
                      Fulfillment
                    </h3>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Supplier order"
                        value={
                          order.esimOrderId
                        }
                        monospace
                      />

                      <DetailItem
                        label="Supplier transaction"
                        value={
                          order.esimTranNo
                        }
                        monospace
                      />

                      <DetailItem
                        label="ICCID"
                        value={order.iccid}
                        monospace
                      />

                      <DetailItem
                        label="APN"
                        value={order.apn}
                        monospace
                      />

                      <DetailItem
                        label="SM-DP+ address"
                        value={
                          order.smdpAddress
                        }
                        monospace
                      />

                      <DetailItem
                        label="SM-DP+ status"
                        value={
                          order.smdpStatus
                        }
                      />

                      <DetailItem
                        label="Supplier status"
                        value={
                          order.supplierEsimStatus
                        }
                      />

                      <DetailItem
                        label="Completed at"
                        value={formatDate(
                          order.completedAt,
                        )}
                      />
                    </div>
                  </section>
                </div>

                {(order.activationCode ||
                  order.qrCodeUrl) && (
                  <div className="border-t border-slate-200 p-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                      <section className="min-w-0 rounded-2xl bg-slate-50 p-5">
                        <h3 className="text-lg font-black text-slate-950">
                          Installation details
                        </h3>

                        <div className="mt-5 space-y-5">
                          <DetailItem
                            label="Activation code"
                            value={
                              order.activationCode
                            }
                            monospace
                          />

                          {order.activationCode && (
                            <CopyButton
                              value={
                                order.activationCode
                              }
                              label="activation code"
                            />
                          )}

                          <DetailItem
                            label="QR code URL"
                            value={
                              order.qrCodeUrl
                            }
                            monospace
                          />

                          {order.qrCodeUrl && (
                            <a
                              href={
                                order.qrCodeUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-xl bg-[#0A2D62] px-5 py-3 font-black text-white transition hover:bg-blue-800"
                            >
                              Open QR Code
                            </a>
                          )}
                        </div>
                      </section>

                      {order.qrCodeUrl && (
                        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              order.qrCodeUrl
                            }
                            alt={`eSIM QR code for ${order.referenceNumber}`}
                            className="h-auto max-h-64 w-auto max-w-full rounded-xl object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-6 border-t border-slate-200 bg-slate-50 p-6 lg:grid-cols-2">
                  <section>
                    <h3 className="text-lg font-black text-slate-950">
                      Email delivery
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <DetailItem
                        label="Email sent"
                        value={
                          order.emailSent
                            ? "Yes"
                            : "No"
                        }
                      />

                      <DetailItem
                        label="Sent at"
                        value={formatDate(
                          order.emailSentAt,
                        )}
                      />

                      <DetailItem
                        label="Email attempts"
                        value={
                          order.emailAttempts
                        }
                      />

                      <DetailItem
                        label="Profile checks"
                        value={
                          order.profileCheckAttempts
                        }
                      />

                      <DetailItem
                        label="Processing attempts"
                        value={
                          order.processingAttempts
                        }
                      />

                      <DetailItem
                        label="Updated at"
                        value={formatDate(
                          order.updatedAt,
                        )}
                      />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-black text-slate-950">
                      Last error
                    </h3>

                    {order.lastError ? (
                      <div className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                        {order.lastError}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                        No error recorded.
                      </div>
                    )}
                  </section>
                </div>
              </article>
            );
          })}

          {!loading &&
            orders.length === 0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-14 text-center shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">
                  No orders loaded
                </h2>

                <p className="mt-3 text-slate-500">
                  Enter your admin key and
                  click Load Orders.
                </p>
              </div>
            )}
        </section>

        {orders.length > 0 && (
          <nav
            className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
            aria-label="Orders pagination"
          >
            <p className="text-sm font-semibold text-slate-600">
              Page {pagination.page} of{" "}
              {pagination.totalPages} ·{" "}
              {pagination.total} total
              orders
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadOrders(
                    pagination.page -
                      1,
                  )
                }
                disabled={
                  loading ||
                  pagination.page <= 1
                }
                className="rounded-xl border border-slate-300 px-5 py-3 font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  void loadOrders(
                    pagination.page +
                      1,
                  )
                }
                disabled={
                  loading ||
                  pagination.page >=
                    pagination.totalPages
                }
                className="rounded-xl bg-[#0A2D62] px-5 py-3 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}