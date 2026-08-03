"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  signIn,
} from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const registered =
    searchParams.get("registered") ===
    "1";

  const initialEmail =
    searchParams.get("email") ?? "";

  const callbackUrl =
    searchParams.get("callbackUrl") ||
    "/account";

  const [email, setEmail] =
    useState(initialEmail);

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Enter your email address and password.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await signIn(
          "credentials",
          {
            email:
              normalizedEmail,

            password,

            redirect:
              false,

            redirectTo:
              callbackUrl,
          },
        );

      if (!result) {
        throw new Error(
          "Unable to sign in.",
        );
      }

      if (result.error) {
        throw new Error(
          "The email address or password is incorrect.",
        );
      }

      router.push(
        result.url ||
          callbackUrl,
      );

      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white sm:p-12">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino eSIM
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            Welcome back
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
            Sign in to view your
            purchases, installation
            details, and eSIM QR codes
            securely.
          </p>

          <div className="mt-10 space-y-5">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <p className="font-black">
                Access your eSIM anytime
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Retrieve your QR code,
                ICCID, activation code,
                and APN from your account.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
              <p className="font-black">
                Secure customer portal
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Your order and eSIM details
                are visible only after
                signing in.
              </p>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mx-auto max-w-xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Customer Login
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Sign in
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Use the email address and
              password connected to your
              Seamarino account.
            </p>

            {registered && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Your account was created
                successfully. You can now
                sign in.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
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
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-black text-slate-900"
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
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="h-16 w-full rounded-2xl border-2 border-slate-400 bg-white px-5 pr-24 text-lg font-bold tracking-wide text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
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
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-7 py-4 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              No account yet?{" "}
              <Link
                href="/register"
                className="font-black text-blue-700 hover:underline"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-4 text-center text-sm">
              <Link
                href="/"
                className="font-bold text-slate-500 hover:text-blue-700"
              >
                Return to storefront
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 font-semibold text-slate-600 shadow-sm">
            Loading login…
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}