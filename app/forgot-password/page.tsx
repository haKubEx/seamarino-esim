"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function ForgotPasswordPage() {
  const [
    email,
    setEmail,
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
    message,
    setMessage,
  ] = useState("");

  async function submitRequest(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email,
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
            "Unable to send the reset email.",
        );
      }

      setMessage(
        data.message ||
          "Check your email for a password reset link.",
      );

      setEmail("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send the reset email.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 px-7 py-10 text-center text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Seamarino eSIM
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Forgot password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-blue-100">
            Enter your account email and we will send
            you a secure password reset link.
          </p>
        </div>

        <form
          onSubmit={
            submitRequest
          }
          className="p-7 sm:p-9"
        >
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
              {message}
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
            type="email"
            required
            value={email}
            onChange={(
              event,
            ) =>
              setEmail(
                event.target.value,
              )
            }
            autoComplete="email"
            placeholder="you@example.com"
            className="h-14 w-full rounded-2xl border border-slate-300 px-5 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={
              loading
            }
            className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#0A2D62] px-6 font-black text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-black text-blue-700 hover:underline"
            >
              Return to login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}