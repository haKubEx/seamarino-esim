"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

type RegisterResponse = {
  success: boolean;
  message?: string;
  error?: string;
  referralApplied?: boolean;

  user?: {
    id: string;
    name: string;
    email: string;
    referralCode:
      | string
      | null;
    storeCreditPhpCentavos: number;
    referredById:
      | string
      | null;
    createdAt: string;
  };
};

type PasswordStrength = {
  label: string;
  percentage: number;
  barClassName: string;
  textClassName: string;
};

function getPasswordStrength(
  password: string,
): PasswordStrength {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (
    /[^a-zA-Z0-9]/.test(
      password,
    )
  ) {
    score += 1;
  }

  if (!password) {
    return {
      label: "Not entered",
      percentage: 0,
      barClassName:
        "bg-slate-200",
      textClassName:
        "text-slate-500",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak",
      percentage: 33,
      barClassName:
        "bg-red-500",
      textClassName:
        "text-red-600",
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      percentage: 66,
      barClassName:
        "bg-amber-500",
      textClassName:
        "text-amber-600",
    };
  }

  return {
    label: "Strong",
    percentage: 100,
    barClassName:
      "bg-emerald-500",
    textClassName:
      "text-emerald-600",
  };
}

function passwordRequirementClass(
  isValid: boolean,
) {
  return isValid
    ? "text-emerald-700"
    : "text-slate-500";
}

