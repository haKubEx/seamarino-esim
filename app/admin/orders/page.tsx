"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
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

const PAYMENT_STATUSES = [
  "",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

const ESIM_STATUSES = [
  "",
  "NOT_ORDERED",
  "PROCESSING",
  "ISSUED",
  "DELIVERED",
  "FAILED",
] as const;

type OrderStatusFilter =
  (typeof ORDER_STATUSES)[number];

type PaymentStatusFilter =
  (typeof PAYMENT_STATUSES)[number];

type EsimStatusFilter =
  (typeof ESIM_STATUSES)[number];

type AdminOrder = {
  id: string;
  referenceNumber: string;

  packageCode: string;
  planName: string;

  selectedDays:
    | number
    | null;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  subtotalPhpCentavos:
    | number
    | null;

  discountPhpCentavos: number;
  amountPhpCentavos: number;

  currency: string;

  couponCodeSnapshot:
    | string
    | null;

  status: string;
  paymentStatus: string;
  esimStatus: string;

  paymentMethod:
    | string
    | null;

  paidAt:
    | string
    | null;

  esimOrderId:
    | string
    | null;

  iccid:
    | string
    | null;

  supplierEsimStatus:
    | string
    | null;

  emailDeliveryStatus: string;
  emailSent: boolean;

  completedAt:
    | string
    | null;

  lastError:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
};

type OrderStats = {
  todayOrders: number;
  todayRevenueCentavos: number;
  pendingPayment: number;
  processingEsims: number;
  deliveredEsims: number;
  failedOrders: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type OrdersResponse = {
  success: boolean;
  error?: string;

  stats?: OrderStats;
  orders?: AdminOrder[];
  pagination?: Pagination;
};

const EMPTY_STATS: OrderStats = {
  todayOrders: 0,
  todayRevenueCentavos: 0,
  pendingPayment: 0,
  processingEsims: 0,
  deliveredEsims: 0,
  failedOrders: 0,
};

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

function getSafeNumber(
  value: unknown,
  fallback = 0,
) {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : fallback;
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
    getSafeNumber(
      centavos,
    ) / 100,
  );
}

function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
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
    status
      .trim()
      .toUpperCase()
  ) {
    case "COMPLETED":
    case "DELIVERED":
    case "PAID":
    case "ISSUED":
    case "SENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PROCESSING":
    case "SENDING":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PENDING":
    case "NOT_ORDERED":
    case "NOT_READY":
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
    value?.trim() ||
    "UNKNOWN";

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
        title={displayedValue}
        className={`mt-1 break-words text-sm font-semibold text-slate-700 ${
          monospace
            ? "font-mono"
            : ""
        }`}
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
  const [
    copied,
    setCopied,
  ] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1500,
      );
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void copyValue();
      }}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
    >
      {copied
        ? "Copied"
        : `Copy ${label}`}
    </button>
  );
}

