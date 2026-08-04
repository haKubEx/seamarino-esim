"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type ChangePasswordResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  show: boolean;
  autoComplete:
    | "current-password"
    | "new-password";
  placeholder: string;
  onChange: (
    value: string,
  ) => void;
  onToggle: () => void;
};

function PasswordField({
  id,
  label,
  value,
  show,
  autoComplete,
  placeholder,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-black text-slate-900"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          autoComplete={
            autoComplete
          }
          required
          placeholder={
            placeholder
          }
          className="h-16 w-full rounded-2xl border-2 border-slate-400 bg-white px-5 pr-24 text-lg font-bold tracking-wide text-slate-950 shadow-sm outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            show
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          {show
            ? "Hide"
            : "Show"}
        </button>
      </div>
    </div>
  );
}

function requirementClass(
  valid: boolean,
) {
  return valid
    ? "text-emerald-700"
    : "text-slate-500";
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const requirements =
    useMemo(
      () => ({
        minimumLength:
          newPassword.length >= 8,

        lowercase:
          /[a-z]/.test(
            newPassword,
          ),

        uppercase:
          /[A-Z]/.test(
            newPassword,
          ),

        number:
          /[0-9]/.test(
            newPassword,
          ),
      }),
      [newPassword],
    );

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword ===
      confirmPassword;

  const passwordsDoNotMatch =
    confirmPassword.length > 0 &&
    newPassword !==
      confirmPassword;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/account/change-password",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword,
            }),
          },
        );

      const data =
        (await response.json()) as ChangePasswordResponse;

      if (
        response.status === 401
      ) {
        router.push(
          "/login?callbackUrl=/account/change-password",
        );

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to change your password.",
        );
      }

      setMessage(
        data.message ||
          "Your password was changed successfully.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(
        false,
      );

      setShowNewPassword(
        false,
      );

      setShowConfirmPassword(
        false,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/account"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
              Account Security
            </p>

            <h1 className="mt-3 text-4xl font-black">
              Change Password
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-blue-100">
              Use a strong password that
              you do not reuse on other
              websites.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <PasswordField
                id="currentPassword"
                label="Current password"
                value={
                  currentPassword
                }
                show={
                  showCurrentPassword
                }
                autoComplete="current-password"
                placeholder="Enter your current password"
                onChange={
                  setCurrentPassword
                }
                onToggle={() =>
                  setShowCurrentPassword(
                    (current) =>
                      !current,
                  )
                }
              />

              <PasswordField
                id="newPassword"
                label="New password"
                value={newPassword}
                show={
                  showNewPassword
                }
                autoComplete="new-password"
                placeholder="Enter your new password"
                onChange={
                  setNewPassword
                }
                onToggle={() =>
                  setShowNewPassword(
                    (current) =>
                      !current,
                  )
                }
              />

              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold sm:grid-cols-2">
                <p
                  className={requirementClass(
                    requirements.minimumLength,
                  )}
                >
                  {requirements.minimumLength
                    ? "✓"
                    : "○"}{" "}
                  At least 8 characters
                </p>

                <p
                  className={requirementClass(
                    requirements.uppercase,
                  )}
                >
                  {requirements.uppercase
                    ? "✓"
                    : "○"}{" "}
                  One uppercase letter
                </p>

                <p
                  className={requirementClass(
                    requirements.lowercase,
                  )}
                >
                  {requirements.lowercase
                    ? "✓"
                    : "○"}{" "}
                  One lowercase letter
                </p>

                <p
                  className={requirementClass(
                    requirements.number,
                  )}
                >
                  {requirements.number
                    ? "✓"
                    : "○"}{" "}
                  One number
                </p>
              </div>

              <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                value={
                  confirmPassword
                }
                show={
                  showConfirmPassword
                }
                autoComplete="new-password"
                placeholder="Enter the new password again"
                onChange={
                  setConfirmPassword
                }
                onToggle={() =>
                  setShowConfirmPassword(
                    (current) =>
                      !current,
                  )
                }
              />

              {passwordsMatch && (
                <p className="text-sm font-bold text-emerald-700">
                  ✓ Passwords match.
                </p>
              )}

              {passwordsDoNotMatch && (
                <p className="text-sm font-bold text-red-600">
                  Passwords do not match.
                </p>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold leading-6 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold leading-6 text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Changing password..."
                  : "Change Password"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}