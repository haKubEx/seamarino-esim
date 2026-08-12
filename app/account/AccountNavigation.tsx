"use client";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

const navigation = [
  {
    href: "/account",
    label: "Dashboard",
    icon: "🏠",
    exact: true,
  },
  {
    href: "/account/orders",
    label: "My Orders",
    icon: "📦",
  },
  {
    href: "/account/wallet",
    label: "My Wallet",
    icon: "💳",
  },
  {
    href: "/account/referrals",
    label: "Referral Rewards",
    icon: "🎁",
  },
  {
    href: "/account/profile",
    label: "My Profile",
    icon: "👤",
  },
  {
    href:
      "/account/change-password",
    label: "Change Password",
    icon: "🔒",
  },
  {
    href: "/shop",
    label: "Buy eSIM",
    icon: "🌍",
    exact: true,
  },
];

export default function AccountNavigation() {
  const pathname =
    usePathname();

  return (
    <nav className="space-y-2 p-4">
      {navigation.map(
        (item) => {
          const active =
            item.exact
              ? pathname ===
                item.href
              : pathname ===
                  item.href ||
                pathname.startsWith(
                  `${item.href}/`,
                );

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                active
                  ? "page"
                  : undefined
              }
              className={
                active
                  ? "flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 font-black text-blue-700 shadow-sm"
                  : "flex items-center gap-3 rounded-2xl border border-transparent px-5 py-4 font-bold text-slate-700 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
              }
            >
              <span
                className={
                  active
                    ? "flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white"
                    : "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg"
                }
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </Link>
          );
        },
      )}
    </nav>
  );
}