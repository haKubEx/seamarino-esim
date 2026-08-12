"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

type ReferralStatus =
  | "PENDING"
  | "QUALIFIED"
  | "REWARDED"
  | "CANCELLED";

type ReferralRecord = {
  id: string;
  referralCode: string;
  status: ReferralStatus;

  referrerRewardPhpCentavos:
    number;

  referredRewardPhpCentavos:
    number;

  qualifiedAt:
    | string
    | null;

  rewardedAt:
    | string
    | null;

  cancelledAt:
    | string
    | null;

  createdAt: string;

  referredUser: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };

  qualifyingOrder: {
    referenceNumber: string;
    planName: string;
    amountPhpCentavos:
      number;

    paymentStatus: string;
    esimStatus: string;
    status: string;

    completedAt:
      | string
      | null;
  } | null;
};

type ReferralReceived = {
  id: string;
  referralCode: string;
  status: ReferralStatus;

  referrerRewardPhpCentavos:
    number;

  referredRewardPhpCentavos:
    number;

  qualifiedAt:
    | string
    | null;

  rewardedAt:
    | string
    | null;

  createdAt: string;

  referrer: {
    name: string;
    email: string;
  };
};

type CreditTransaction = {
  id: string;

  type:
    | "REFERRAL_REWARD"
    | "MANUAL_ADJUSTMENT"
    | "ORDER_PAYMENT"
    | "REFUND"
    | "EXPIRATION";

  amountPhpCentavos:
    number;

  balanceBeforePhpCentavos:
    number;

  balanceAfterPhpCentavos:
    number;

  description:
    | string
    | null;

  expiresAt:
    | string
    | null;

  createdAt: string;

  referral: {
    referralCode: string;
    status: ReferralStatus;
  } | null;

  order: {
    referenceNumber: string;
    planName: string;
  } | null;
};

