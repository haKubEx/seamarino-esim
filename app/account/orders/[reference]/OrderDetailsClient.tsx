"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderDetailsClientProps = {
  order: {
    referenceNumber: string;
    planName: string;
    packageCode: string;

    status: string;
    paymentStatus: string;
    esimStatus: string;

    amountPhpCentavos: number;
    createdAt: string;
    paidAt: string | null;
    completedAt: string | null;

    iccid: string | null;
    qrCode: string | null;
    qrCodeUrl: string | null;
    activationCode: string | null;
    smdpAddress: string | null;
    smdpStatus: string | null;
    supplierEsimStatus: string | null;
    apn: string | null;

    lastError: string | null;
  };
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
  value: string | null,
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
  ).format(new Date(value));
}

function getStatusClass(
  status: string,
) {
  switch (status) {
    case "PAID":
    case "COMPLETED":
    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "border-red-200 bg-red-50 text-red-700";

    case "PROCESSING":
    case "ISSUED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function createAppleQuickInstallUrl(
  activationCode: string | null,
) {
  const normalizedCode =
    activationCode?.trim();

  if (
    !normalizedCode ||
    !normalizedCode.startsWith(
      "LPA:",
    )
  ) {
    return null;
  }

  return (
    "https://esimsetup.apple.com/" +
    "esim_qrcode_provisioning" +
    `?carddata=${encodeURIComponent(
      normalizedCode,
    )}`
  );
}

function DetailCard({
  label,
  value,
  copyValue,
  onCopy,
  copiedField,
}: {
  label: string;
  value: string | null;
  copyValue?: string | null;
  onCopy: (
    field: string,
    value: string,
  ) => Promise<void>;
  copiedField: string;
}) {
  const availableValue =
    value?.trim() || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 break-all text-base font-bold leading-7 text-slate-900">
          {availableValue ||
            "Not available yet"}
        </p>

        {availableValue && (
          <button
            type="button"
            onClick={() =>
              onCopy(
                label,
                copyValue ||
                  availableValue,
              )
            }
            className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
          >
            {copiedField === label
              ? "Copied"
              : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailsClient({
  order,
}: OrderDetailsClientProps) {
  const router = useRouter();

  const [
    copiedField,
    setCopiedField,
  ] = useState("");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const profileReady =
    order.esimStatus === "ISSUED" ||
    order.esimStatus === "DELIVERED";

  const stillProcessing =
    order.paymentStatus === "PAID" &&
    !profileReady &&
    order.esimStatus !== "FAILED";

  const qrImageSource =
    order.qrCodeUrl ||
    order.qrCode;

  const appleQuickInstallUrl =
    createAppleQuickInstallUrl(
      order.activationCode,
    );

  useEffect(() => {
    if (!stillProcessing) {
      return;
    }

    const refreshTimer =
      window.setInterval(() => {
        router.refresh();
      }, 5000);

    return () => {
      window.clearInterval(
        refreshTimer,
      );
    };
  }, [
    router,
    stillProcessing,
  ]);

  async function copyValue(
    field: string,
    value: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopiedField(field);

      window.setTimeout(() => {
        setCopiedField("");
      }, 1600);
    } catch {
      setCopiedField("");
    }
  }

  async function refreshOrder() {
    setRefreshing(true);

    router.refresh();

    window.setTimeout(() => {
      setRefreshing(false);
    }, 700);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/account/orders"
              className="text-sm font-black text-blue-700 hover:underline"
            >
              ← Back to My Orders
            </Link>

            <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              eSIM Order
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              {order.planName}
            </h1>

            <p className="mt-3 break-all text-sm font-semibold text-slate-500">
              {order.referenceNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshOrder}
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-2xl border-2 border-[#0A2D62] bg-white px-6 py-3.5 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Status"}
          </button>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 border-b border-slate-100 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  {
                    order.referenceNumber
                  }
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {order.packageCode}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                Order summary
              </h2>

              <p className="mt-2 text-slate-600">
                Purchased{" "}
                {formatDate(
                  order.createdAt,
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black ${getStatusClass(
                  order.status,
                )}`}
              >
                Order: {order.status}
              </span>

              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black ${getStatusClass(
                  order.paymentStatus,
                )}`}
              >
                Payment:{" "}
                {order.paymentStatus}
              </span>

              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-black ${getStatusClass(
                  order.esimStatus,
                )}`}
              >
                eSIM:{" "}
                {order.esimStatus}
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Amount
              </p>

              <p className="mt-2 text-xl font-black text-slate-950">
                {formatMoney(
                  order.amountPhpCentavos,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Paid at
              </p>

              <p className="mt-2 font-bold leading-6 text-slate-800">
                {formatDate(
                  order.paidAt,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Completed at
              </p>

              <p className="mt-2 font-bold leading-6 text-slate-800">
                {formatDate(
                  order.completedAt,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Supplier status
              </p>

              <p className="mt-2 font-bold leading-6 text-slate-800">
                {order.supplierEsimStatus ||
                  order.smdpStatus ||
                  "Waiting"}
              </p>
            </div>
          </div>
        </section>

        {stillProcessing && (
          <section className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
                ⏳
              </div>

              <div>
                <h2 className="text-xl font-black text-blue-950">
                  Your eSIM is being
                  prepared
                </h2>

                <p className="mt-2 leading-7 text-blue-800">
                  This page refreshes
                  automatically every five
                  seconds. Your QR code and
                  activation details will
                  appear as soon as the
                  supplier issues the
                  profile.
                </p>
              </div>
            </div>
          </section>
        )}

        {order.lastError && (
          <section className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.15em] text-red-600">
              Order issue
            </p>

            <p className="mt-3 font-semibold leading-7 text-red-800">
              {order.lastError}
            </p>
          </section>
        )}

        <section className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              eSIM QR Code
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Scan to install
            </h2>

            {qrImageSource ? (
              <>
                <div className="mt-6 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-5">
                  <img
                    src={
                      qrImageSource
                    }
                    alt={`QR code for ${order.planName}`}
                    className="mx-auto aspect-square w-full max-w-[290px] object-contain"
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  {appleQuickInstallUrl && (
                    <a
                      href={
                        appleQuickInstallUrl
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <span
                        aria-hidden="true"
                      >
                        📲
                      </span>

                      Quick Install on
                      iPhone
                    </a>
                  )}

                  {order.qrCodeUrl && (
                    <a
                      href={
                        order.qrCodeUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#0A2D62] bg-white px-6 py-3.5 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
                    >
                      Open QR Code
                    </a>
                  )}

                  {appleQuickInstallUrl && (
                    <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                      Open this page on a
                      compatible iPhone or
                      iPad, then tap Quick
                      Install and follow the
                      onscreen instructions.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6 flex aspect-square w-full items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div>
                  <p className="text-4xl">
                    📱
                  </p>

                  <p className="mt-4 font-black text-slate-800">
                    QR code not ready
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    It will appear here
                    automatically after
                    profile issuance.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Installation Details
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Manual setup information
            </h2>

            <div className="mt-6 grid gap-4">
              <DetailCard
                label="Activation code"
                value={
                  order.activationCode
                }
                onCopy={copyValue}
                copiedField={
                  copiedField
                }
              />

              <DetailCard
                label="SM-DP+ address"
                value={
                  order.smdpAddress
                }
                onCopy={copyValue}
                copiedField={
                  copiedField
                }
              />

              <DetailCard
                label="ICCID"
                value={order.iccid}
                onCopy={copyValue}
                copiedField={
                  copiedField
                }
              />

              <DetailCard
                label="APN"
                value={order.apn}
                onCopy={copyValue}
                copiedField={
                  copiedField
                }
              />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Installation Guide
          </p>

          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Before installing your eSIM
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">
                1
              </span>

              <h3 className="mt-4 font-black text-slate-950">
                Use a stable Wi-Fi
                connection
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep your device
                connected while adding
                the eSIM.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">
                2
              </span>

              <h3 className="mt-4 font-black text-slate-950">
                Scan or enter manually
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Scan the QR code from
                another screen or use the
                manual activation details.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-black text-blue-700">
                3
              </span>

              <h3 className="mt-4 font-black text-slate-950">
                Activate at destination
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enable the eSIM and data
                roaming according to your
                plan instructions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}