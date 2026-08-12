"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;

  discountType:
    | "PERCENTAGE"
    | "FIXED_PHP";

  discountValue: number;
  discountPhp: number | null;

  minimumPurchasePhp: number;

  minimumDataBytes:
    | string
    | null;

  maximumDataBytes:
    | string
    | null;

  minimumDataGb:
    | number
    | null;

  maximumDataGb:
    | number
    | null;

  enabled: boolean;

  startsAt:
    | string
    | null;

  expiresAt:
    | string
    | null;

  usageLimit:
    | number
    | null;

  perCustomerLimit: number;

  firstOrderOnly: boolean;

  applicablePackageCodes:
    string[];

  orderCount: number;
  redemptionCount: number;

  reservedCount: number;
  redeemedCount: number;
  releasedCount: number;

  createdAt: string;
  updatedAt: string;
};

type CouponStats = {
  totalCoupons: number;
  enabledCoupons: number;
  disabledCoupons: number;
  totalReserved: number;
  totalRedeemed: number;
  totalReleased: number;
};

type CouponsResponse = {
  success: boolean;
  error?: string;

  stats?: CouponStats;
  coupons?: Coupon[];
};

type CouponMutationResponse = {
  success: boolean;
  error?: string;
  message?: string;
  coupon?: Coupon;
};

type CouponFormState = {
  code: string;
  name: string;
  description: string;

  discountPhp: string;
  minimumPurchasePhp: string;

  minimumDataGb: string;
  maximumDataGb: string;

  enabled: boolean;

  startsAt: string;
  expiresAt: string;

  usageLimit: string;
  perCustomerLimit: string;

  firstOrderOnly: boolean;

  applicablePackageCodes: string;
};

const EMPTY_FORM:
  CouponFormState = {
    code: "",
    name: "",
    description: "",

    discountPhp: "50",
    minimumPurchasePhp: "0",

    minimumDataGb: "10",
    maximumDataGb: "50",

    enabled: true,

    startsAt: "",
    expiresAt: "",

    usageLimit: "",
    perCustomerLimit: "1",

    firstOrderOnly: false,

    applicablePackageCodes: "",
  };

function formatMoney(
  pesos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(pesos);
}