type ReferralDashboardData = {
  user: {
    id: string;
    name: string;
    email: string;

    referralCode:
      | string
      | null;

    storeCreditPhpCentavos:
      number;
  };

  stats: {
    totalReferrals: number;
    pendingCount: number;
    qualifiedCount: number;
    rewardedCount: number;
    cancelledCount: number;
    totalEarnedCentavos:
      number;
  };

  referrals:
    ReferralRecord[];

  referralReceived:
    | ReferralReceived
    | null;

  transactions:
    CreditTransaction[];
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

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getStatusClass(
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

function getTransactionClass(
  amountCentavos: number,
) {
  return amountCentavos >= 0
    ? "text-emerald-700"
    : "text-red-700";
}

export default function ReferralDashboardClient({
  data,
}: {
  data: ReferralDashboardData;
}) {
  const [
    copiedValue,
    setCopiedValue,
  ] = useState("");

  /*
   * Keep the initial server render and
   * initial client render identical.
   *
   * The browser origin is added only
   * after hydration finishes.
   */
  const [
    baseUrl,
    setBaseUrl,
  ] = useState("");

  useEffect(() => {
    setBaseUrl(
      window.location.origin,
    );
  }, []);

  const relativeReferralLink =
    data.user.referralCode
      ? `/register?ref=${encodeURIComponent(
          data.user.referralCode,
        )}`
      : "";

  const referralLink =
    baseUrl &&
    relativeReferralLink
      ? `${baseUrl}${relativeReferralLink}`
      : relativeReferralLink;

  const shareMessage =
    data.user.referralCode &&
    referralLink
      ? `Join Seamarino eSIM using my referral code ${data.user.referralCode}: ${referralLink}`
      : "";

  /*
   * Share links remain empty during
   * server rendering and the first client
   * render. This prevents hydration mismatch.
   */
  const facebookLink =
    baseUrl &&
    referralLink
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLink,
        )}`
      : "";

  const whatsappLink =
    baseUrl &&
    shareMessage
      ? `https://wa.me/?text=${encodeURIComponent(
          shareMessage,
        )}`
      : "";

  async function copyText(
    value: string,
    label: string,
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopiedValue(label);

      window.setTimeout(
        () => {
          setCopiedValue("");
        },
        1500,
      );
    } catch {
      setCopiedValue("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                Referral Rewards
              </p>

              <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                Invite friends and
                earn store credit
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
                Share your referral
                link. Rewards are
                added after your
                friend completes a
                qualifying eSIM
                purchase of at least
                10GB and the eSIM is
                successfully delivered.
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
                href="/shop"
                className="rounded-2xl bg-white px-5 py-3 font-black text-[#0A2D62]"
              >
                Browse Plans
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Store Credit
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-700">
              {formatMoney(
                data.user
                  .storeCreditPhpCentavos,
              )}
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Friends Invited
            </p>

            <p className="mt-3 text-4xl font-black text-slate-950">
              {
                data.stats
                  .totalReferrals
              }
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Rewarded
            </p>

            <p className="mt-3 text-4xl font-black text-blue-700">
              {
                data.stats
                  .rewardedCount
              }
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Total Earned
            </p>

            <p className="mt-3 text-3xl font-black text-violet-700">
              {formatMoney(
                data.stats
                  .totalEarnedCentavos,
              )}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Your Referral Code
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Share and earn
            </h2>

            {data.user.referralCode ? (
              <>
                <div className="mt-7 rounded-3xl border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    Referral Code
                  </p>

                  <p className="mt-3 break-all font-mono text-3xl font-black tracking-[0.14em] text-[#0A2D62] sm:text-4xl">
                    {
                      data.user
                        .referralCode
                    }
                  </p>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="referralLink"
                    className="mb-2 block text-sm font-black text-slate-900"
                  >
                    Referral Link
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="referralLink"
                      readOnly
                      value={
                        referralLink
                      }
                      className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 font-semibold text-slate-700"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        void copyText(
                          referralLink,
                          "link",
                        );
                      }}
                      className="rounded-2xl bg-[#0A2D62] px-6 py-3 font-black text-white"
                    >
                      {copiedValue ===
                      "link"
                        ? "Copied"
                        : "Copy Link"}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void copyText(
                        data.user
                          .referralCode ??
                          "",
                        "code",
                      );
                    }}
                    className="rounded-2xl border-2 border-[#0A2D62] bg-white px-5 py-3 font-black text-[#0A2D62]"
                  >
                    {copiedValue ===
                    "code"
                      ? "Copied"
                      : "Copy Code"}
                  </button>

                  {facebookLink ? (
                    <a
                      href={
                        facebookLink
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-700"
                    >
                      Share Facebook
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-2xl bg-blue-300 px-5 py-3 font-black text-white">
                      Share Facebook
                    </span>
                  )}

                  {whatsappLink ? (
                    <a
                      href={
                        whatsappLink
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700"
                    >
                      Share WhatsApp
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-2xl bg-emerald-300 px-5 py-3 font-black text-white">
                      Share WhatsApp
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-7 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
                Your account does not
                have a referral code
                yet. Existing accounts
                created before the
                referral system may
                need a referral-code
                backfill.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Referral Status
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase text-amber-700">
                    Pending
                  </p>

                  <p className="mt-2 text-3xl font-black text-amber-950">
                    {
                      data.stats
                        .pendingCount
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase text-blue-700">
                    Qualified
                  </p>

                  <p className="mt-2 text-3xl font-black text-blue-950">
                    {
                      data.stats
                        .qualifiedCount
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase text-emerald-700">
                    Rewarded
                  </p>

                  <p className="mt-2 text-3xl font-black text-emerald-950">
                    {
                      data.stats
                        .rewardedCount
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-xs font-black uppercase text-red-700">
                    Cancelled
                  </p>

                  <p className="mt-2 text-3xl font-black text-red-950">
                    {
                      data.stats
                        .cancelledCount
                    }
                  </p>
                </div>
              </div>
            </section>

            {data.referralReceived && (
              <section className="rounded-[2rem] border border-violet-200 bg-violet-50 p-6">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">
                  You Were Referred By
                </p>

                <p className="mt-3 text-xl font-black text-violet-950">
                  {
                    data
                      .referralReceived
                      .referrer.name
                  }
                </p>

                <p className="mt-1 text-sm text-violet-700">
                  Code:{" "}
                  {
                    data
                      .referralReceived
                      .referralCode
                  }
                </p>

                <span
                  className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                    data
                      .referralReceived
                      .status,
                  )}`}
                >
                  {
                    data
                      .referralReceived
                      .status
                  }
                </span>
              </section>
            )}
          </aside>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Friends You Invited
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Referral History
            </h2>
          </div>

          {data.referrals.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-5xl">
                🎁
              </p>

              <h3 className="mt-5 text-2xl font-black text-slate-950">
                No referrals yet
              </h3>

              <p className="mt-2 text-slate-500">
                Share your referral
                link to begin earning
                store credit.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.referrals.map(
                (referral) => (
                  <article
                    key={
                      referral.id
                    }
                    className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-slate-950">
                          {
                            referral
                              .referredUser
                              .name
                          }
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                            referral.status,
                          )}`}
                        >
                          {
                            referral.status
                          }
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {
                          referral
                            .referredUser
                            .email
                        }
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Joined{" "}
                        {formatDate(
                          referral
                            .referredUser
                            .createdAt,
                        )}
                      </p>

                      {referral.qualifyingOrder && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="font-black text-slate-900">
                            {
                              referral
                                .qualifyingOrder
                                .planName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              referral
                                .qualifyingOrder
                                .referenceNumber
                            }
                          </p>

                          <p className="mt-2 font-black text-slate-800">
                            {formatMoney(
                              referral
                                .qualifyingOrder
                                .amountPhpCentavos,
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="lg:text-right">
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                        Your Reward
                      </p>

                      <p className="mt-2 text-2xl font-black text-emerald-700">
                        {formatMoney(
                          referral
                            .referrerRewardPhpCentavos,
                        )}
                      </p>

                      <p className="mt-4 text-sm text-slate-500">
                        Rewarded:{" "}
                        {formatDate(
                          referral.rewardedAt,
                        )}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Store Credit
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Credit Transactions
            </h2>
          </div>

          {data.transactions.length ===
          0 ? (
            <div className="px-6 py-14 text-center text-slate-500">
              No store-credit
              transactions yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.transactions.map(
                (transaction) => (
                  <article
                    key={
                      transaction.id
                    }
                    className="grid gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8"
                  >
                    <div>
                      <p className="font-black text-slate-950">
                        {transaction.description ||
                          transaction.type.replaceAll(
                            "_",
                            " ",
                          )}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatDate(
                          transaction.createdAt,
                        )}
                      </p>

                      {transaction.order && (
                        <p className="mt-2 text-sm text-slate-500">
                          {
                            transaction
                              .order
                              .referenceNumber
                          }{" "}
                          ·{" "}
                          {
                            transaction
                              .order
                              .planName
                          }
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <p
                        className={`text-xl font-black ${getTransactionClass(
                          transaction
                            .amountPhpCentavos,
                        )}`}
                      >
                        {transaction
                          .amountPhpCentavos >=
                        0
                          ? "+"
                          : ""}
                        {formatMoney(
                          transaction
                            .amountPhpCentavos,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Balance:{" "}
                        {formatMoney(
                          transaction
                            .balanceAfterPhpCentavos,
                        )}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}