"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type ReferralStatus =
  | "PENDING"
  | "QUALIFIED"
  | "REWARDED"
  | "CANCELLED";

type StatusFilter =
  | "ALL"
  | ReferralStatus;

type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "REWARDED_FIRST"
  | "HIGHEST_REWARD";

type Referral = {
  id: string;
  referralCode: string;
  status: ReferralStatus;
  referrerRewardPhpCentavos: number;
  referredRewardPhpCentavos: number;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  referrer: {
    id: string;
    name: string;
    email: string;
    referralCode: string | null;
  };
  referredUser: {
    id: string;
    name: string;
    email: string;
  };
  qualifyingOrder: {
    id: string;
    referenceNumber: string;
    planName: string;
    dataVolumeBytes: string | null;
    status: string;
    paymentStatus: string;
    esimStatus: string;
    completedAt: string | null;
  } | null;
  rewardTransactions: Array<{
    id: string;
    userId: string;
    amountPhpCentavos: number;
    balanceBeforePhpCentavos: number;
    balanceAfterPhpCentavos: number;
    description: string | null;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
};

type LeaderboardItem = {
  id: string;
  name: string;
  email: string;
  referralCode: string | null;
  totalReferrals: number;
  rewardedReferrals: number;
  rewardsEarnedPhpCentavos: number;
};

type ReferralResponse = {
  success: boolean;
  error?: string;
  summary?: {
    totalReferrals: number;
    pending: number;
    qualified: number;
    rewarded: number;
    cancelled: number;
    totalRewardTransactions: number;
    totalRewardsIssuedPhpCentavos: number;
  };
  leaderboard?: LeaderboardItem[];
  referrals?: Referral[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

const EMPTY_SUMMARY = {
  totalReferrals: 0,
  pending: 0,
  qualified: 0,
  rewarded: 0,
  cancelled: 0,
  totalRewardTransactions: 0,
  totalRewardsIssuedPhpCentavos: 0,
};

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatMoney(
  amountPhpCentavos: number,
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
    amountPhpCentavos / 100,
  );
}

function formatDate(
  value: string | null,
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

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function statusClassName(
  status: ReferralStatus,
) {
  switch (status) {
    case "REWARDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "QUALIFIED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function AdminReferralsClient() {
  const [
    adminKey,
    setAdminKey,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "ALL",
    );

  const [
    sortOption,
    setSortOption,
  ] =
    useState<SortOption>(
      "NEWEST",
    );

  const [
    pageSize,
    setPageSize,
  ] = useState(20);

  const [
    referrals,
    setReferrals,
  ] = useState<Referral[]>([]);

  const [
    leaderboard,
    setLeaderboard,
  ] =
    useState<
      LeaderboardItem[]
    >([]);

  const [
    selectedReferral,
    setSelectedReferral,
  ] =
    useState<Referral | null>(
      null,
    );

  const [
    summary,
    setSummary,
  ] = useState(
    EMPTY_SUMMARY,
  );

  const [
    pagination,
    setPagination,
  ] = useState(
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

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "adminKey",
      );

    if (saved) {
      setAdminKey(saved);
    }
  }, []);

  async function loadReferrals(
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
        "status",
        statusFilter,
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
          `/api/admin/referrals?${params.toString()}`,
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
          ReferralResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to load referrals.",
        );
      }

      const loadedReferrals =
        data.referrals ?? [];

      setReferrals(
        loadedReferrals,
      );

      setLeaderboard(
        data.leaderboard ?? [],
      );

      setSummary(
        data.summary ??
          EMPTY_SUMMARY,
      );

      setPagination(
        data.pagination ??
          EMPTY_PAGINATION,
      );

      setMessage(
        `${data.pagination?.total ?? 0} referral${
          data.pagination?.total === 1
            ? ""
            : "s"
        } found.`,
      );

      if (selectedReferral) {
        setSelectedReferral(
          loadedReferrals.find(
            (referral) =>
              referral.id ===
              selectedReferral.id,
          ) ?? null,
        );
      }
    } catch (loadError) {
      setReferrals([]);
      setLeaderboard([]);
      setSelectedReferral(null);
      setSummary(
        EMPTY_SUMMARY,
      );
      setPagination(
        EMPTY_PAGINATION,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load referrals.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setSortOption("NEWEST");
    setPageSize(20);
    setReferrals([]);
    setLeaderboard([]);
    setSelectedReferral(null);
    setSummary(
      EMPTY_SUMMARY,
    );
    setPagination(
      EMPTY_PAGINATION,
    );
    setError("");
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Referral Management
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Monitor referral activity,
            qualifying orders, issued
            rewards, and your highest
            performing referrers.
          </p>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Total Referrals
            </p>
            <p className="mt-3 text-4xl font-black text-slate-950">
              {
                summary.totalReferrals
              }
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Rewarded
            </p>
            <p className="mt-3 text-4xl font-black text-emerald-700">
              {
                summary.rewarded
              }
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Pending / Qualified
            </p>
            <p className="mt-3 text-3xl font-black text-amber-700">
              {summary.pending} /{" "}
              {summary.qualified}
            </p>
          </article>

          <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Rewards Issued
            </p>
            <p className="mt-3 text-3xl font-black text-violet-700">
              {formatMoney(
                summary.totalRewardsIssuedPhpCentavos,
              )}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            onSubmit={(event) =>
              void loadReferrals(
                1,
                event,
              )
            }
            className="grid gap-4 xl:grid-cols-2"
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
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Search
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Code, customer, email, order, or plan"
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Status
              </span>
              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter,
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">
                  All statuses
                </option>
                <option value="PENDING">
                  Pending
                </option>
                <option value="QUALIFIED">
                  Qualified
                </option>
                <option value="REWARDED">
                  Rewarded
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </label>

            <label>
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
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="NEWEST">
                  Newest
                </option>
                <option value="OLDEST">
                  Oldest
                </option>
                <option value="REWARDED_FIRST">
                  Rewarded first
                </option>
                <option value="HIGHEST_REWARD">
                  Highest reward
                </option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Results Per Page
              </span>
              <select
                value={pageSize}
                onChange={(event) =>
                  setPageSize(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="h-14 w-full rounded-2xl border-2 border-slate-400 bg-slate-50 px-5 font-black text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value={10}>
                  10 referrals
                </option>
                <option value={20}>
                  20 referrals
                </option>
                <option value={50}>
                  50 referrals
                </option>
                <option value={100}>
                  100 referrals
                </option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="min-h-14 flex-1 rounded-2xl bg-[#0A2D62] px-6 font-black text-white transition hover:bg-blue-800 disabled:opacity-50"
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
                className="min-h-14 rounded-2xl border-2 border-slate-300 bg-white px-5 font-black text-slate-700"
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

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {referrals.length ===
            0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="text-5xl">
                  🎁
                </p>
                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  No referrals loaded
                </h2>
                <p className="mt-2 text-slate-500">
                  Enter your admin key and
                  apply the filters.
                </p>
              </div>
            ) : (
              referrals.map(
                (referral) => (
                  <button
                    type="button"
                    key={
                      referral.id
                    }
                    onClick={() =>
                      setSelectedReferral(
                        referral,
                      )
                    }
                    className={`w-full rounded-[2rem] border bg-white p-6 text-left shadow-sm transition ${
                      selectedReferral?.id ===
                      referral.id
                        ? "border-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-slate-950">
                            {
                              referral
                                .referrer
                                .name
                            }
                          </h2>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${statusClassName(
                              referral.status,
                            )}`}
                          >
                            {
                              referral.status
                            }
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          Referred{" "}
                          <strong>
                            {
                              referral
                                .referredUser
                                .name
                            }
                          </strong>
                        </p>

                        <p className="mt-2 text-xs font-black text-violet-700">
                          Code:{" "}
                          {
                            referral.referralCode
                          }
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xl font-black text-emerald-700">
                          {formatMoney(
                            referral.referrerRewardPhpCentavos +
                              referral.referredRewardPhpCentavos,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Combined reward
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                      <span>
                        Created:{" "}
                        <strong>
                          {formatDate(
                            referral.createdAt,
                          )}
                        </strong>
                      </span>
                      <span>
                        Plan:{" "}
                        <strong>
                          {referral.qualifyingOrder
                            ?.planName ??
                            "Not qualified"}
                        </strong>
                      </span>
                      <span>
                        Reward entries:{" "}
                        <strong>
                          {
                            referral
                              .rewardTransactions
                              .length
                          }
                        </strong>
                      </span>
                    </div>
                  </button>
                ),
              )
            )}

            {referrals.length >
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
                    matching referral
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
                      void loadReferrals(
                        pagination.page -
                          1,
                      )
                    }
                    className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-black text-slate-700 disabled:opacity-40"
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
                      void loadReferrals(
                        pagination.page +
                          1,
                      )
                    }
                    className="rounded-2xl bg-[#0A2D62] px-5 py-3 font-black text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600">
                Leaderboard
              </p>

              <div className="mt-5 space-y-3">
                {leaderboard.length ===
                0 ? (
                  <p className="text-sm text-slate-500">
                    Load referral data to
                    view the leaderboard.
                  </p>
                ) : (
                  leaderboard.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-950">
                              {index +
                                1}
                              .{" "}
                              {
                                item.name
                              }
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                item.referralCode
                              }
                            </p>
                          </div>

                          <p className="font-black text-emerald-700">
                            {formatMoney(
                              item.rewardsEarnedPhpCentavos,
                            )}
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">
                          {
                            item.totalReferrals
                          }{" "}
                          referrals ·{" "}
                          {
                            item.rewardedReferrals
                          }{" "}
                          rewarded
                        </p>
                      </div>
                    ),
                  )
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Referral Details
              </p>

              {selectedReferral ? (
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Referrer
                    </p>
                    <p className="mt-1 font-black text-slate-950">
                      {
                        selectedReferral
                          .referrer.name
                      }
                    </p>
                    <p className="text-sm text-slate-500">
                      {
                        selectedReferral
                          .referrer.email
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Referred Customer
                    </p>
                    <p className="mt-1 font-black text-slate-950">
                      {
                        selectedReferral
                          .referredUser.name
                      }
                    </p>
                    <p className="text-sm text-slate-500">
                      {
                        selectedReferral
                          .referredUser.email
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Status
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClassName(
                        selectedReferral.status,
                      )}`}
                    >
                      {
                        selectedReferral.status
                      }
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Reward Breakdown
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Referrer:{" "}
                      <strong>
                        {formatMoney(
                          selectedReferral.referrerRewardPhpCentavos,
                        )}
                      </strong>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Referred user:{" "}
                      <strong>
                        {formatMoney(
                          selectedReferral.referredRewardPhpCentavos,
                        )}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Qualifying Order
                    </p>

                    {selectedReferral.qualifyingOrder ? (
                      <>
                        <p className="mt-1 font-black text-slate-950">
                          {
                            selectedReferral
                              .qualifyingOrder
                              .planName
                          }
                        </p>
                        <p className="mt-1 break-all text-xs font-semibold text-blue-700">
                          {
                            selectedReferral
                              .qualifyingOrder
                              .referenceNumber
                          }
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">
                        No qualifying order
                        yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Timeline
                    </p>

                    <div className="mt-2 space-y-2 text-sm text-slate-600">
                      <p>
                        Created:{" "}
                        {formatDate(
                          selectedReferral.createdAt,
                        )}
                      </p>
                      <p>
                        Qualified:{" "}
                        {formatDate(
                          selectedReferral.qualifiedAt,
                        )}
                      </p>
                      <p>
                        Rewarded:{" "}
                        {formatDate(
                          selectedReferral.rewardedAt,
                        )}
                      </p>
                      <p>
                        Cancelled:{" "}
                        {formatDate(
                          selectedReferral.cancelledAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-slate-500">
                  Select a referral to
                  view the full details.
                </p>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}