export default function AdminOrdersPage() {
  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<OrderStatusFilter>(
      "",
    );

  const [
    paymentStatus,
    setPaymentStatus,
  ] =
    useState<PaymentStatusFilter>(
      "",
    );

  const [
    esimStatus,
    setEsimStatus,
  ] =
    useState<EsimStatusFilter>(
      "",
    );

  const [
    orders,
    setOrders,
  ] =
    useState<AdminOrder[]>(
      [],
    );

  const [
    stats,
    setStats,
  ] =
    useState<OrderStats>(
      EMPTY_STATS,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      EMPTY_PAGINATION,
    );

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

  const [
    retryingOrderId,
    setRetryingOrderId,
  ] = useState<
    string | null
  >(null);

  const [
    autoRefresh,
    setAutoRefresh,
  ] = useState(false);

  useEffect(() => {
    const savedAdminKey =
      localStorage.getItem(
        "adminKey",
      );

    if (savedAdminKey) {
      setAdminKey(
        savedAdminKey,
      );
    }
  }, []);

  const loadOrders =
    useCallback(
      async (
        requestedPage = 1,
        silent = false,
      ) => {
        const normalizedAdminKey =
          adminKey.trim();

        if (
          !normalizedAdminKey
        ) {
          setError(
            "Enter your admin key.",
          );

          return;
        }

        try {
          if (!silent) {
            setLoading(true);
          }

          setError("");

          const parameters =
            new URLSearchParams();

          parameters.set(
            "page",
            String(
              requestedPage,
            ),
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

          if (paymentStatus) {
            parameters.set(
              "paymentStatus",
              paymentStatus,
            );
          }

          if (esimStatus) {
            parameters.set(
              "esimStatus",
              esimStatus,
            );
          }

          const response =
            await fetch(
              `/api/admin/orders?${parameters.toString()}`,
              {
                method: "GET",

                cache:
                  "no-store",

                headers: {
                  "x-admin-key":
                    normalizedAdminKey,
                },
              },
            );

          const data =
            (await response.json()) as
              OrdersResponse;

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

          setStats(
            data.stats ??
              EMPTY_STATS,
          );

          const nextPagination =
            data.pagination ?? {
              ...EMPTY_PAGINATION,
              page:
                requestedPage,
              pageSize:
                pagination.pageSize,
            };

          setPagination(
            nextPagination,
          );

          if (!silent) {
            setMessage(
              `${nextPagination.total} order${
                nextPagination.total ===
                1
                  ? ""
                  : "s"
              } found.`,
            );
          }
        } catch (
          loadError
        ) {
          if (!silent) {
            setOrders([]);
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load orders.",
          );
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [
        adminKey,
        pagination.pageSize,
        search,
        status,
        paymentStatus,
        esimStatus,
      ],
    );

  useEffect(() => {
    if (
      !autoRefresh ||
      !adminKey.trim()
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          void loadOrders(
            pagination.page,
            true,
          );
        },
        15_000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    autoRefresh,
    adminKey,
    loadOrders,
    pagination.page,
  ]);

  async function retryFulfillment(
    order: AdminOrder,
  ) {
    const normalizedAdminKey =
      adminKey.trim();

    if (!normalizedAdminKey) {
      setError(
        "Enter your admin key.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Retry eSIM fulfillment for ${order.referenceNumber}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setRetryingOrderId(
        order.id,
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            order.id,
          )}/retry`,
          {
            method:
              "POST",

            headers: {
              "x-admin-key":
                normalizedAdminKey,
            },
          },
        );

      const data =
        (await response.json()) as {
          success:
            boolean;
          error?:
            string;
          message?:
            string;
          supplierOrderNo?:
            string | null;
        };

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to retry fulfillment.",
        );
      }

      setMessage(
        data.message ||
          "Fulfillment retry started successfully.",
      );

      await loadOrders(
        pagination.page,
      );
    } catch (
      retryError
    ) {
      setError(
        retryError instanceof
          Error
          ? retryError.message
          : "Unable to retry fulfillment.",
      );
    } finally {
      setRetryingOrderId(
        null,
      );
    }
  }

  async function handleSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await loadOrders(1);
  }

  function updateAdminKey(
    value: string,
  ) {
    setAdminKey(value);

    localStorage.setItem(
      "adminKey",
      value,
    );
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setEsimStatus("");

    setOrders([]);
    setStats(
      EMPTY_STATS,
    );

    setMessage("");
    setError("");

    setPagination(
      EMPTY_PAGINATION,
    );
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
            Search purchases,
            monitor payments,
            check supplier
            fulfillment, and verify
            customer eSIM delivery.
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
              href="/admin/coupons"
              className="rounded-xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
            >
              Coupons
            </a>

            <a
              href="/"
              className="rounded-xl bg-white px-5 py-3 font-black text-[#0A2D62]"
            >
              Storefront
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-100">
              Today&apos;s Orders
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                stats.todayOrders
              }
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-green-700 p-6 text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-100">
              Today&apos;s Revenue
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatPhpCentavos(
                stats.todayRevenueCentavos,
              )}
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-100">
              Pending Payment
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                stats.pendingPayment
              }
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-700 p-6 text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-sky-100">
              Processing eSIM
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                stats.processingEsims
              }
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 p-6 text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-100">
              Delivered eSIM
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                stats.deliveredEsims
              }
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-red-500 to-rose-700 p-6 text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-red-100">
              Failed Orders
            </p>

            <p className="mt-3 text-4xl font-black">
              {
                stats.failedOrders
              }
            </p>
          </div>
        </section>

        <form
          onSubmit={
            handleSearch
          }
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
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
                value={
                  adminKey
                }
                onChange={(
                  event,
                ) =>
                  updateAdminKey(
                    event.target
                      .value,
                  )
                }
                autoComplete="current-password"
                placeholder="Enter ADMIN_API_KEY"
                className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-bold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="lg:col-span-1 xl:col-span-2">
              <label
                htmlFor="orderSearch"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Search orders
              </label>

              <input
                id="orderSearch"
                type="search"
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Reference, customer, email, ICCID, plan, or package code"
                className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
                value={
                  status
                }
                onChange={(
                  event,
                ) =>
                  setStatus(
                    event.target
                      .value as
                      OrderStatusFilter,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-black text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {ORDER_STATUSES.map(
                  (
                    statusOption,
                  ) => (
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
                        "All order statuses"}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="paymentStatusFilter"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Payment status
              </label>

              <select
                id="paymentStatusFilter"
                value={
                  paymentStatus
                }
                onChange={(
                  event,
                ) =>
                  setPaymentStatus(
                    event.target
                      .value as
                      PaymentStatusFilter,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-black text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {PAYMENT_STATUSES.map(
                  (
                    statusOption,
                  ) => (
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
                        "All payment statuses"}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="esimStatusFilter"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                eSIM status
              </label>

              <select
                id="esimStatusFilter"
                value={
                  esimStatus
                }
                onChange={(
                  event,
                ) =>
                  setEsimStatus(
                    event.target
                      .value as
                      EsimStatusFilter,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-black text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {ESIM_STATUSES.map(
                  (
                    statusOption,
                  ) => (
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
                        "All eSIM statuses"}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={
                  loading
                }
                className="h-14 flex-1 rounded-2xl bg-[#0A2D62] px-7 font-black text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Load Orders"}
              </button>

              <button
                type="button"
                onClick={() => {
                  void loadOrders(
                    pagination.page,
                  );
                }}
                disabled={
                  loading
                }
                className="h-14 rounded-2xl border-2 border-blue-200 bg-blue-50 px-7 font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  loading
                }
                className="h-14 rounded-2xl border-2 border-slate-300 bg-white px-7 font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2 xl:col-span-3">
              <input
                type="checkbox"
                checked={
                  autoRefresh
                }
                onChange={(
                  event,
                ) =>
                  setAutoRefresh(
                    event.target
                      .checked,
                  )
                }
                className="h-5 w-5 accent-[#0A2D62]"
              />

              <span>
                <strong className="block text-slate-950">
                  Auto refresh every
                  15 seconds
                </strong>

                <span className="mt-1 block text-sm text-slate-500">
                  Useful while monitoring
                  payment and eSIM
                  delivery progress.
                </span>
              </span>
            </label>
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
          {orders.map(
            (order) => {
              const subtotal =
                order
                  .subtotalPhpCentavos ??
                order
                  .amountPhpCentavos +
                  order
                    .discountPhpCentavos;

              const canRetryFulfillment =
                order.paymentStatus ===
                  "PAID" &&
                (
                  order.esimStatus ===
                    "FAILED" ||
                  order.esimStatus ===
                    "NOT_ORDERED"
                ) &&
                !order.esimOrderId;

              return (
                <article
                  key={
                    order.id
                  }
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

                          {order.selectedDays && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                              DAILY ·{" "}
                              {order.selectedDays}{" "}
                              {order.selectedDays ===
                              1
                                ? "DAY"
                                : "DAYS"}
                            </span>
                          )}

                          {order.couponCodeSnapshot && (
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                              COUPON:{" "}
                              {
                                order.couponCodeSnapshot
                              }
                            </span>
                          )}

                          {order.emailSent && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              EMAIL SENT
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 break-words text-2xl font-black text-slate-950">
                          {
                            order.planName
                          }
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
                          value={
                            order.status
                          }
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

                        <StatusBadge
                          label="Email"
                          value={
                            order.emailDeliveryStatus
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 xl:grid-cols-3">
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
                          label="Original total"
                          value={formatPhpCentavos(
                            subtotal,
                          )}
                        />

                        <DetailItem
                          label="Discount"
                          value={
                            order.discountPhpCentavos >
                            0
                              ? `-${formatPhpCentavos(
                                  order.discountPhpCentavos,
                                )}`
                              : formatPhpCentavos(
                                  0,
                                )
                          }
                        />

                        <DetailItem
                          label="Final amount"
                          value={formatPhpCentavos(
                            order.amountPhpCentavos,
                          )}
                        />

                        <DetailItem
                          label="Coupon"
                          value={
                            order.couponCodeSnapshot
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
                        {order.selectedDays && (
                          <DetailItem
                            label="Selected validity"
                            value={`${order.selectedDays} ${
                              order.selectedDays ===
                              1
                                ? "Day"
                                : "Days"
                            }`}
                          />
                        )}

                        <DetailItem
                          label="Supplier order"
                          value={
                            order.esimOrderId
                          }
                          monospace
                        />

                        <DetailItem
                          label="ICCID"
                          value={
                            order.iccid
                          }
                          monospace
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

                      {order.iccid && (
                        <div className="mt-4">
                          <CopyButton
                            value={
                              order.iccid
                            }
                            label="ICCID"
                          />
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="grid gap-6 border-t border-slate-200 bg-slate-50 p-6 lg:grid-cols-2">
                    <section>
                      <h3 className="text-lg font-black text-slate-950">
                        Delivery status
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
                          label="Email status"
                          value={
                            order.emailDeliveryStatus
                          }
                        />

                        <DetailItem
                          label="Last updated"
                          value={formatDate(
                            order.updatedAt,
                          )}
                        />

                        <DetailItem
                          label="Currency"
                          value={
                            order.currency
                          }
                        />
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-slate-950">
                        Last error
                      </h3>

                      {order.lastError ? (
                        <div className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                          {
                            order.lastError
                          }
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                          No error recorded.
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white p-5">
                    <a
                      href={`/account/orders/${encodeURIComponent(
                        order.referenceNumber,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-[#0A2D62] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                    >
                      Open Order Page
                    </a>

                    {canRetryFulfillment && (
                      <button
                        type="button"
                        onClick={() => {
                          void retryFulfillment(
                            order,
                          );
                        }}
                        disabled={
                          retryingOrderId ===
                          order.id
                        }
                        className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {retryingOrderId ===
                        order.id
                          ? "Retrying..."
                          : "Retry Fulfillment"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        void loadOrders(
                          pagination.page,
                        );
                      }}
                      className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      Refresh Status
                    </button>
                  </div>
                </article>
              );
            },
          )}

          {!loading &&
            orders.length ===
              0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-14 text-center shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">
                  No orders loaded
                </h2>

                <p className="mt-3 text-slate-500">
                  Enter your admin key
                  and click Load Orders.
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
              Page{" "}
              {
                pagination.page
              }{" "}
              of{" "}
              {
                pagination.totalPages
              }{" "}
              ·{" "}
              {
                pagination.total
              }{" "}
              total orders
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  void loadOrders(
                    pagination.page -
                      1,
                  );
                }}
                disabled={
                  loading ||
                  pagination.page <=
                    1
                }
                className="rounded-xl border border-slate-300 px-5 py-3 font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  void loadOrders(
                    pagination.page +
                      1,
                  );
                }}
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