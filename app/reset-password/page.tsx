"use client";

import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

function ResetPasswordForm() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams
      .get("token")
      ?.trim() ?? "";

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    completed,
    setCompleted,
  ] = useState(false);

  async function submitReset(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token) {
      setError(
        "The password reset link is invalid.",
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "The passwords do not match.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,
                password,
                confirmPassword,
              }),
          },
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to reset your password.",
        );
      }

      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to reset your password.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className="p-7 text-center sm:p-9">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>

        <h2 className="mt-5 text-2xl font-black text-slate-950">
          Password updated
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Your password has been reset. You can now log
          in using your new password.
        </p>

        <Link
          href="/login"
          className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#0A2D62] px-6 font-black text-white hover:bg-blue-800"
        >
          Continue to Login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={
        submitReset
      }
      className="p-7 sm:p-9"
    >
      {!token && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          This reset link is missing its security
          token. Request a new password reset link.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <label
        htmlFor="password"
        className="mb-2 block text-sm font-bold text-slate-800"
      >
        New password
      </label>

      <input
        id="password"
        type="password"
        required
        minLength={8}
        maxLength={128}
        value={password}
        onChange={(
          event,
        ) =>
          setPassword(
            event.target.value,
          )
        }
        autoComplete="new-password"
        placeholder="Enter your new password"
        className="h-14 w-full rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Use at least 8 characters with an uppercase
        letter, lowercase letter, and number.
      </p>

      <label
        htmlFor="confirmPassword"
        className="mb-2 mt-5 block text-sm font-bold text-slate-800"
      >
        Confirm new password
      </label>

      <input
        id="confirmPassword"
        type="password"
        required
        minLength={8}
        maxLength={128}
        value={
          confirmPassword
        }
        onChange={(
          event,
        ) =>
          setConfirmPassword(
            event.target.value,
          )
        }
        autoComplete="new-password"
        placeholder="Repeat your new password"
        className="h-14 w-full rounded-2xl border border-slate-300 px-5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />

      <button
        type="submit"
        disabled={
          loading ||
          !token
        }
        className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#0A2D62] px-6 font-black text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Updating..."
          : "Reset Password"}
      </button>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link
          href="/forgot-password"
          className="font-black text-blue-700 hover:underline"
        >
          Request a new reset link
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 px-7 py-10 text-center text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Seamarino eSIM
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Create a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-blue-100">
            Choose a strong password for your account.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-10 text-center font-semibold text-slate-600">
              Loading reset form...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}