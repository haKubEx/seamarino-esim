"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

type WalletTransaction = {
  id: string;
  type: string;
  amountPhpCentavos: number;
  balanceBeforePhpCentavos: number;
  balanceAfterPhpCentavos: number;
  description: string | null;
  orderId: string | null;
  referralId: string | null;
  expiresAt: string | null;
  createdAt: string;
  order: {
    referenceNumber: string;
    planName: string;
  } | null;
};

type WalletData = {
  customer: {
    id: string;
    name: string;
    email: string;
    availableBalancePhpCentavos: number;
  };
  stats: {
    totalEarnedPhpCentavos: number;
    totalUsedPhpCentavos: number;
    totalRestoredPhpCentavos: number;
    totalTransactions: number;
  };
  transactions: WalletTransaction[];
};

type FilterValue =
  | "ALL"
  | "EARNED"
  | "USED"
  | "RESTORED";

function formatMoney(amountPhpCentavos: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPhpCentavos / 100);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function humanizeType(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTransactionLabel(transaction: WalletTransaction) {
  if (transaction.description?.trim()) {
    return transaction.description;
  }

  switch (transaction.type) {
    case "REFERRAL_REWARD":
      return "Referral reward";
    case "ORDER_PAYMENT":
      return "Store credit used for an order";
    case "REFUND":
      return "Store credit restored";
    case "MANUAL_ADJUSTMENT":
      return "Manual wallet adjustment";
    case "EXPIRATION":
      return "Store credit expired";
    default:
      return humanizeType(transaction.type);
  }
}

function getTransactionCategory(
  transaction: WalletTransaction,
): Exclude<FilterValue, "ALL"> {
  if (
    transaction.type === "REFUND" &&
    transaction.amountPhpCentavos > 0
  ) {
    return "RESTORED";
  }

  if (transaction.amountPhpCentavos < 0) {
    return "USED";
  }

  return "EARNED";
}

function SummaryCard({
  label,
  value,
  caption,
  valueClassName,
}: {
  label: string;
  value: string;
  caption: string;
  valueClassName: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className={`mt-3 text-3xl font-black ${valueClassName}`}>
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {caption}
      </p>
    </article>
  );
}

export default function WalletClient({
  data,
}: {
  data: WalletData;
}) {
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const visibleTransactions = useMemo(
    () =>
      data.transactions.filter((transaction) => {
        const category = getTransactionCategory(transaction);
        const matchesFilter =
          filter === "ALL" || filter === category;

        const searchableText = [
          getTransactionLabel(transaction),
          transaction.type,
          transaction.order?.referenceNumber,
          transaction.order?.planName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(normalizedSearch);

        return matchesFilter && matchesSearch;
      }),
    [data.transactions, filter, normalizedSearch],
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                Seamarino Wallet
              </p>

              <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                Store credit and rewards
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
                Review referral rewards, order deductions, restored
                credit, and your current available balance.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/account"
                className="rounded-2xl border border-white/30 px-5 py-3 font-black text-white transition hover:bg-white/10"
              >
                Account Dashboard
              </Link>

              <Link
                href="/account/referrals"
                className="rounded-2xl bg-white px-5 py-3 font-black text-[#0A2D62]"
              >
                Referral Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Available Balance"
            value={formatMoney(
              data.customer.availableBalancePhpCentavos,
            )}
            caption="Credit available for eligible 10GB+ eSIM orders."
            valueClassName="text-emerald-700"
          />

          <SummaryCard
            label="Total Earned"
            value={formatMoney(
              data.stats.totalEarnedPhpCentavos,
            )}
            caption="Referral rewards and other positive credits."
            valueClassName="text-violet-700"
          />

          <SummaryCard
            label="Total Used"
            value={formatMoney(
              data.stats.totalUsedPhpCentavos,
            )}
            caption="Credit applied to purchases or adjustments."
            valueClassName="text-red-700"
          />

          <SummaryCard
            label="Total Restored"
            value={formatMoney(
              data.stats.totalRestoredPhpCentavos,
            )}
            caption="Credit returned from cancelled or failed checkouts."
            valueClassName="text-blue-700"
          />
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Transaction History
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Wallet activity
              </h2>

              <p className="mt-2 text-slate-500">
                {data.stats.totalTransactions} recorded transaction
                {data.stats.totalTransactions === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, plan, or description..."
                className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-slate-300 bg-white px-4 font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as FilterValue)
                }
                className="h-12 rounded-2xl border-2 border-slate-300 bg-white px-4 font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">All activity</option>
                <option value="EARNED">Earned</option>
                <option value="USED">Used</option>
                <option value="RESTORED">Restored</option>
              </select>
            </div>
          </div>

          {visibleTransactions.length === 0 ? (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <p className="text-5xl">💳</p>

              <h3 className="mt-5 text-2xl font-black text-slate-950">
                No wallet activity found
              </h3>

              <p className="mt-2 text-slate-500">
                Referral rewards, order deductions, and restored
                credit will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
              <div className="divide-y divide-slate-100">
                {visibleTransactions.map((transaction) => {
                  const category =
                    getTransactionCategory(transaction);

                  const amountClass =
                    category === "USED"
                      ? "text-red-700"
                      : category === "RESTORED"
                        ? "text-blue-700"
                        : "text-emerald-700";

                  const iconClass =
                    category === "USED"
                      ? "bg-red-100 text-red-700"
                      : category === "RESTORED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700";

                  return (
                    <article
                      key={transaction.id}
                      className="grid gap-5 bg-white p-5 transition hover:bg-slate-50 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${iconClass}`}
                      >
                        {transaction.amountPhpCentavos < 0 ? "−" : "+"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">
                            {getTransactionLabel(transaction)}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {humanizeType(transaction.type)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {formatDate(transaction.createdAt)}
                        </p>

                        {transaction.order && (
                          <Link
                            href={`/account/orders/${encodeURIComponent(
                              transaction.order.referenceNumber,
                            )}`}
                            className="mt-2 inline-flex break-all text-sm font-bold text-blue-700 hover:underline"
                          >
                            {transaction.order.referenceNumber} ·{" "}
                            {transaction.order.planName}
                          </Link>
                        )}

                        {transaction.expiresAt && (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            Expires {formatDate(transaction.expiresAt)}
                          </p>
                        )}
                      </div>

                      <div className="lg:text-right">
                        <p className={`text-xl font-black ${amountClass}`}>
                          {transaction.amountPhpCentavos > 0 ? "+" : ""}
                          {formatMoney(transaction.amountPhpCentavos)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Balance:{" "}
                          {formatMoney(
                            transaction.balanceAfterPhpCentavos,
                          )}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">
              Using your credit
            </p>

            <h2 className="mt-3 text-2xl font-black text-blue-950">
              Apply credit at checkout
            </h2>

            <p className="mt-3 leading-7 text-blue-800">
              Sign in, select an eligible plan with at least 10GB,
              and enable Use Store Credit before proceeding to
              PayMongo.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-2xl bg-[#0A2D62] px-5 py-3 font-black text-white"
            >
              Browse eSIM Plans
            </Link>
          </article>

          <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
              Earn more
            </p>

            <h2 className="mt-3 text-2xl font-black text-emerald-950">
              Invite friends to Seamarino
            </h2>

            <p className="mt-3 leading-7 text-emerald-800">
              Referral rewards are added after a referred customer
              completes a qualifying 10GB+ purchase and the eSIM is
              successfully delivered.
            </p>

            <Link
              href="/account/referrals"
              className="mt-6 inline-flex rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white"
            >
              Open Referral Dashboard
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}