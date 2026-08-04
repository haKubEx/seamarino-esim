"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { signOut } from "next-auth/react";

const navigationLinks = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/shop",
    label: "Shop",
  },
  {
    href: "/global-plans",
    label: "Global Plans",
  },
  {
    href: "/coverage",
    label: "Coverage",
  },
  {
    href: "/faq",
    label: "FAQ",
  },
  {
    href: "/contact",
    label: "Contact",
  },
];

type AuthSession = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: string;
} | null;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [session, setSession] =
    useState<AuthSession>(null);

  const [sessionLoading, setSessionLoading] =
    useState(true);

  const authenticated =
    Boolean(session?.user?.id);

  const loadSession =
    useCallback(async () => {
      try {
        const response = await fetch(
          "/api/auth/session",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          setSession(null);
          return;
        }

        const data =
          (await response.json()) as AuthSession;

        setSession(data);
      } catch (error) {
        console.error(
          "NAVBAR SESSION ERROR:",
          error,
        );

        setSession(null);
      } finally {
        setSessionLoading(false);
      }
    }, []);

  useEffect(() => {
    setMenuOpen(false);
    void loadSession();
  }, [pathname, loadSession]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    }

    function handleWindowFocus() {
      void loadSession();
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );
    };
  }, [loadSession]);

  function isActiveLink(
    href: string,
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    setMenuOpen(false);

    await signOut({
      redirect: false,
    });

    setSession(null);

    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-[88px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="Go to Seamarino eSIM homepage"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            <img
              src="/seamarino-logo.jpg"
              alt="Seamarino eSIM logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0 leading-none">
            <p className="truncate text-xl font-black tracking-tight text-[#0A2D62] sm:text-2xl">
              Seamarino
            </p>

            <p className="mt-1 text-sm font-extrabold tracking-wide text-sky-500 sm:text-base">
              eSIM
            </p>
          </div>
        </Link>

        <nav
          aria-label="Desktop navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navigationLinks.map(
            (link) => {
              const active =
                isActiveLink(
                  link.href,
                );

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-blue-50 text-[#0A2D62]"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[#0A2D62]",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            },
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {sessionLoading ? (
            <div
              className="h-11 w-28 animate-pulse rounded-xl bg-slate-100"
              aria-label="Loading account"
            />
          ) : authenticated ? (
            <>
              <Link
                href="/account"
                className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0A2D62] transition hover:bg-blue-50"
              >
                My Account
              </Link>

              <button
                type="button"
                onClick={
                  handleSignOut
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[#0A2D62] transition hover:bg-blue-50"
            >
              Login
            </Link>
          )}

          <Link
            href="/shop"
            className="rounded-xl bg-[#0A2D62] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#071f45] hover:shadow-lg"
          >
            Buy eSIM
          </Link>
        </div>

        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (currentValue) =>
                !currentValue,
            )
          }
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-[#0A2D62] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
        >
          {menuOpen ? (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white shadow-lg lg:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 sm:px-6"
          >
            {navigationLinks.map(
              (link) => {
                const active =
                  isActiveLink(
                    link.href,
                  );

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "rounded-xl px-4 py-3 font-semibold transition",
                      active
                        ? "bg-blue-50 text-[#0A2D62]"
                        : "text-slate-700 hover:bg-slate-100 hover:text-[#0A2D62]",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                );
              },
            )}

            <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
              {sessionLoading ? (
                <div className="h-12 animate-pulse rounded-xl bg-slate-100 sm:col-span-2" />
              ) : authenticated ? (
                <>
                  <Link
                    href="/account"
                    className="rounded-xl border border-[#0A2D62] px-4 py-3 text-center font-semibold text-[#0A2D62] transition hover:bg-blue-50"
                  >
                    My Account
                  </Link>

                  <button
                    type="button"
                    onClick={
                      handleSignOut
                    }
                    className="rounded-xl border border-red-300 bg-white px-4 py-3 text-center font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-[#0A2D62] px-4 py-3 text-center font-semibold text-[#0A2D62] transition hover:bg-blue-50 sm:col-span-2"
                >
                  Login
                </Link>
              )}

              <Link
                href="/shop"
                className="rounded-xl bg-[#0A2D62] px-4 py-3 text-center font-bold text-white transition hover:bg-[#071f45] sm:col-span-2"
              >
                Buy eSIM
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}