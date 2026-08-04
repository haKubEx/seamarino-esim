"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import CustomerStats from "./components/CustomerStats";
import CustomerTable, {
  type CustomerRecord,
} from "./components/CustomerTable";

type CustomerStatsData = {
  totalCustomers: number;
  newThisMonth: number;
  repeatCustomers: number;
  totalRevenueCentavos: number;
};

type CustomersResponse = {
  success: boolean;
  error?: string;
  stats?: CustomerStatsData;
  customers?: CustomerRecord[];
};

const EMPTY_STATS: CustomerStatsData = {
  totalCustomers: 0,
  newThisMonth: 0,
  repeatCustomers: 0,
  totalRevenueCentavos: 0,
};

export default function AdminCustomersPage() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    customers,
    setCustomers,
  ] = useState<CustomerRecord[]>(
    [],
  );

  const [
    stats,
    setStats,
  ] =
    useState<CustomerStatsData>(
      EMPTY_STATS,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadCustomers =
    useCallback(
      async (
        searchValue = "",
      ) => {
        const adminKey =
          localStorage.getItem(
            "adminKey",
          ) ?? "";

        if (!adminKey) {
          setLoading(false);

          setError(
            "Open the Admin Dashboard, enter your admin key, and load the settings first.",
          );

          return;
        }

        try {
          setLoading(true);
          setError("");

          const query =
            searchValue.trim()
              ? `?search=${encodeURIComponent(
                  searchValue.trim(),
                )}`
              : "";

          const response =
            await fetch(
              `/api/admin/customers${query}`,
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
            (await response.json()) as CustomersResponse;

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                "Unable to load customers.",
            );
          }

          setCustomers(
            data.customers ?? [],
          );

          setStats(
            data.stats ??
              EMPTY_STATS,
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load customers.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void loadCustomers(
      search,
    );
  }

  function clearSearch() {
    setSearch("");
    void loadCustomers("");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Customer Management
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Customers
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            Review registered customers,
            order activity, lifetime
            spending, and recent
            purchases.
          </p>
        </section>

        <section className="mt-8">
          <CustomerStats
            totalCustomers={
              stats.totalCustomers
            }
            newThisMonth={
              stats.newThisMonth
            }
            repeatCustomers={
              stats.repeatCustomers
            }
            totalRevenueCentavos={
              stats.totalRevenueCentavos
            }
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Customer Directory
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Registered Customers
                </h2>
              </div>

              <form
                onSubmit={handleSearch}
                className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
              >
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search name, email, phone, or order reference"
                  className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-slate-400 bg-white px-5 font-semibold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-[#0A2D62] px-6 py-3.5 font-black text-white transition hover:bg-blue-800 disabled:opacity-50"
                >
                  Search
                </button>

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    disabled={loading}
                    className="rounded-2xl border-2 border-slate-300 bg-white px-6 py-3.5 font-black text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <CustomerTable
              customers={
                customers
              }
              loading={loading}
            />
          </div>
        </section>
      </div>
    </main>
  );
}