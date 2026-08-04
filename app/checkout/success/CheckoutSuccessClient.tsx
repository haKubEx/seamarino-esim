"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderStatusResponse = {
  success: boolean;
  error?: string;

  referenceNumber?: string;
  status?: string;
  paymentStatus?: string;
  esimStatus?: string;

  planName?: string;
  packageCode?: string;

  createdAt?: string;
  paidAt?: string | null;
  completedAt?: string | null;

  amountPhpCentavos?: number;

  qrCode?: string | null;
  qrCodeUrl?: string | null;
  activationCode?: string | null;
  smdpAddress?: string | null;
  smdpStatus?: string | null;
  iccid?: string | null;
  apn?: string | null;
  supplierEsimStatus?: string | null;

  lastError?: string | null;
};

type CheckoutSuccessClientProps = {
  reference: string;
};

type ProgressStep = {
  title: string;
  description: string;
  state:
    | "complete"
    | "active"
    | "waiting"
    | "failed";
};

const POLLING_INTERVAL_MS = 5000;
const REDIRECT_DELAY_MS = 2500;

function CheckIcon({
  className = "h-7 w-7",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path
        d="M12 7v5l3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon({
  spinning = false,
}: {
  spinning?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-5 w-5 ${
        spinning
          ? "animate-spin"
          : ""
      }`}
      aria-hidden="true"
    >
      <path
        d="M20 11a8 8 0 1 0 2 5"
        strokeLinecap="round"
      />

      <path
        d="M20 4v7h-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
      />

      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatMoney(
  amountCentavos?: number,
) {
  if (
    typeof amountCentavos !==
      "number" ||
    !Number.isFinite(
      amountCentavos,
    )
  ) {
    return "—";
  }

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

  const date = new Date(value);

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

function getStatusBadgeClass(
  status?: string,
) {
  switch (status) {
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

function getProgressSteps(
  order: OrderStatusResponse | null,
): ProgressStep[] {
  const paymentStatus =
    order?.paymentStatus ?? "PENDING";

  const esimStatus =
    order?.esimStatus ??
    "NOT_ORDERED";

  const failed =
    paymentStatus === "FAILED" ||
    paymentStatus === "CANCELLED" ||
    esimStatus === "FAILED";

  const paymentReceived =
    paymentStatus === "PAID";

  const orderingStarted =
    paymentReceived &&
    [
      "PROCESSING",
      "ISSUED",
      "DELIVERED",
    ].includes(esimStatus);

  const profileIssued =
    [
      "ISSUED",
      "DELIVERED",
    ].includes(esimStatus);

  const delivered =
    esimStatus === "DELIVERED";

  return [
    {
      title: "Payment received",
      description:
        "Your payment has been confirmed securely.",
      state: failed
        ? "failed"
        : paymentReceived
          ? "complete"
          : "active",
    },
    {
      title: "Ordering eSIM",
      description:
        "Your selected data package is being submitted to our supplier.",
      state: failed
        ? "failed"
        : orderingStarted
          ? profileIssued
            ? "complete"
            : "active"
          : "waiting",
    },
    {
      title: "Creating profile",
      description:
        "Your QR code and activation details are being generated.",
      state: failed
        ? "failed"
        : profileIssued
          ? "complete"
          : orderingStarted
            ? "active"
            : "waiting",
    },
    {
      title: "Ready to install",
      description:
        "Your eSIM is available securely in your customer account.",
      state: failed
        ? "failed"
        : delivered
          ? "complete"
          : profileIssued
            ? "active"
            : "waiting",
    },
  ];
}

function ProgressItem({
  step,
  isLast,
}: {
  step: ProgressStep;
  isLast: boolean;
}) {
  const circleClass =
    step.state === "complete"
      ? "border-emerald-500 bg-emerald-500 text-white"
      : step.state === "active"
        ? "border-blue-600 bg-blue-600 text-white"
        : step.state === "failed"
          ? "border-red-500 bg-red-500 text-white"
          : "border-slate-300 bg-white text-slate-400";

  const lineClass =
    step.state === "complete"
      ? "bg-emerald-300"
      : step.state === "failed"
        ? "bg-red-200"
        : "bg-slate-200";

  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${circleClass}`}
        >
          {step.state ===
          "complete" ? (
            <CheckIcon className="h-5 w-5" />
          ) : step.state ===
            "active" ? (
            <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
          ) : step.state ===
            "failed" ? (
            <span className="text-lg font-black">
              !
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          )}
        </div>

        {!isLast && (
          <div
            className={`min-h-12 w-0.5 flex-1 ${lineClass}`}
          />
        )}
      </div>

      <div className="pb-7 pt-1">
        <h3
          className={`font-black ${
            step.state ===
            "waiting"
              ? "text-slate-500"
              : step.state ===
                  "failed"
                ? "text-red-800"
                : "text-slate-950"
          }`}
        >
          {step.title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {step.description}
        </p>
      </div>
    </li>
  );
}

