"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Transaction = {
  id: string;
  type: string;
  amountPhpCentavos: number;
  balanceBeforePhpCentavos: number;
  balanceAfterPhpCentavos: number;
  description: string | null;
  createdAt: string;
  order: {
    referenceNumber: string;
    planName: string;
  } | null;
  referral: {
    referralCode: string;
  } | null;
};

type CustomerWallet = {
  id: string;
  name: string;
  email: string;
  referralCode: string | null;
  storeCreditPhpCentavos: number;
  createdAt: string;
  counts: {
    orders: number;
    referrals: number;
    transactions: number;
  };
  recentTransactions: Transaction[];
};

type BalanceFilter =
  | "all"
  | "positive"
  | "zero";

type SortOption =
  | "newest"
  | "highest"
  | "lowest"
  | "transactions";

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type WalletSummary = {
  totalCustomers: number;
  customersWithCredit: number;
  zeroBalanceCustomers: number;
  totalOutstandingPhpCentavos: number;
  averageBalancePhpCentavos: number;
};

type WalletResponse = {
  success: boolean;
  error?: string;
  message?: string;
  summary?: WalletSummary;
  customers?: CustomerWallet[];
  pagination?: Pagination;
};

const DEFAULT_SUMMARY: WalletSummary = {
  totalCustomers: 0,
  customersWithCredit: 0,
  zeroBalanceCustomers: 0,
  totalOutstandingPhpCentavos: 0,
  averageBalancePhpCentavos: 0,
};

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatMoney(
  amountCentavos: number,
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
    amountCentavos / 100,
  );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default function AdminWalletClient() {
  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    balanceFilter,
    setBalanceFilter,
  ] =
    useState<BalanceFilter>(
      "all",
    );

  const [
    sortOption,
    setSortOption,
  ] =
    useState<SortOption>(
      "newest",
    );

  const [
    pageSize,
    setPageSize,
  ] = useState(20);

  const [
    customers,
    setCustomers,
  ] = useState<CustomerWallet[]>([]);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] =
    useState<CustomerWallet | null>(
      null,
    );

  const [
    direction,
    setDirection,
  ] =
    useState<"ADD" | "DEDUCT">(
      "ADD",
    );

  const [
    amountPhp,
    setAmountPhp,
  ] = useState("");

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    adjusting,
    setAdjusting,
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
    summary,
    setSummary,
  ] =
    useState<WalletSummary>(
      DEFAULT_SUMMARY,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      DEFAULT_PAGINATION,
    );

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "adminKey",
      );

    if (saved) {
      setAdminKey(saved);
    }
  }, []);

  async function loadWallets(
    requestedPage = 1,
    event?: FormEvent,
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
        new URLSearchParams();

      params.set(
        "page",
        String(requestedPage),
      );

      params.set(
        "pageSize",
        String(pageSize),
      );

      params.set(
        "balance",
        balanceFilter,
      );

      params.set(
        "sort",
        sortOption,
      );

      if (search.trim()) {
        params.set(
          "search",
          search.trim(),
        );
      }

      const response =
        await fetch(
          `/api/admin/wallet?${params.toString()}`,
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
          WalletResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load wallets.",
        );
      }

      const loadedCustomers =
        data.customers ?? [];

      setCustomers(
        loadedCustomers,
      );

      setSummary(
        data.summary ??
          DEFAULT_SUMMARY,
      );

      setPagination(
        data.pagination ??
          DEFAULT_PAGINATION,
      );

      setMessage(
        `${data.pagination?.total ?? 0} customer wallet${
          data.pagination?.total === 1
            ? ""
            : "s"
        } found.`,
      );

      if (selectedCustomer) {
        const refreshed =
          loadedCustomers.find(
            (customer) =>
              customer.id ===
              selectedCustomer.id,
          );

        setSelectedCustomer(
          refreshed ?? null,
        );
      }
    } catch (loadError) {
      setCustomers([]);
      setPagination(
        DEFAULT_PAGINATION,
      );
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load wallets.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    await loadWallets(
      1,
      event,
    );
  }

  function clearFilters() {
    setSearch("");
    setBalanceFilter("all");
    setSortOption("newest");
    setPageSize(20);
    setCustomers([]);
    setSelectedCustomer(null);
    setSummary(
      DEFAULT_SUMMARY,
    );
    setPagination(
      DEFAULT_PAGINATION,
    );
    setMessage("");
    setError("");
  }

  async function submitAdjustment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedCustomer) {
      setError(
        "Select a customer first.",
      );
      return;
    }

    try {
      setAdjusting(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/admin/wallet",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "x-admin-key":
                adminKey.trim(),
            },
            body:
              JSON.stringify({
                userId:
                  selectedCustomer.id,
                direction,
                amountPhp,
                reason,
              }),
          },
        );

      const data =
        (await response.json()) as
          WalletResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to update wallet.",
        );
      }

      setMessage(
        data.message ||
          "Wallet updated successfully.",
      );

      setAmountPhp("");
      setReason("");

      await loadWallets(
        pagination.page,
      );
    } catch (adjustmentError) {
      setError(
        adjustmentError instanceof Error
          ? adjustmentError.message
          : "Unable to update wallet.",
      );
    } finally {
      setAdjusting(false);
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
            Customer Wallet Management
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Search customer accounts,
            review wallet balances, and
            create fully audited manual
            adjustments.
          </p>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Customer Accounts
            </p>

            <p className="mt-3 text-4xl font-black text-slate-950">
              {
                summary.totalCustomers
              }
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Customers With Credit
            </p>

            <p className="mt-3 text-4xl font-black text-violet-700">
              {
                summary.customersWithCredit
              }
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Outstanding Credit
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-700">
              {formatMoney(
                summary.totalOutstandingPhpCentavos,
              )}
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Average Balance
            </p>

            <p className="mt-3 text-3xl font-black text-blue-700">
              {formatMoney(
                summary.averageBalancePhpCentavos,
              )}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            onSubmit={
              handleSearch
            }
            className="grid gap-4 xl:grid-cols-2"
          >
            <label className="block">
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
                spellCheck={false}
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 text-base font-bold text-slate-950 caret-blue-700 outline-none transition placeholder:font-semibold placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Search Customer
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Name, email, or referral code"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 text-base font-bold text-slate-950 caret-blue-700 outline-none transition placeholder:font-semibold placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Balance Filter
              </span>

              <select
                value={
                  balanceFilter
                }
                onChange={(event) =>
                  setBalanceFilter(
                    event.target
                      .value as BalanceFilter,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">
                  All customers
                </option>

                <option value="positive">
                  Has wallet balance
                </option>

                <option value="zero">
                  Zero balance
                </option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Sort By
              </span>

              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(
                    event.target
                      .value as SortOption,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="newest">
                  Newest customer
                </option>

                <option value="highest">
                  Highest balance
                </option>

                <option value="lowest">
                  Lowest balance
                </option>

                <option value="transactions">
                  Most transactions
                </option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Results Per Page
              </span>

              <select
                value={pageSize}
                onChange={(event) =>
                  setPageSize(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value={10}>
                  10 customers
                </option>

                <option value={20}>
                  20 customers
                </option>

                <option value={50}>
                  50 customers
                </option>

                <option value={100}>
                  100 customers
                </option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="min-h-14 flex-1 rounded-2xl bg-[#0A2D62] px-7 py-3 font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Apply Filters"}
              </button>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="min-h-14 rounded-2xl border-2 border-slate-300 bg-white px-5 font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Clear
              </button>
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
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            {customers.length ===
            0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="text-5xl">
                  💳
                </p>

                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  No customer wallets loaded
                </h2>

                <p className="mt-2 text-slate-500">
                  Enter your admin key,
                  choose filters, and click
                  Apply Filters.
                </p>
              </div>
            ) : (
              customers.map(
                (customer) => (
                  <button
                    type="button"
                    key={
                      customer.id
                    }
                    onClick={() =>
                      setSelectedCustomer(
                        customer,
                      )
                    }
                    className={`w-full rounded-[2rem] border bg-white p-6 text-left shadow-sm transition ${
                      selectedCustomer?.id ===
                      customer.id
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-950">
                          {
                            customer.name
                          }
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            customer.email
                          }
                        </p>

                        {customer.referralCode && (
                          <p className="mt-2 text-xs font-black text-violet-700">
                            Code:{" "}
                            {
                              customer.referralCode
                            }
                          </p>
                        )}
                      </div>

                      <p className="text-2xl font-black text-emerald-700">
                        {formatMoney(
                          customer.storeCreditPhpCentavos,
                        )}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                      <span>
                        Orders:{" "}
                        <strong>
                          {
                            customer
                              .counts
                              .orders
                          }
                        </strong>
                      </span>

                      <span>
                        Referrals:{" "}
                        <strong>
                          {
                            customer
                              .counts
                              .referrals
                          }
                        </strong>
                      </span>

                      <span>
                        Transactions:{" "}
                        <strong>
                          {
                            customer
                              .counts
                              .transactions
                          }
                        </strong>
                      </span>
                    </div>
                  </button>
                ),
              )
            )}

            {customers.length >
              0 && (
              <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-slate-950">
                    Page{" "}
                    {
                      pagination.page
                    }{" "}
                    of{" "}
                    {
                      pagination.totalPages
                    }
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      pagination.total
                    }{" "}
                    matching customer
                    {pagination.total ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={
                      loading ||
                      !pagination.hasPreviousPage
                    }
                    onClick={() =>
                      void loadWallets(
                        pagination.page -
                          1,
                      )
                    }
                    className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      !pagination.hasNextPage
                    }
                    onClick={() =>
                      void loadWallets(
                        pagination.page +
                          1,
                      )
                    }
                    className="rounded-2xl bg-[#0A2D62] px-5 py-3 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Manual Adjustment
            </p>

            {selectedCustomer ? (
              <>
                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  {
                    selectedCustomer.name
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    selectedCustomer.email
                  }
                </p>

                <p className="mt-5 text-3xl font-black text-emerald-700">
                  {formatMoney(
                    selectedCustomer.storeCreditPhpCentavos,
                  )}
                </p>

                <form
                  onSubmit={
                    submitAdjustment
                  }
                  className="mt-6 space-y-4"
                >
                  <select
                    value={direction}
                    onChange={(event) =>
                      setDirection(
                        event.target
                          .value as
                          | "ADD"
                          | "DEDUCT",
                      )
                    }
                    className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-4 font-black text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="ADD">
                      Add credit
                    </option>

                    <option value="DEDUCT">
                      Deduct credit
                    </option>
                  </select>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amountPhp}
                    onChange={(event) =>
                      setAmountPhp(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Amount in PHP"
                    className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 text-base font-bold text-slate-950 caret-blue-700 outline-none transition placeholder:font-semibold placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <textarea
                    value={reason}
                    onChange={(event) =>
                      setReason(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Reason for this adjustment"
                    rows={4}
                    className="w-full rounded-2xl border-2 border-slate-400 bg-slate-50 p-5 text-base font-bold text-slate-950 caret-blue-700 outline-none transition placeholder:font-semibold placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="submit"
                    disabled={adjusting}
                    className={`w-full rounded-2xl px-6 py-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      direction ===
                      "ADD"
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-red-700 hover:bg-red-800"
                    }`}
                  >
                    {adjusting
                      ? "Saving..."
                      : direction ===
                          "ADD"
                        ? "Add Credit"
                        : "Deduct Credit"}
                  </button>
                </form>

                <div className="mt-8">
                  <h3 className="font-black text-slate-950">
                    Recent activity
                  </h3>

                  <div className="mt-4 space-y-3">
                    {selectedCustomer
                      .recentTransactions
                      .length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No transactions yet.
                      </p>
                    ) : (
                      selectedCustomer.recentTransactions.map(
                        (
                          transaction,
                        ) => (
                          <div
                            key={
                              transaction.id
                            }
                            className="rounded-2xl bg-slate-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-bold text-slate-800">
                                {transaction.description ||
                                  transaction.type}
                              </p>

                              <p
                                className={`shrink-0 font-black ${
                                  transaction.amountPhpCentavos >=
                                  0
                                    ? "text-emerald-700"
                                    : "text-red-700"
                                }`}
                              >
                                {transaction.amountPhpCentavos >
                                0
                                  ? "+"
                                  : ""}
                                {formatMoney(
                                  transaction.amountPhpCentavos,
                                )}
                              </p>
                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                              {formatDate(
                                transaction.createdAt,
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Balance after:{" "}
                              {formatMoney(
                                transaction.balanceAfterPhpCentavos,
                              )}
                            </p>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-5 leading-7 text-slate-500">
                Load wallets and select a
                customer to add or deduct
                credit.
              </p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}