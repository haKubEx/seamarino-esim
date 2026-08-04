import Link from "next/link";

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;

  totalOrders: number;
  paidOrders: number;
  totalSpentCentavos: number;

  latestOrder: {
    id: string;
    referenceNumber: string;
    planName: string;
    packageCode: string;
    amountPhpCentavos: number;
    paymentStatus: string;
    esimStatus: string;
    status: string;
    createdAt: string;
  } | null;
};

type CustomerTableProps = {
  customers: CustomerRecord[];
  loading: boolean;
};

function formatMoney(amountCentavos: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amountCentavos / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export default function CustomerTable({
  customers,
  loading,
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-16 text-center">
        <div className="text-5xl">👥</div>

        <h2 className="mt-4 text-2xl font-black text-slate-900">
          No Customers Found
        </h2>

        <p className="mt-2 text-slate-500">
          No registered customers match your search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Orders
              </th>

              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Total Spent
              </th>

              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Latest Order
              </th>

              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Joined
              </th>

              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-6 py-5">
                  <p className="font-black text-slate-900">
                    {customer.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {customer.email}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {customer.phone || "No phone"}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <p className="text-xl font-black text-slate-900">
                    {customer.totalOrders}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {customer.paidOrders} Paid Orders
                  </p>
                </td>

                <td className="px-6 py-5">
                  <p className="text-xl font-black text-emerald-700">
                    {formatMoney(customer.totalSpentCentavos)}
                  </p>
                </td>

                <td className="px-6 py-5">
                  {customer.latestOrder ? (
                    <>
                      <p className="font-bold text-slate-900">
                        {customer.latestOrder.planName}
                      </p>

                      <p className="mt-1 text-sm text-blue-700">
                        {customer.latestOrder.referenceNumber}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          {customer.latestOrder.paymentStatus}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {customer.latestOrder.esimStatus}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">
                      No Orders
                    </span>
                  )}
                </td>

                <td className="px-6 py-5">
                  <p className="font-semibold text-slate-700">
                    {formatDate(customer.createdAt)}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="inline-flex items-center rounded-xl bg-[#0A2D62] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                  >
                    View Customer →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}