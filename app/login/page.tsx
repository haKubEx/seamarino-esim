"use client";

import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";

import {
  Suspense,
  useActionState,
  useState,
} from "react";

import {
  loginAction,
  type LoginState,
} from "@/app/login/actions";

const initialLoginState:
  LoginState = {
    error: "",
  };

function EyeIcon({
  visible,
}: {
  visible: boolean;
}) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="12"
          cy="12"
          r="3"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="m3 3 18 18"
        strokeLinecap="round"
      />

      <path
        d="M10.6 6.2A10.4 10.4 0 0 1 12 6c6 0 9.5 6 9.5 6a17.2 17.2 0 0 1-3.1 3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M6.2 6.2C3.9 7.8 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getSafeCallbackUrl(
  value: string | null,
): string {
  const callbackUrl =
    value?.trim() ?? "";

  if (
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return callbackUrl;
  }

  return "/account";
}

function LoginForm() {
  const searchParams =
    useSearchParams();

  const callbackUrl =
    getSafeCallbackUrl(
      searchParams.get(
        "callbackUrl",
      ),
    );

  const resetSuccess =
    searchParams.get("reset") ===
    "success";

  const registeredSuccess =
    searchParams.get(
      "registered",
    ) === "success";

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    loginAction,
    initialLoginState,
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sky-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-8">
        <section className="hidden lg:block">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">
            Seamarino eSIM
          </p>

          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-tight tracking-tight text-slate-950 xl:text-6xl">
            Stay connected wherever your journey takes you.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Sign in to manage your orders, view your
            purchased eSIMs, download QR codes, and
            check activation details.
          </p>

          <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🌍
              </div>

              <h2 className="mt-5 text-lg font-black text-slate-950">
                Global coverage
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access travel plans for countries and
                regions worldwide.
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                📱
              </div>

              <h2 className="mt-5 text-lg font-black text-slate-950">
                Instant access
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                View QR codes, ICCIDs, activation
                details, and order statuses.
              </p>
            </article>
          </div>
        </section>

        <section className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 px-7 py-10 text-center text-white sm:px-9">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                ⚓
              </span>

              <span className="text-xl font-black">
                Seamarino eSIM
              </span>
            </Link>

            <h2 className="mt-7 text-3xl font-black tracking-tight">
              Welcome back
            </h2>

            <p className="mt-3 text-sm leading-6 text-blue-100">
              Sign in to manage your account and orders.
            </p>
          </div>

          <form
            action={formAction}
            noValidate
            className="p-7 sm:p-9"
          >
            <input
              type="hidden"
              name="callbackUrl"
              value={callbackUrl}
            />

            {resetSuccess && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                Your password was reset successfully.
                You can now sign in.
              </div>
            )}

            {registeredSuccess && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                Your account was created successfully.
                Sign in to continue.
              </div>
            )}

            {state.error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
              >
                {state.error}
              </div>
            )}

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              disabled={pending}
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <div className="mb-2 mt-5 flex items-center justify-between gap-4">
              <label
                htmlFor="password"
                className="text-sm font-bold text-slate-800"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-bold text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={pending}
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 pr-14 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <button
                type="button"
                onClick={() => {
                  setShowPassword(
                    (current) =>
                      !current,
                  );
                }}
                disabled={pending}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <EyeIcon
                  visible={
                    showPassword
                  }
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#0A2D62] px-6 font-black text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? "Signing in..."
                : "Sign In"}
            </button>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                New customer
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href="/register"
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl border-2 border-[#0A2D62] bg-white px-6 font-black text-[#0A2D62] hover:bg-blue-50"
            >
              Create an Account
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="font-semibold text-slate-600">
            Loading login page...
          </p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}