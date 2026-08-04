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
    activePath ||
    href.split("#")[0];

  if (exact) {
    return pathname === pathToCheck;
  }

  return pathname.startsWith(
    pathToCheck,
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

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
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0A2D62] text-2xl text-white shadow-xl lg:hidden"
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
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          aria-label="Close admin menu"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#071f45] text-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex min-h-[96px] items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-xl lg:hidden"
            aria-label="Close admin menu"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-black uppercase tracking-[0.2em] text-blue-300">
            Management
          </p>

          <div className="mt-4 grid gap-2">
            {adminLinks.map(
              (link) => {
                const active =
                  isActivePath({
                    pathname,
                    href: link.href,
                    activePath:
                      link.activePath,
                    exact: link.exact,
                  });

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "flex items-center gap-4 rounded-2xl px-4 py-3.5 font-bold transition",
                      active
                        ? "bg-white text-[#0A2D62] shadow-lg"
                        : "text-blue-100 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className="text-xl"
                      aria-hidden="true"
                    >
                      {link.icon}
                    </span>

                    <span>
                      {link.label}
                    </span>
                  </Link>
                );
              },
            )}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="px-3 text-xs font-black uppercase tracking-[0.2em] text-blue-300">
              Store
            </p>

            <div className="mt-4 grid gap-2">
              <Link
                href="/"
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5 font-bold text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-xl">
                  🛒
                </span>

                View Storefront
              </Link>

              <Link
                href="/shop"
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5 font-bold text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-xl">
                  📱
                </span>

                Browse Plans
              </Link>
            </div>
          </div>
        </nav>

        <div className="border-t border-white/10 p-5">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <p className="text-sm font-black text-emerald-200">
                System Online
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-blue-200">
              Storefront and fulfillment
              services are active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}