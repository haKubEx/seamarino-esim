"use client";

import {
  useEffect,
  useState,
} from "react";

type CheckoutCouponProps = {
  packageCode: string;

  /**
   * Selected validity for daily plans.
   *
   * undefined = normal fixed-duration plan
   * 1-30 = daily plan validity
   */
  selectedDays?: number;
};

type CouponResponse = {
  success: boolean;
  valid: boolean;
  error?: string;
  message?: string;

  coupon?: {
    code: string;
    name: string;
    description: string | null;

    discountType:
      | "PERCENTAGE"
      | "FIXED_PHP";

    discountValue: number;
  };

  pricing?: {
    subtotalPhpCentavos: number;
    discountPhpCentavos: number;
    finalPhpCentavos: number;

    subtotalFormatted: string;
    discountFormatted: string;
    finalFormatted: string;
  };
};

function normalizeCode(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function readCheckoutEmail(): string {
  const emailInput =
    document.querySelector<HTMLInputElement>(
      'input[name="email"]',
    );

  return (
    emailInput?.value
      .trim()
      .toLowerCase() ?? ""
  );
}

export default function CheckoutCoupon({
  packageCode,
  selectedDays,
}: CheckoutCouponProps) {
  const [
    enteredCode,
    setEnteredCode,
  ] = useState("");

  const [
    appliedCode,
    setAppliedCode,
  ] = useState("");

  const [
    validatedEmail,
    setValidatedEmail,
  ] = useState("");

  const [
    result,
    setResult,
  ] = useState<
    CouponResponse | null
  >(null);

  const [
    applying,
    setApplying,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const emailInput =
      document.querySelector<HTMLInputElement>(
        'input[name="email"]',
      );

    if (!emailInput) {
      return;
    }

    function handleEmailChange() {
      const currentEmail =
        emailInput?.value
          .trim()
          .toLowerCase() ?? "";

      if (
        appliedCode &&
        validatedEmail &&
        currentEmail !==
          validatedEmail
      ) {
        setAppliedCode("");
        setResult(null);

        setError(
          "The email address changed. Apply the coupon again for this email.",
        );
      }
    }

    emailInput.addEventListener(
      "input",
      handleEmailChange,
    );

    return () => {
      emailInput.removeEventListener(
        "input",
        handleEmailChange,
      );
    };
  }, [
    appliedCode,
    validatedEmail,
  ]);

  async function applyCoupon() {
    const normalizedCode =
      normalizeCode(
        enteredCode,
      );

    const customerEmail =
      readCheckoutEmail();

    setError("");
    setResult(null);
    setAppliedCode("");

    if (!normalizedCode) {
      setError(
        "Enter a coupon code.",
      );

      return;
    }

    if (!customerEmail) {
      setError(
        "Enter your email address before applying the coupon.",
      );

      const emailInput =
        document.querySelector<HTMLInputElement>(
          'input[name="email"]',
        );

      emailInput?.focus();

      return;
    }

    try {
      setApplying(true);

      const response =
        await fetch(
          "/api/coupons/validate",
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                code:
                  normalizedCode,

                packageCode,

                selectedDays,

                customerEmail,
              }),
          },
        );

      const data =
        (await response.json()) as
          CouponResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.valid ||
        !data.coupon ||
        !data.pricing
      ) {
        throw new Error(
          data.error ||
            "The coupon could not be applied.",
        );
      }

      setEnteredCode(
        data.coupon.code,
      );

      setAppliedCode(
        data.coupon.code,
      );

      setValidatedEmail(
        customerEmail,
      );

      setResult(data);
      setError("");
    } catch (
      caughtError
    ) {
      setAppliedCode("");
      setValidatedEmail("");
      setResult(null);

      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "The coupon could not be applied.",
      );
    } finally {
      setApplying(false);
    }
  }

  function removeCoupon() {
    setEnteredCode("");
    setAppliedCode("");
    setValidatedEmail("");
    setResult(null);
    setError("");
  }

  return (
    <section className="rounded-3xl border border-dashed border-blue-300 bg-blue-50/70 p-5 sm:p-6">
      {/*
       * Only a successfully validated code is
       * submitted to /api/checkout.
       *
       * The checkout backend validates it again.
       */}
      <input
        type="hidden"
        name="couponCode"
        value={appliedCode}
      />

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          🎟️
        </div>

        <div>
          <p className="font-black text-slate-950">
            Have a coupon?
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Enter your email address
            first, then apply your
            discount code.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={enteredCode}
          onChange={(event) => {
            const nextCode =
              normalizeCode(
                event.target.value,
              );

            setEnteredCode(
              nextCode,
            );

            if (
              appliedCode &&
              nextCode !==
                appliedCode
            ) {
              setAppliedCode("");
              setValidatedEmail("");
              setResult(null);
            }

            setError("");
          }}
          onKeyDown={(
            event,
          ) => {
            if (
              event.key ===
              "Enter"
            ) {
              event.preventDefault();

              void applyCoupon();
            }
          }}
          disabled={
            applying ||
            Boolean(
              appliedCode,
            )
          }
          maxLength={50}
          autoComplete="off"
          spellCheck={false}
          placeholder="WELCOME10"
          className="h-14 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-5 font-black uppercase tracking-[0.08em] text-slate-950 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />

        {appliedCode ? (
          <button
            type="button"
            onClick={
              removeCoupon
            }
            className="h-14 rounded-2xl border-2 border-red-200 bg-white px-6 font-black text-red-700 transition hover:bg-red-50"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void applyCoupon();
            }}
            disabled={applying}
            className="h-14 rounded-2xl bg-[#0A2D62] px-7 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying
              ? "Applying..."
              : "Apply Coupon"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      )}

      {result?.coupon &&
        result.pricing && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200 bg-white">
            <div className="border-b border-emerald-100 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-emerald-800">
                    {
                      result
                        .coupon
                        .code
                    }{" "}
                    applied
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    {result.message ||
                      "Your discount was applied successfully."}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                  Valid
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-600">
                  Original total
                </span>

                <span className="font-bold text-slate-800">
                  {
                    result
                      .pricing
                      .subtotalFormatted
                  }
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-emerald-700">
                  Coupon discount
                </span>

                <span className="font-black text-emerald-700">
                  −
                  {
                    result
                      .pricing
                      .discountFormatted
                  }
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                <span className="font-black text-slate-950">
                  Payment total
                </span>

                <span className="text-2xl font-black text-[#0A2D62]">
                  {
                    result
                      .pricing
                      .finalFormatted
                  }
                </span>
              </div>
            </div>

            {validatedEmail && (
              <p className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500">
                Coupon validated for{" "}
                <strong>
                  {validatedEmail}
                </strong>
                .
              </p>
            )}
          </div>
        )}
    </section>
  );
}