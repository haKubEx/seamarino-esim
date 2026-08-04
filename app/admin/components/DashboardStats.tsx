"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  todayRevenueCentavos: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  deliveredEsims: number;
  totalCustomers: number;
};

type DashboardResponse = {
  success: boolean;
  stats: DashboardStats;
};

const cards = [
  {
    key: "todayRevenueCentavos",
    title: "Today's Revenue",
    color: "from-emerald-500 to-green-600",
  },
  {
    key: "todayOrders",
    title: "Today's Orders",
    color: "from-blue-500 to-blue-700",
  },
  {
    key: "pendingOrders",
    title: "Pending Orders",
    color: "from-yellow-500 to-orange-500",
  },
  {
    key: "completedOrders",
    title: "Completed",
    color: "from-purple-500 to-purple-700",
  },
  {
    key: "deliveredEsims",
    title: "Delivered eSIM",
    color: "from-cyan-500 to-sky-600",
  },
  {
    key: "totalCustomers",
    title: "Customers",
    color: "from-pink-500 to-rose-600",
  },
];

export default function DashboardStats() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  async function loadDashboard() {
    try {
      const response = await fetch(
        "/api/admin/dashboard",
        {
          headers: {
            "x-admin-key":
              localStorage.getItem("adminKey") ?? "",
          },
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as DashboardResponse;

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      10000,
    );

    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const value =
          stats[
            card.key as keyof DashboardStats
          ];

        return (
          <div
            key={card.key}
            className={`rounded-3xl bg-gradient-to-r ${card.color} p-6 text-white shadow-xl`}
          >
            <p className="text-sm font-bold uppercase opacity-80">
              {card.title}
            </p>

            <h2 className="mt-4 text-4xl font-black">
              {card.key ===
              "todayRevenueCentavos"
                ? new Intl.NumberFormat(
                    "en-PH",
                    {
                      style: "currency",
                      currency: "PHP",
                    },
                  ).format(
                    Number(value) / 100,
                  )
                : value}
            </h2>
          </div>
        );
      })}
    </div>
  );
}