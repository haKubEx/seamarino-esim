import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

function formatMoney(
  amountCentavos: number,
) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    },
  ).format(
    amountCentavos / 100,
  );
}

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(value);
}

function getStatusClass(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
    case "DELIVERED":
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "FAILED":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "PROCESSING":
    case "ISSUED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/account/orders",
    );
  }

  const orders =
    await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        referenceNumber: true,
        planName: true,
        packageCode: true,
        amountPhpCentavos: true,
        status: true,
        paymentStatus: true,
        esimStatus: true,
        createdAt: true,
        completedAt: true,
        iccid: true,
        qrCodeUrl: true,
      },
    });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Customer Account
            </p>

            <h1 className="mt-2 text-4xl font-black text-slate-950">
              My Orders
            </h1>

            <p className="mt-3 text-slate-600">
              View your purchases and access your eSIM details.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-2xl bg-[#0A2D62] px-6 py-3.5 font-black text-white shadow-md transition hover:bg-blue-800"
          >
            Buy Another eSIM
          </Link>
        </div>

        {orders.length === 0 ? (
          <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              📦
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              No orders yet
            </h2>

            <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
              Your eSIM purchases will appear here after checkout.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex rounded-2xl bg-[#0A2D62] px-7 py-3.5 font-black text-white"
            >
              Browse Plans
            </Link>
          </section>
        ) : (
          <section className="mt-10 grid gap-6">
            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-5 border-b border-slate-100 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {order.referenceNumber}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {order.packageCode}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-slate-950">
                      {order.planName}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Purchased {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                        order.status,
                      )}`}
                    >
                      Order: {order.status}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                        order.paymentStatus,
                      )}`}
                    >
                      Payment: {order.paymentStatus}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                        order.esimStatus,
                      )}`}
                    >
                      eSIM: {order.esimStatus}
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Amount
                    </p>

                    <p className="mt-2 text-xl font-black text-slate-950">
                      {formatMoney(
                        order.amountPhpCentavos,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      ICCID
                    </p>

                    <p className="mt-2 break-all font-bold text-slate-800">
                      {order.iccid || "Not issued yet"}
                    </p>
                  </div>

                  <div className="flex items-end sm:justify-end">
                    <Link
                      href={`/account/orders/${order.referenceNumber}`}
                      className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#0A2D62] bg-white px-6 py-3.5 font-black text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white sm:w-auto"
                    >
                      {order.qrCodeUrl
                        ? "View eSIM Details"
                        : "View Order Status"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}