function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "No expiration";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function toDateTimeLocalValue(
  value:
    | string
    | null,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const timezoneOffset =
    date.getTimezoneOffset() *
    60_000;

  return new Date(
    date.getTime() -
      timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
}

function normalizeCode(
  value: string,
) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getAdminKey() {
  return (
    localStorage.getItem(
      "adminKey",
    ) ?? ""
  );
}

function getStatusClass(
  enabled: boolean,
) {
  return enabled
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-300 bg-slate-100 text-slate-600";
}

export default function CouponsManager() {
  const [
    coupons,
    setCoupons,
  ] = useState<Coupon[]>([]);

  const [
    stats,
    setStats,
  ] = useState<CouponStats>({
    totalCoupons: 0,
    enabledCoupons: 0,
    disabledCoupons: 0,
    totalReserved: 0,
    totalRedeemed: 0,
    totalReleased: 0,
  });

  const [
    form,
    setForm,
  ] = useState<CouponFormState>(
    EMPTY_FORM,
  );

  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | "enabled" | "disabled"
  >("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const loadCoupons =
    useCallback(async () => {
      const adminKey =
        getAdminKey();

      if (!adminKey) {
        setLoading(false);

        setError(
          "Enter your admin key before loading coupons.",
        );

        return;
      }

      try {
        setLoading(true);

        const query =
          new URLSearchParams();

        if (search.trim()) {
          query.set(
            "search",
            search.trim(),
          );
        }

        if (
          statusFilter ===
          "enabled"
        ) {
          query.set(
            "enabled",
            "true",
          );
        }

        if (
          statusFilter ===
          "disabled"
        ) {
          query.set(
            "enabled",
            "false",
          );
        }

        const response =
          await fetch(
            `/api/admin/coupons${
              query.toString()
                ? `?${query.toString()}`
                : ""
            }`,
            {
              method: "GET",

              headers: {
                "x-admin-key":
                  adminKey,
              },

              cache:
                "no-store",
            },
          );

        const data =
          (await response.json()) as
            CouponsResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Unable to load coupons.",
          );
        }

        setCoupons(
          data.coupons ?? [],
        );

        setStats(
          data.stats ?? {
            totalCoupons: 0,
            enabledCoupons: 0,
            disabledCoupons: 0,
            totalReserved: 0,
            totalRedeemed: 0,
            totalReleased: 0,
          },
        );

        setError("");
      } catch (
        loadError
      ) {
        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Unable to load coupons.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      search,
      statusFilter,
    ]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const totalDiscountGiven =
    useMemo(
      () =>
        coupons.reduce(
          (
            total,
            coupon,
          ) =>
            total +
            coupon.redeemedCount *
              (coupon.discountPhp ??
                0),
          0,
        ),
      [coupons],
    );

  function updateForm<
    Key extends keyof CouponFormState,
  >(
    key: Key,
    value:
      CouponFormState[Key],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  function resetForm() {
    setForm(
      EMPTY_FORM,
    );

    setEditingId(
      null,
    );

    setError("");
    setMessage("");
  }

  function editCoupon(
    coupon: Coupon,
  ) {
    setEditingId(
      coupon.id,
    );

    setForm({
      code:
        coupon.code,

      name:
        coupon.name,

      description:
        coupon.description ??
        "",

      discountPhp:
        String(
          coupon.discountPhp ??
            0,
        ),

      minimumPurchasePhp:
        String(
          coupon.minimumPurchasePhp ??
            0,
        ),

      minimumDataGb:
        coupon.minimumDataGb ===
        null
          ? ""
          : String(
              coupon.minimumDataGb,
            ),

      maximumDataGb:
        coupon.maximumDataGb ===
        null
          ? ""
          : String(
              coupon.maximumDataGb,
            ),

      enabled:
        coupon.enabled,

      startsAt:
        toDateTimeLocalValue(
          coupon.startsAt,
        ),

      expiresAt:
        toDateTimeLocalValue(
          coupon.expiresAt,
        ),

      usageLimit:
        coupon.usageLimit ===
        null
          ? ""
          : String(
              coupon.usageLimit,
            ),

      perCustomerLimit:
        String(
          coupon.perCustomerLimit,
        ),

      firstOrderOnly:
        coupon.firstOrderOnly,

      applicablePackageCodes:
        coupon
          .applicablePackageCodes
          .join(", "),
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submitCoupon(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const adminKey =
      getAdminKey();

    if (!adminKey) {
      setError(
        "Enter your admin key first.",
      );

      return;
    }

    const payload = {
      code:
        normalizeCode(
          form.code,
        ),

      name:
        form.name.trim(),

      description:
        form.description.trim(),

      discountPhp:
        Number(
          form.discountPhp,
        ),

      minimumPurchasePhp:
        Number(
          form.minimumPurchasePhp ||
            0,
        ),

      minimumDataGb:
        form.minimumDataGb
          ? Number(
              form.minimumDataGb,
            )
          : null,

      maximumDataGb:
        form.maximumDataGb
          ? Number(
              form.maximumDataGb,
            )
          : null,

      enabled:
        form.enabled,

      startsAt:
        form.startsAt
          ? new Date(
              form.startsAt,
            ).toISOString()
          : null,

      expiresAt:
        form.expiresAt
          ? new Date(
              form.expiresAt,
            ).toISOString()
          : null,

      usageLimit:
        form.usageLimit
          ? Number(
              form.usageLimit,
            )
          : null,

      perCustomerLimit:
        Number(
          form.perCustomerLimit,
        ),

      firstOrderOnly:
        form.firstOrderOnly,

      applicablePackageCodes:
        form
          .applicablePackageCodes
          .split(",")
          .map((value) =>
            value
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean),
    };

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          editingId
            ? `/api/admin/coupons/${encodeURIComponent(
                editingId,
              )}`
            : "/api/admin/coupons",
          {
            method:
              editingId
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-admin-key":
                adminKey,
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const data =
        (await response.json()) as
          CouponMutationResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to save coupon.",
        );
      }

      setMessage(
        data.message ||
          (editingId
            ? "Coupon updated successfully."
            : "Coupon created successfully."),
      );

      setForm(
        EMPTY_FORM,
      );

      setEditingId(
        null,
      );

      await loadCoupons();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save coupon.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(
    coupon: Coupon,
  ) {
    const adminKey =
      getAdminKey();

    if (!adminKey) {
      setError(
        "Enter your admin key first.",
      );

      return;
    }

    try {
      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/coupons/${encodeURIComponent(
            coupon.id,
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              "x-admin-key":
                adminKey,
            },

            body:
              JSON.stringify({
                enabled:
                  !coupon.enabled,
              }),
          },
        );

      const data =
        (await response.json()) as
          CouponMutationResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to update coupon status.",
        );
      }

      setMessage(
        coupon.enabled
          ? `${coupon.code} disabled.`
          : `${coupon.code} enabled.`,
      );

      await loadCoupons();
    } catch (
      toggleError
    ) {
      setError(
        toggleError instanceof
          Error
          ? toggleError.message
          : "Unable to update coupon status.",
      );
    }
  }

  async function deleteCoupon(
    coupon: Coupon,
  ) {
    const confirmed =
      window.confirm(
        coupon.redemptionCount >
          0 ||
          coupon.orderCount >
            0
          ? `${coupon.code} has existing history. It will be disabled instead of deleted. Continue?`
          : `Delete ${coupon.code}?`,
      );

    if (!confirmed) {
      return;
    }

    const adminKey =
      getAdminKey();

    if (!adminKey) {
      setError(
        "Enter your admin key first.",
      );

      return;
    }

    try {
      setDeletingId(
        coupon.id,
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/coupons/${encodeURIComponent(
            coupon.id,
          )}`,
          {
            method: "DELETE",

            headers: {
              "x-admin-key":
                adminKey,
            },
          },
        );

      const data =
        (await response.json()) as
          CouponMutationResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to delete coupon.",
        );
      }

      setMessage(
        data.message ||
          "Coupon updated.",
      );

      if (
        editingId ===
        coupon.id
      ) {
        resetForm();
      }

      await loadCoupons();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete coupon.",
      );
    } finally {
      setDeletingId(
        null,
      );
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-100">
            Total Coupons
          </p>

          <p className="mt-3 text-4xl font-black">
            {
              stats.totalCoupons
            }
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-green-700 p-6 text-white shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-100">
            Enabled
          </p>

          <p className="mt-3 text-4xl font-black">
            {
              stats.enabledCoupons
            }
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-violet-700 p-6 text-white shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-purple-100">
            Redeemed
          </p>

          <p className="mt-3 text-4xl font-black">
            {
              stats.totalRedeemed
            }
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-100">
            Discount Given
          </p>

          <p className="mt-3 text-3xl font-black">
            {formatMoney(
              totalDiscountGiven,
            )}
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              {editingId
                ? "Edit Promotion"
                : "New Promotion"}
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              {editingId
                ? "Update Coupon"
                : "Create Coupon"}
            </h2>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={
                resetForm
              }
              className="rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 font-black text-slate-700 transition hover:bg-slate-100"
            >
              Cancel Editing
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
            {message}
          </div>
        )}

        <form
          onSubmit={
            submitCoupon
          }
          className="mt-8 grid gap-6 lg:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Coupon Code
            </label>

            <input
              value={
                form.code
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "code",
                  normalizeCode(
                    event.target
                      .value,
                  ),
                )
              }
              required
              maxLength={50}
              placeholder="WELCOME50"
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-black uppercase tracking-[0.08em] text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Coupon Name
            </label>

            <input
              value={
                form.name
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "name",
                  event.target
                    .value,
                )
              }
              required
              maxLength={100}
              placeholder="₱50 OFF"
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-black text-slate-800">
              Description
            </label>

            <textarea
              value={
                form.description
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "description",
                  event.target
                    .value,
                )
              }
              rows={3}
              maxLength={1000}
              placeholder="₱50 discount for 10GB to 50GB eSIM plans."
              className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-medium text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Fixed Discount (PHP)
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={
                form.discountPhp
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "discountPhp",
                  event.target
                    .value,
                )
              }
              required
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-black text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Minimum Purchase (PHP)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.minimumPurchasePhp
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "minimumPurchasePhp",
                  event.target
                    .value,
                )
              }
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Minimum Data (GB)
            </label>

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={
                form.minimumDataGb
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "minimumDataGb",
                  event.target
                    .value,
                )
              }
              placeholder="10"
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Maximum Data (GB)
            </label>

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={
                form.maximumDataGb
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "maximumDataGb",
                  event.target
                    .value,
                )
              }
              placeholder="50"
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Total Usage Limit
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={
                form.usageLimit
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "usageLimit",
                  event.target
                    .value,
                )
              }
              placeholder="Unlimited"
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Limit Per Customer
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={
                form.perCustomerLimit
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "perCustomerLimit",
                  event.target
                    .value,
                )
              }
              required
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Start Date
            </label>

            <input
              type="datetime-local"
              value={
                form.startsAt
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "startsAt",
                  event.target
                    .value,
                )
              }
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Expiration Date
            </label>

            <input
              type="datetime-local"
              value={
                form.expiresAt
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "expiresAt",
                  event.target
                    .value,
                )
              }
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-black text-slate-800">
              Package Codes
            </label>

            <input
              value={
                form.applicablePackageCodes
              }
              onChange={(
                event,
              ) =>
                updateForm(
                  "applicablePackageCodes",
                  event.target
                    .value,
                )
              }
              placeholder="Leave empty for all eligible plans, or enter CKH002, CKH003"
              className="h-14 w-full rounded-2xl border border-slate-300 px-5 font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <input
                type="checkbox"
                checked={
                  form.enabled
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "enabled",
                    event.target
                      .checked,
                  )
                }
                className="h-5 w-5 accent-[#0A2D62]"
              />

              <span>
                <strong className="block text-slate-950">
                  Enabled
                </strong>

                <span className="mt-1 block text-sm text-slate-500">
                  Customers can use this coupon.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <input
                type="checkbox"
                checked={
                  form.firstOrderOnly
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "firstOrderOnly",
                    event.target
                      .checked,
                  )
                }
                className="h-5 w-5 accent-[#0A2D62]"
              />

              <span>
                <strong className="block text-slate-950">
                  First Order Only
                </strong>

                <span className="mt-1 block text-sm text-slate-500">
                  Reject customers with an existing paid order.
                </span>
              </span>
            </label>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#0A2D62] px-7 py-4 font-black text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Coupon"
                  : "Create Coupon"}
            </button>

            <button
              type="button"
              onClick={
                resetForm
              }
              className="rounded-2xl border-2 border-slate-300 bg-white px-7 py-4 font-black text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Promotions
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Existing Coupons
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search coupons..."
              className="h-12 rounded-2xl border border-slate-300 px-4 font-semibold text-slate-950 outline-none focus:border-blue-500"
            />

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "all"
                    | "enabled"
                    | "disabled",
                )
              }
              className="h-12 rounded-2xl border border-slate-300 px-4 font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">
                All Coupons
              </option>

              <option value="enabled">
                Enabled
              </option>

              <option value="disabled">
                Disabled
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                void loadCoupons();
              }}
              className="h-12 rounded-2xl bg-slate-900 px-5 font-black text-white transition hover:bg-slate-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl bg-slate-100"
                />
              ),
            )}
          </div>
        ) : coupons.length ===
          0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center">
            <p className="text-5xl">
              🎟️
            </p>

            <h3 className="mt-5 text-2xl font-black text-slate-950">
              No coupons found
            </h3>

            <p className="mt-2 text-slate-500">
              Create your first promotion using the form above.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {coupons.map(
              (coupon) => (
                <article
                  key={
                    coupon.id
                  }
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black tracking-wider text-blue-700">
                            {
                              coupon.code
                            }
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                              coupon.enabled,
                            )}`}
                          >
                            {coupon.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-black text-slate-950">
                          {
                            coupon.name
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {coupon.description ||
                            "No description"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-black text-emerald-700">
                          {formatMoney(
                            coupon.discountPhp ??
                              0,
                          )}
                        </p>

                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Fixed Discount
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Data Range
                      </p>

                      <p className="mt-2 font-black text-slate-800">
                        {coupon.minimumDataGb ??
                          "Any"}
                        {" – "}
                        {coupon.maximumDataGb ??
                          "Any"}{" "}
                        GB
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Redeemed
                      </p>

                      <p className="mt-2 font-black text-slate-800">
                        {
                          coupon.redeemedCount
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Reserved
                      </p>

                      <p className="mt-2 font-black text-slate-800">
                        {
                          coupon.reservedCount
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Usage Limit
                      </p>

                      <p className="mt-2 font-black text-slate-800">
                        {coupon.usageLimit ??
                          "Unlimited"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Per Customer
                      </p>

                      <p className="mt-2 font-black text-slate-800">
                        {
                          coupon.perCustomerLimit
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Expires
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-800">
                        {formatDate(
                          coupon.expiresAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 p-5">
                    <button
                      type="button"
                      onClick={() =>
                        editCoupon(
                          coupon,
                        )
                      }
                      className="rounded-xl bg-[#0A2D62] px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void toggleCoupon(
                          coupon,
                        );
                      }}
                      className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                        coupon.enabled
                          ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {coupon.enabled
                        ? "Disable"
                        : "Enable"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        coupon.id
                      }
                      onClick={() => {
                        void deleteCoupon(
                          coupon,
                        );
                      }}
                      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId ===
                      coupon.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}