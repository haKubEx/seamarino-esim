"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const adminLinks = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "📊",
    exact: true,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: "📦",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: "👥",
  },
  {
    href: "/admin/wallet",
    label: "Wallets",
    icon: "💳",
  },
  {
    href: "/admin/referrals",
    label: "Referrals",
    icon: "🎁",
  },
  {
    href: "/admin/coupons",
    label: "Coupons",
    icon: "🎟️",
  },
  {
    href: "/admin/plans",
    label: "Plans",
    icon: "🌍",
  },
  {
    href: "/admin#exchange-rate",
    activePath: "/admin",
    label: "Pricing",
    icon: "💵",
  },
];

function isActivePath({
  pathname,
  href,
  activePath,
  exact,
}: {
  pathname: string;
  href: string;
  activePath?: string;
  exact?: boolean;
}) {
  const pathToCheck =
    activePath ??
    href.split("#")[0];

  if (exact) {
    return pathname === pathToCheck;
  }

  return (
    pathname === pathToCheck ||
    pathname.startsWith(`${pathToCheck}/`)
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setMobileOpen(true)
        }
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0A2D62] text-2xl text-white shadow-xl transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 lg:hidden"
        aria-label="Open admin menu"
      >
        ☰
      </button>

      {mobileOpen && (
        <button
          type="button"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Close admin menu"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#071f45] text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 lg:shadow-none",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        {/* Header */}

        <div className="flex min-h-[96px] items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ⚓
            </div>

            <div>
              <p className="text-lg font-black">
                Seamarino
              </p>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                Administration
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-xl transition hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-black uppercase tracking-[0.2em] text-blue-300">
            Management
          </p>

          <div className="mt-4 grid gap-2">
            {adminLinks.map((link) => {
              const active =
                isActivePath({
                  pathname,
                  href: link.href,
                  activePath:
                    link.activePath,
                  exact:
                    link.exact,
                });

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={[
                    "flex items-center gap-4 rounded-2xl border px-4 py-3.5 font-bold transition",
                    active
                      ? "border-white bg-white text-[#0A2D62] shadow-lg"
                      : "border-transparent text-blue-100 hover:border-white/10 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl text-lg",
                      active
                        ? "bg-blue-100"
                        : "bg-white/5",
                    ].join(" ")}
                  >
                    {link.icon}
                  </span>

                  <span>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Store */}

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="px-3 text-xs font-black uppercase tracking-[0.2em] text-blue-300">
              Store
            </p>

            <div className="mt-4 grid gap-2">
              <Link
                href="/"
                className="flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 font-bold text-blue-100 transition hover:border-white/10 hover:bg-white/10 hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg">
                  🛒
                </span>

                View Storefront
              </Link>

              <Link
                href="/shop"
                className="flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 font-bold text-blue-100 transition hover:border-white/10 hover:bg-white/10 hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg">
                  📱
                </span>

                Browse Plans
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer */}

        <div className="border-t border-white/10 p-5">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <p className="text-sm font-black text-emerald-200">
                System Online
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-blue-200">
              Storefront, wallet,
              referral, coupon and
              fulfillment services are
              active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}