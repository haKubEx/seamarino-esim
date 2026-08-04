"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  referenceNumber: string;
  customerName: string;
  planName: string;
  status: string;
  paymentStatus: string;
  esimStatus: string;
  amountPhpCentavos: number;
  createdAt: string;
};

type DashboardResponse = {
  success: boolean;
  recentOrders: Order[];
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadOrders() {
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
        setOrders(data.recentOrders);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadOrders();

    const timer = setInterval(loadOrders, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        Recent Orders
      </h2>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
              <th className="pb-3">Reference</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Plan</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Amount</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-slate-100"
              >
                <td className="py-4 font-bold">
                  {order.referenceNumber}
                </td>

                <td>{order.customerName}</td>

                <td>{order.planName}</td>

                <td>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {order.paymentStatus}
                  </span>
                </td>

                <td>
                  {new Intl.NumberFormat(
                    "en-PH",
                    {
                      style: "currency",
                      currency: "PHP",
                    },
                  ).format(
                    order.amountPhpCentavos / 100,
                  )}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-500"
                >
                  No recent orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}