function normalizeReferralCode(
  value: string,
) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function RegisterPageContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    referralCode,
    setReferralCode,
  ] = useState("");

  const [
    referralFromLink,
    setReferralFromLink,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

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
    const referralParameter =
      normalizeReferralCode(
        searchParams.get(
          "ref",
        ) ?? "",
      );

    if (!referralParameter) {
      return;
    }

    setReferralCode(
      referralParameter,
    );

    setReferralFromLink(
      true,
    );
  }, [searchParams]);

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          password,
        ),
      [password],
    );

  const hasMinimumLength =
    password.length >= 8;

  const hasLowercase =
    /[a-z]/.test(
      password,
    );

  const hasUppercase =
    /[A-Z]/.test(
      password,
    );

  const hasNumber =
    /[0-9]/.test(
      password,
    );

  const passwordsMatch =
    confirmPassword.length >
      0 &&
    password ===
      confirmPassword;

  const passwordsDoNotMatch =
    confirmPassword.length >
      0 &&
    password !==
      confirmPassword;

  const normalizedReferralCode =
    normalizeReferralCode(
      referralCode,
    );

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName =
      name.trim();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedName) {
      setError(
        "Enter your full name.",
      );

      return;
    }

    if (!normalizedEmail) {
      setError(
        "Enter your email address.",
      );

      return;
    }

    if (
      !hasMinimumLength ||
      !hasLowercase ||
      !hasUppercase ||
      !hasNumber
    ) {
      setError(
        "Your password must contain at least 8 characters, including uppercase, lowercase, and a number.",
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );

      return;
    }

    if (
      normalizedReferralCode &&
      (
        normalizedReferralCode
          .length < 4 ||
        normalizedReferralCode
          .length > 50 ||
        !/^[A-Z0-9_-]+$/.test(
          normalizedReferralCode,
        )
      )
    ) {
      setError(
        "Enter a valid referral code.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  normalizedName,

                email:
                  normalizedEmail,

                password,

                confirmPassword,

                referralCode:
                  normalizedReferralCode,
              }),
          },
        );

      const data =
        (await response.json()) as
          RegisterResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to create your account.",
        );
      }

      setMessage(
        data.message ||
          (
            data.referralApplied
              ? "Your account was created and your referral code was applied successfully."
              : "Your account was created successfully."
          ),
      );

      window.setTimeout(
        () => {
          const parameters =
            new URLSearchParams({
              registered:
                "1",

              email:
                normalizedEmail,
            });

          if (
            data.referralApplied
          ) {
            parameters.set(
              "referralApplied",
              "1",
            );
          }

          router.push(
            `/login?${parameters.toString()}`,
          );
        },
        1000,
      );
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearReferralCode() {
    setReferralCode("");
    setReferralFromLink(
      false,
    );

    const parameters =
      new URLSearchParams(
        searchParams.toString(),
      );

    parameters.delete(
      "ref",
    );

    const nextUrl =
      parameters.toString()
        ? `/register?${parameters.toString()}`
        : "/register";

    router.replace(
      nextUrl,
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white sm:p-12">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino eSIM
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            Create your customer
            account
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
            Track your purchases,
            view your eSIM QR
            codes, and retrieve
            your installation
            details securely.
          </p>

          <div className="mt-10 space-y-5">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <p className="font-black">
                Secure order access
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Only your signed-in
                account can view
                your eSIM
                credentials.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <p className="font-black">
                Existing orders
                included
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Previous orders
                using the same
                email will be
                linked to your
                account
                automatically.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <p className="font-black">
                Referral rewards
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Use a valid
                referral code when
                registering. Rewards
                are issued after
                your qualifying
                eSIM order is
                successfully
                delivered.
              </p>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Registration
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Create account
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Use the same email
              address you use when
              purchasing eSIM
              plans.
            </p>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-8 space-y-6"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-black text-slate-900"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target
                        .value,
                    )
                  }
                  autoComplete="name"
                  maxLength={100}
                  required
                  placeholder="Enter your full name"
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-black text-slate-900"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event.target
                        .value,
                    )
                  }
                  autoComplete="email"
                  maxLength={254}
                  required
                  placeholder="you@example.com"
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="referralCode"
                    className="block text-sm font-black text-slate-900"
                  >
                    Referral code
                    <span className="ml-2 font-semibold text-slate-500">
                      Optional
                    </span>
                  </label>

                  {normalizedReferralCode && (
                    <button
                      type="button"
                      onClick={
                        clearReferralCode
                      }
                      className="text-xs font-black text-red-600 transition hover:text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  id="referralCode"
                  type="text"
                  value={
                    referralCode
                  }
                  onChange={(
                    event,
                  ) => {
                    setReferralCode(
                      normalizeReferralCode(
                        event.target
                          .value,
                      ),
                    );

                    setReferralFromLink(
                      false,
                    );
                  }}
                  autoComplete="off"
                  maxLength={50}
                  placeholder="Example: PUT YOUR REFERRAL CODE HERE"
                  spellCheck={false}
                  className="mt-2 h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 font-black uppercase tracking-[0.08em] text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                {normalizedReferralCode && (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-black text-emerald-800">
                      ✓ Referral code
                      entered
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      {referralFromLink
                        ? "This code was added automatically from your referral link."
                        : "This code will be verified when you create your account."}
                    </p>
                  </div>
                )}

                {!normalizedReferralCode && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Leave this empty
                    when you were not
                    referred by another
                    customer.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-black text-slate-900"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event.target
                          .value,
                      )
                    }
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    placeholder="Enter your password"
                    className="h-16 w-full rounded-2xl border-2 border-slate-400 bg-white px-5 pr-24 text-lg font-bold tracking-wide text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-slate-600">
                      Password
                      strength
                    </p>

                    <p
                      className={`text-xs font-black ${passwordStrength.textClassName}`}
                    >
                      {
                        passwordStrength.label
                      }
                    </p>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClassName}`}
                      style={{
                        width: `${passwordStrength.percentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold sm:grid-cols-2">
                  <p
                    className={passwordRequirementClass(
                      hasMinimumLength,
                    )}
                  >
                    {hasMinimumLength
                      ? "✓"
                      : "○"}{" "}
                    At least 8
                    characters
                  </p>

                  <p
                    className={passwordRequirementClass(
                      hasUppercase,
                    )}
                  >
                    {hasUppercase
                      ? "✓"
                      : "○"}{" "}
                    One uppercase
                    letter
                  </p>

                  <p
                    className={passwordRequirementClass(
                      hasLowercase,
                    )}
                  >
                    {hasLowercase
                      ? "✓"
                      : "○"}{" "}
                    One lowercase
                    letter
                  </p>

                  <p
                    className={passwordRequirementClass(
                      hasNumber,
                    )}
                  >
                    {hasNumber
                      ? "✓"
                      : "○"}{" "}
                    One number
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-black text-slate-900"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event,
                    ) =>
                      setConfirmPassword(
                        event.target
                          .value,
                      )
                    }
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    placeholder="Enter your password again"
                    className={`h-16 w-full rounded-2xl border-2 bg-white px-5 pr-24 text-lg font-bold tracking-wide text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:ring-4 ${
                      passwordsDoNotMatch
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : passwordsMatch
                          ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100"
                          : "border-slate-400 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                {passwordsMatch && (
                  <p className="mt-2 text-sm font-bold text-emerald-700">
                    ✓ Passwords
                    match.
                  </p>
                )}

                {passwordsDoNotMatch && (
                  <p className="mt-2 text-sm font-bold text-red-600">
                    Passwords do not
                    match.
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-7 py-4 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-black text-blue-700 hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-4 text-center text-sm">
              <Link
                href="/"
                className="font-bold text-slate-500 hover:text-blue-700"
              >
                Return to
                storefront
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function RegisterPageFallback() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="flex min-h-[520px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />

            <p className="mt-4 font-black text-slate-900">
              Loading registration...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Preparing your account form.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <RegisterPageFallback />
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
