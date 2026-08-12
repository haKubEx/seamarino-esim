import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

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
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(value);
}

function getStatusClass(
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PROCESSING":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export const dynamic =
  "force-dynamic";

export default async function AccountPage() {
  const session =
    await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/account",
    );
  }

  const [
    user,
    orders,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id:
          session.user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        storeCreditPhpCentavos:
          true,
      },
    }),

    prisma.order.findMany({
      where: {
        userId:
          session.user.id,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      select: {
        id: true,
        referenceNumber: true,
        planName: true,
        packageCode: true,
        amountPhpCentavos: true,
        status: true,
        paymentStatus: true,
        esimStatus: true,
        createdAt: true,
        completedAt: true,
        iccid: true,
        qrCodeUrl: true,
      },
    }),
  ]);

  if (!user) {
    redirect(
      "/login?callbackUrl=/account",
    );
  }

  const totalOrders =
    orders.length;

  const completedOrders =
    orders.filter(
      (order) =>
        order.status ===
          "COMPLETED" ||
        order.esimStatus ===
          "DELIVERED",
    ).length;

  const processingOrders =
    orders.filter(
      (order) =>
        order.status ===
          "PROCESSING" ||
        order.esimStatus ===
          "PROCESSING" ||
        order.esimStatus ===
          "ISSUED",
    ).length;

  const activeEsims =
    orders.filter(
      (order) =>
        order.esimStatus ===
          "DELIVERED" &&
        Boolean(
          order.iccid ||
            order.qrCodeUrl,
        ),
    ).length;

  const totalSpentCentavos =
    orders.reduce(
      (
        total,
        order,
      ) =>
        total +
        (
          order.paymentStatus ===
          "PAID"
            ? order
                .amountPhpCentavos
            : 0
        ),
      0,
    );

  const recentOrders =
    orders.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-[1500px]">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                Customer Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                Welcome,{" "}
                {user.name ||
                  "Customer"}
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
                View your purchases,
                monitor processing
                orders, access your
                eSIM installation
                details, and manage
                referral rewards.
              </p>

              <p className="mt-3 text-sm font-semibold text-blue-200">
                Signed in as{" "}
                {user.email}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/account/referrals"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-black text-white transition hover:bg-white/20"
              >
                Referral Rewards
              </Link>

              <Link
                href="/account/wallet"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-black text-white transition hover:bg-white/20"
              >
                My Wallet
              </Link>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 font-black text-[#0A2D62] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Buy Another eSIM
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-h-[170px] min-w-0 flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Total Orders
            </p>

            <p className="mt-3 text-4xl font-black text-slate-950">
              {totalOrders}
            </p>
          </div>

          <div className="flex min-h-[170px] min-w-0 flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Completed
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-700">
              {completedOrders}
            </p>
          </div>

          <div className="flex min-h-[170px] min-w-0 flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Processing
            </p>

            <p className="mt-3 text-4xl font-black text-blue-700">
              {processingOrders}
            </p>
          </div>

          <div className="flex min-h-[170px] min-w-0 flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Active eSIMs
            </p>

            <p className="mt-3 text-4xl font-black text-violet-700">
              {activeEsims}
            </p>
          </div>

          <Link
            href="/account/wallet"
            className="flex min-h-[170px] min-w-0 flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Store Credit
            </p>

            <p className="mt-3 break-words text-[clamp(1.35rem,2.2vw,2rem)] font-black leading-tight tracking-tight text-emerald-700">
              {formatMoney(
                user
                  .storeCreditPhpCentavos,
              )}
            </p>

          </Link>

          <div className="flex min-h-[170px] min-w-0 flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Total Purchases
            </p>

            <p className="mt-3 break-words text-[clamp(1.25rem,2vw,1.9rem)] font-black leading-tight tracking-tight text-slate-950">
              {formatMoney(
                totalSpentCentavos,
              )}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Recent Activity
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Recent Orders
                </h2>
              </div>

              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-[#0A2D62] bg-white px-5 py-3 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
              >
                View All Orders
              </Link>
            </div>

            {recentOrders.length ===
            0 ? (
              <div className="px-6 py-16 text-center sm:px-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  📦
                </div>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  No orders yet
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
                  Your eSIM purchases
                  will appear here
                  after checkout.
                </p>

                <Link
                  href="/shop"
                  className="mt-7 inline-flex rounded-2xl bg-[#0A2D62] px-7 py-3.5 font-black text-white"
                >
                  Browse Plans
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map(
                  (order) => (
                    <article
                      key={
                        order.id
                      }
                      className="grid gap-5 p-6 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8"
                    >
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {
                              order.referenceNumber
                            }
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {
                              order.packageCode
                            }
                          </span>
                        </div>

                        <h3 className="mt-4 text-xl font-black text-slate-950">
                          {
                            order.planName
                          }
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {formatDate(
                            order.createdAt,
                          )}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              order.paymentStatus,
                            )}`}
                          >
                            Payment:{" "}
                            {
                              order.paymentStatus
                            }
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              order.esimStatus,
                            )}`}
                          >
                            eSIM:{" "}
                            {
                              order.esimStatus
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        <p className="text-xl font-black text-slate-950">
                          {formatMoney(
                            order
                              .amountPhpCentavos,
                          )}
                        </p>

                        <Link
                          href={`/account/orders/${encodeURIComponent(
                            order.referenceNumber,
                          )}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#0A2D62] px-5 py-3 font-black text-white transition hover:bg-blue-800"
                        >
                          {order.esimStatus ===
                          "DELIVERED"
                            ? "View eSIM"
                            : "View Status"}
                        </Link>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Quick Actions
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/account/orders"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  View My Orders
                </Link>

                <Link
                  href="/account/referrals"
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-black text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                >
                  Referral Rewards
                </Link>

                <Link
                  href="/account/wallet"
                  className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 font-black text-violet-800 transition hover:border-violet-400 hover:bg-violet-100"
                >
                  My Wallet
                </Link>

                <Link
                  href="/account/change-password"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Change Password
                </Link>

                <Link
                  href="/shop"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Browse eSIM Plans
                </Link>

                <Link
                  href="/faq"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Installation Help
                </Link>

                <Link
                  href="/contact"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Contact Support
                </Link>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                Referral Rewards
              </p>

              <h2 className="mt-3 text-xl font-black text-emerald-950">
                Invite friends and
                earn credit
              </h2>

              <p className="mt-3 text-sm leading-7 text-emerald-800">
                Your current store
                credit is{" "}
                <strong>
                  {formatMoney(
                    user
                      .storeCreditPhpCentavos,
                  )}
                </strong>
                . Share your referral
                code and earn rewards
                after qualifying eSIM
                deliveries.
              </p>

              {user.referralCode && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                    Your Code
                  </p>

                  <p className="mt-2 break-all font-mono text-xl font-black tracking-wider text-emerald-950">
                    {
                      user.referralCode
                    }
                  </p>
                </div>
              )}

              <Link
                href="/account/referrals"
                className="mt-5 inline-flex rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white transition hover:bg-emerald-800"
              >
                Open Referral Rewards
              </Link>
            </section>

            {processingOrders > 0 && (
              <section className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                  Processing
                </p>

                <h2 className="mt-3 text-xl font-black text-blue-950">
                  Your eSIM is being
                  prepared
                </h2>

                <p className="mt-3 text-sm leading-7 text-blue-800">
                  You currently have{" "}
                  {processingOrders}{" "}
                  order
                  {processingOrders ===
                  1
                    ? ""
                    : "s"}{" "}
                  still being
                  processed. Open My
                  Orders to check the
                  latest status.
                </p>

                <Link
                  href="/account/orders"
                  className="mt-5 inline-flex rounded-2xl bg-blue-700 px-5 py-3 font-black text-white"
                >
                  Check Status
                </Link>
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}