export default function CheckoutSuccessClient({
  reference,
}: CheckoutSuccessClientProps) {
  const router = useRouter();

  const [
    order,
    setOrder,
  ] =
    useState<OrderStatusResponse | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(reference),
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    unauthorized,
    setUnauthorized,
  ] = useState(false);

  const [
    notFound,
    setNotFound,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    redirectCountdown,
    setRedirectCountdown,
  ] = useState<number | null>(
    null,
  );

  const redirectStartedRef =
    useRef(false);

  const ready =
    order?.esimStatus ===
      "ISSUED" ||
    order?.esimStatus ===
      "DELIVERED";

  const failed =
    order?.esimStatus ===
      "FAILED" ||
    order?.paymentStatus ===
      "FAILED" ||
    order?.paymentStatus ===
      "CANCELLED";

  const progressSteps =
    useMemo(
      () =>
        getProgressSteps(order),
      [order],
    );

  const orderDetailsUrl =
    reference
      ? `/account/orders/${encodeURIComponent(
          reference,
        )}`
      : "/account/orders";

  const loginCallbackUrl =
    reference
      ? `/checkout/success?reference=${encodeURIComponent(
          reference,
        )}`
      : "/checkout/success";

  const loadStatus =
    useCallback(
      async ({
        manual = false,
      }: {
        manual?: boolean;
      } = {}) => {
        if (!reference) {
          setLoading(false);
          setError(
            "The order reference is missing from this page.",
          );

          return;
        }

        if (manual) {
          setRefreshing(true);
        }

        try {
          const response =
            await fetch(
              `/api/order-status?reference=${encodeURIComponent(
                reference,
              )}`,
              {
                method: "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
              },
            );

          const data =
            (await response.json()) as OrderStatusResponse;

          if (
            response.status === 401
          ) {
            setUnauthorized(true);
            setNotFound(false);
            setOrder(null);
            setError("");

            return;
          }

          if (
            response.status === 404
          ) {
            setNotFound(true);
            setUnauthorized(false);
            setOrder(null);
            setError("");

            return;
          }

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                "Unable to retrieve your order status.",
            );
          }

          setOrder(data);
          setUnauthorized(false);
          setNotFound(false);
          setError("");
        } catch (caughtError) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to retrieve your order status.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [reference],
    );

  useEffect(() => {
    void loadStatus();

    if (!reference) {
      return;
    }

    const pollTimer =
      window.setInterval(() => {
        if (
          !ready &&
          !failed &&
          !unauthorized &&
          !notFound
        ) {
          void loadStatus();
        }
      }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(
        pollTimer,
      );
    };
  }, [
    failed,
    loadStatus,
    notFound,
    ready,
    reference,
    unauthorized,
  ]);

  useEffect(() => {
    if (
      !ready ||
      redirectStartedRef.current
    ) {
      return;
    }

    redirectStartedRef.current =
      true;

    setRedirectCountdown(3);

    const countdownTimer =
      window.setInterval(() => {
        setRedirectCountdown(
          (current) => {
            if (
              current === null ||
              current <= 1
            ) {
              return 0;
            }

            return current - 1;
          },
        );
      }, 1000);

    const redirectTimer =
      window.setTimeout(() => {
        router.push(
          orderDetailsUrl,
        );

        router.refresh();
      }, REDIRECT_DELAY_MS);

    return () => {
      window.clearInterval(
        countdownTimer,
      );

      window.clearTimeout(
        redirectTimer,
      );
    };
  }, [
    orderDetailsUrl,
    ready,
    router,
  ]);

  async function copyReference() {
    if (!reference) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        reference,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 px-6 py-12 text-center text-white sm:px-10 sm:py-16">
            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-white/15 text-white shadow-xl ${
                failed
                  ? "bg-red-500"
                  : ready
                    ? "bg-emerald-400"
                    : "bg-blue-500"
              }`}
            >
              {failed ? (
                <span className="text-4xl font-black">
                  !
                </span>
              ) : ready ? (
                <CheckIcon className="h-10 w-10" />
              ) : (
                <ClockIcon />
              )}
            </div>

            <p
              className={`mt-7 text-sm font-black uppercase tracking-[0.25em] ${
                failed
                  ? "text-red-200"
                  : ready
                    ? "text-emerald-300"
                    : "text-sky-300"
              }`}
            >
              {failed
                ? "Order needs attention"
                : ready
                  ? "eSIM ready"
                  : "Payment submitted"}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {failed
                ? "We could not complete your order"
                : ready
                  ? "Your eSIM is ready"
                  : "Thank you for your order"}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
              {failed
                ? "Please review the message below or contact Seamarino support for assistance."
                : ready
                  ? "Your QR code and installation details are now available securely in your account."
                  : "We are confirming your payment and preparing your eSIM. This page checks the status automatically."}
            </p>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-4xl">
              {reference ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Order reference
                  </p>

                  <p className="mt-3 break-all font-mono text-base font-black text-slate-950 sm:text-lg">
                    {reference}
                  </p>

                  <button
                    type="button"
                    onClick={
                      copyReference
                    }
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <CopyIcon />

                    {copied
                      ? "Reference copied"
                      : "Copy reference"}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                  <p className="font-black text-red-800">
                    Missing order
                    reference
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    Return to your
                    checkout confirmation
                    link or open My Orders.
                  </p>
                </div>
              )}

              {loading && (
                <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                  <p className="mt-5 text-center font-black text-slate-800">
                    Checking your order
                    status…
                  </p>
                </div>
              )}

              {!loading &&
                unauthorized && (
                  <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
                    <h2 className="text-xl font-black text-amber-950">
                      Sign in to continue
                      tracking
                    </h2>

                    <p className="mt-3 leading-7 text-amber-800">
                      Your order details
                      are protected. Sign
                      in using the account
                      connected to this
                      purchase.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(
                          loginCallbackUrl,
                        )}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#0A2D62] px-7 py-3.5 font-black text-white transition hover:bg-blue-800"
                      >
                        Sign In
                      </Link>

                      <Link
                        href="/register"
                        className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-7 py-3.5 font-black text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                )}

              {!loading &&
                notFound && (
                  <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
                    <h2 className="text-xl font-black text-amber-950">
                      Order not found in
                      this account
                    </h2>

                    <p className="mt-3 leading-7 text-amber-800">
                      Confirm that you are
                      signed in with the
                      email address used
                      during checkout.
                    </p>

                    <Link
                      href="/account/orders"
                      className="mt-6 inline-flex rounded-2xl bg-[#0A2D62] px-7 py-3.5 font-black text-white"
                    >
                      Open My Orders
                    </Link>
                  </div>
                )}

              {!loading &&
                error && (
                  <div className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 sm:p-8">
                    <h2 className="text-xl font-black text-red-950">
                      Status temporarily
                      unavailable
                    </h2>

                    <p className="mt-3 leading-7 text-red-800">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void loadStatus({
                          manual: true,
                        })
                      }
                      disabled={
                        refreshing
                      }
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-7 py-3.5 font-black text-white disabled:opacity-50"
                    >
                      <RefreshIcon
                        spinning={
                          refreshing
                        }
                      />

                      Try Again
                    </button>
                  </div>
                )}

              {!loading &&
                order &&
                !unauthorized &&
                !notFound && (
                  <>
                    <section className="mt-8 grid gap-5 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                          Plan
                        </p>

                        <p className="mt-3 font-black text-slate-950">
                          {order.planName ||
                            "eSIM Plan"}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {order.packageCode ||
                            "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                          Amount paid
                        </p>

                        <p className="mt-3 text-xl font-black text-slate-950">
                          {formatMoney(
                            order.amountPhpCentavos,
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(
                            order.paidAt,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                          Current status
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                              order.paymentStatus,
                            )}`}
                          >
                            Payment:{" "}
                            {
                              order.paymentStatus
                            }
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusBadgeClass(
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
                    </section>

                    <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                            Live fulfillment
                          </p>

                          <h2 className="mt-2 text-2xl font-black text-slate-950">
                            Order progress
                          </h2>
                        </div>

                        {!ready &&
                          !failed && (
                            <button
                              type="button"
                              onClick={() =>
                                void loadStatus(
                                  {
                                    manual:
                                      true,
                                  },
                                )
                              }
                              disabled={
                                refreshing
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#0A2D62] bg-white px-5 py-3 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white disabled:opacity-50"
                            >
                              <RefreshIcon
                                spinning={
                                  refreshing
                                }
                              />

                              Refresh
                            </button>
                          )}
                      </div>

                      <ol className="mt-8">
                        {progressSteps.map(
                          (
                            step,
                            index,
                          ) => (
                            <ProgressItem
                              key={
                                step.title
                              }
                              step={
                                step
                              }
                              isLast={
                                index ===
                                progressSteps.length -
                                  1
                              }
                            />
                          ),
                        )}
                      </ol>

                      {!ready &&
                        !failed && (
                          <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                            <p className="font-black text-blue-950">
                              This page
                              updates
                              automatically.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-blue-800">
                              Most eSIMs
                              are prepared
                              shortly after
                              payment. You
                              may safely
                              leave this
                              page and
                              return through
                              My Orders.
                            </p>
                          </div>
                        )}

                      {ready && (
                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                          <h3 className="text-2xl font-black text-emerald-950">
                            Your eSIM is
                            ready 🎉
                          </h3>

                          <p className="mt-3 leading-7 text-emerald-800">
                            Redirecting to
                            your secure
                            eSIM details
                            page
                            {redirectCountdown !==
                            null
                              ? ` in ${redirectCountdown}…`
                              : "…"}
                          </p>

                          <Link
                            href={
                              orderDetailsUrl
                            }
                            className="mt-6 inline-flex rounded-2xl bg-emerald-700 px-7 py-3.5 font-black text-white transition hover:bg-emerald-800"
                          >
                            View eSIM Now
                          </Link>
                        </div>
                      )}

                      {failed && (
                        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-6">
                          <h3 className="text-xl font-black text-red-950">
                            Your order
                            needs
                            assistance
                          </h3>

                          <p className="mt-3 leading-7 text-red-800">
                            {order.lastError ||
                              "We were unable to complete the eSIM order automatically. Please contact Seamarino support and include your order reference."}
                          </p>
                        </div>
                      )}
                    </section>
                  </>
                )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={orderDetailsUrl}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {ready
                    ? "View My eSIM"
                    : "View My Order"}
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Continue Shopping
                </Link>
              </div>

              <p className="mt-7 text-center text-sm leading-6 text-slate-500">
                Email delivery remains
                available as a backup.
                Your secure customer
                account is the fastest
                place to access your eSIM
                details.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}