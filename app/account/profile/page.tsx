"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: string | null;
  createdAt?: string;
  updatedAt: string;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  error?: string;
  profile?: Profile;
};

function formatDate(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

export default function ProfilePage() {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    role,
    setRole,
  ] = useState("");

  const [
    emailVerified,
    setEmailVerified,
  ] = useState<
    string | null
  >(null);

  const [
    createdAt,
    setCreatedAt,
  ] = useState<
    string | undefined
  >();

  const [
    updatedAt,
    setUpdatedAt,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
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
    let cancelled =
      false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/account/profile",
            {
              method: "GET",
              cache: "no-store",

              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const data =
          (await response.json()) as
            ProfileResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.profile
        ) {
          throw new Error(
            data.error ||
              "Unable to load your profile.",
          );
        }

        if (!cancelled) {
          setName(
            data.profile.name,
          );

          setEmail(
            data.profile.email,
          );

          setPhone(
            data.profile.phone ??
              "",
          );

          setRole(
            data.profile.role,
          );

          setEmailVerified(
            data.profile
              .emailVerified,
          );

          setCreatedAt(
            data.profile
              .createdAt,
          );

          setUpdatedAt(
            data.profile
              .updatedAt,
          );
        }
      } catch (
        caughtError
      ) {
        if (!cancelled) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName =
      name.trim();

    const normalizedPhone =
      phone.trim();

    if (!normalizedName) {
      setError(
        "Your name is required.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/account/profile",
          {
            method: "PUT",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  normalizedName,

                phone:
                  normalizedPhone,
              }),
          },
        );

      const data =
        (await response.json()) as
          ProfileResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.profile
      ) {
        throw new Error(
          data.error ||
            "Unable to update your profile.",
        );
      }

      setName(
        data.profile.name,
      );

      setPhone(
        data.profile.phone ??
          "",
      );

      setUpdatedAt(
        data.profile.updatedAt,
      );

      setMessage(
        data.message ||
          "Your profile was updated successfully.",
      );

      /*
       * Refresh server-rendered account components,
       * including the customer name in the sidebar.
       */
      router.refresh();
    } catch (
      caughtError
    ) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[520px] rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />

        <div className="mt-4 h-12 w-64 max-w-full animate-pulse rounded bg-slate-200" />

        <div className="mt-10 grid gap-6">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />

          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />

          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[520px]">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
          Customer Account
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          My Profile
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100">
          Keep your name and contact
          number current for future
          orders and customer support.
        </p>
      </section>

      <section className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={
            saveProfile
          }
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Personal Information
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Update your details
          </h2>

          <div className="mt-8 grid gap-6">
            <div>
              <label
                htmlFor="profileName"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Full name
              </label>

              <input
                id="profileName"
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
                maxLength={100}
                autoComplete="name"
                required
                className="h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="profileEmail"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Email address
              </label>

              <input
                id="profileEmail"
                type="email"
                value={email}
                readOnly
                disabled
                className="h-16 w-full cursor-not-allowed rounded-2xl border-2 border-slate-200 bg-slate-100 px-5 text-lg font-semibold text-slate-500"
              />

              <p className="mt-2 text-sm text-slate-500">
                Your account email
                cannot be changed from
                this page.
              </p>
            </div>

            <div>
              <label
                htmlFor="profilePhone"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Phone number
              </label>

              <input
                id="profilePhone"
                type="tel"
                value={phone}
                onChange={(
                  event,
                ) =>
                  setPhone(
                    event.target
                      .value,
                  )
                }
                maxLength={40}
                autoComplete="tel"
                placeholder="+63 912 345 6789"
                className="h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold leading-6 text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold leading-6 text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-7 min-h-16 w-full rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-7 py-4 text-lg font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving Changes..."
              : "Save Profile"}
          </button>
        </form>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Account Status
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Role
                </p>

                <p className="mt-2 font-black text-slate-950">
                  {role ||
                    "CUSTOMER"}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Email verification
                </p>

                <p
                  className={`mt-2 font-black ${
                    emailVerified
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {emailVerified
                    ? "Verified"
                    : "Not verified"}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Member since
                </p>

                <p className="mt-2 font-semibold text-slate-700">
                  {formatDate(
                    createdAt,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Last updated
                </p>

                <p className="mt-2 font-semibold text-slate-700">
                  {formatDate(
                    updatedAt,
                  )}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6">
            <p className="font-black text-blue-950">
              Account Security
            </p>

            <p className="mt-3 text-sm leading-7 text-blue-800">
              Use the Change Password
              page when you need to
              update your account
              password.
            </p>

            <a
              href="/account/change-password"
              className="mt-5 inline-flex rounded-2xl bg-blue-700 px-5 py-3 font-black text-white transition hover:bg-blue-800"
            >
              Change Password
            </a>
          </section>
        </aside>
      </section>
    </main>
  );
}