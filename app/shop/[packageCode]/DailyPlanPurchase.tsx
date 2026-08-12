"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DailyPlanPurchaseProps = {
  packageCode: string;
  planName: string;
  dailyDataLabel: string;
  supplierPrice: number;
  usdToPhpRate: number;
  minimumDays?: number;
  maximumDays?: number;
};

const DAILY_MARKUP_PHP_CENTAVOS =
  5_000;

function formatPhpCentavos(
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

function calculateDailyPrice({
  supplierPrice,
  usdToPhpRate,
  selectedDays,
}: {
  supplierPrice: number;
  usdToPhpRate: number;
  selectedDays: number;
}) {
  /*
   * eSIM Access price:
   * 10000 = USD 1.00
   */
  const supplierCostUsdPerDay =
    supplierPrice / 10_000;

  const supplierTotalPhpCentavos =
    Math.round(
      supplierCostUsdPerDay *
        selectedDays *
        usdToPhpRate *
        100,
    );

  const markupPhpCentavos =
    DAILY_MARKUP_PHP_CENTAVOS *
    selectedDays;

  return {
    supplierTotalPhpCentavos,
    markupPhpCentavos,
    totalPhpCentavos:
      supplierTotalPhpCentavos +
      markupPhpCentavos,
  };
}

export default function DailyPlanPurchase({
  packageCode,
  planName,
  dailyDataLabel,
  supplierPrice,
  usdToPhpRate,
  minimumDays = 1,
  maximumDays = 30,
}: DailyPlanPurchaseProps) {
  const [selectedDays, setSelectedDays] =
    useState(minimumDays);

  const price =
    useMemo(
      () =>
        calculateDailyPrice({
          supplierPrice,
          usdToPhpRate,
          selectedDays,
        }),
      [
        supplierPrice,
        usdToPhpRate,
        selectedDays,
      ],
    );

  const checkoutHref =
    `/checkout?packageCode=${encodeURIComponent(
      packageCode,
    )}&selectedDays=${selectedDays}`;

  function decreaseDays() {
    setSelectedDays((current) =>
      Math.max(
        minimumDays,
        current - 1,
      ),
    );
  }

  function increaseDays() {
    setSelectedDays((current) =>
      Math.min(
        maximumDays,
        current + 1,
      ),
    );
  }

  function handleSelectChange(
    value: string,
  ) {
    const parsed = Number(value);

    if (
      Number.isInteger(parsed) &&
      parsed >= minimumDays &&
      parsed <= maximumDays
    ) {
      setSelectedDays(parsed);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Daily Plan
        </p>

        <p className="mt-2 text-lg font-black text-slate-950">
          {dailyDataLabel} every day
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Choose how many days you need.
          You will receive the daily allowance
          again each day during the selected
          validity period.
        </p>
      </div>

      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <label
              htmlFor="daily-plan-days"
              className="text-sm font-black text-slate-900"
            >
              Choose validity
            </label>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {minimumDays} to {maximumDays} days
            </p>
          </div>

          <span className="rounded-full bg-[#0A2D62] px-4 py-2 text-sm font-black text-white">
            {selectedDays}{" "}
            {selectedDays === 1
              ? "Day"
              : "Days"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[56px_1fr_56px] gap-3">
          <button
            type="button"
            onClick={decreaseDays}
            disabled={
              selectedDays <= minimumDays
            }
            className="flex h-14 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-2xl font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Decrease selected days"
          >
            −
          </button>

          <select
            id="daily-plan-days"
            value={selectedDays}
            onChange={(event) =>
              handleSelectChange(
                event.target.value,
              )
            }
            className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-center text-base font-black text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            {Array.from(
              {
                length:
                  maximumDays -
                  minimumDays +
                  1,
              },
              (_, index) =>
                minimumDays + index,
            ).map((day) => (
              <option
                key={day}
                value={day}
              >
                {day}{" "}
                {day === 1
                  ? "Day"
                  : "Days"}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={increaseDays}
            disabled={
              selectedDays >= maximumDays
            }
            className="flex h-14 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-2xl font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Increase selected days"
          >
            +
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <span className="text-sm font-semibold text-slate-600">
            Daily allowance
          </span>

          <strong className="text-right text-slate-950">
            {dailyDataLabel} / Day
          </strong>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3">
          <span className="text-sm font-semibold text-slate-600">
            Selected validity
          </span>

          <strong className="text-slate-950">
            {selectedDays}{" "}
            {selectedDays === 1
              ? "Day"
              : "Days"}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3">
          <span className="text-sm font-semibold text-slate-600">
            Seamarino markup
          </span>

          <strong className="text-slate-950">
            {formatPhpCentavos(
              price.markupPhpCentavos,
            )}
          </strong>
        </div>

        <div className="pt-4">
          <p className="text-sm font-semibold text-slate-500">
            Total price
          </p>

          <p className="mt-1 text-4xl font-black tracking-tight text-[#0A2D62]">
            {formatPhpCentavos(
              price.totalPhpCentavos,
            )}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Supplier cost for{" "}
            {selectedDays}{" "}
            {selectedDays === 1
              ? "day"
              : "days"}{" "}
            plus ₱50 markup per day.
          </p>
        </div>
      </div>

      <Link
        href={checkoutHref}
        aria-label={`Continue to checkout for ${planName}, ${selectedDays} days`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-6 py-4 font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
      >
        Continue to Checkout
        <span aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}