type CustomerStatsProps = {
  totalCustomers: number;
  newThisMonth: number;
  repeatCustomers: number;
  totalRevenueCentavos: number;
};

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

export default function CustomerStats({
  totalCustomers,
  newThisMonth,
  repeatCustomers,
  totalRevenueCentavos,
}: CustomerStatsProps) {
  const cards = [
    {
      label: "Total Customers",
      value: totalCustomers,
      description:
        "Registered customer accounts",
    },
    {
      label: "New This Month",
      value: newThisMonth,
      description:
        "Customers who joined this month",
    },
    {
      label: "Repeat Customers",
      value: repeatCustomers,
      description:
        "Customers with more than one paid order",
    },
    {
      label: "Customer Revenue",
      value: formatMoney(
        totalRevenueCentavos,
      ),
      description:
        "Revenue from registered customers",
    },
  ];

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {card.label}
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950">
            {card.value}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {card.description}
          </p>
        </article>
      ))}
    </section>
  );
}