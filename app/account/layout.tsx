import {
  redirect,
} from "next/navigation";

import {
  auth,
  signOut,
} from "@/app/lib/auth";

import AccountNavigation from "./AccountNavigation";

type AccountLayoutProps = {
  children:
    React.ReactNode;
};

export default async function AccountLayout({
  children,
}: AccountLayoutProps) {
  const session =
    await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/account",
    );
  }

  const displayRole =
    session.user.role
      ?.trim()
      .replaceAll("_", " ") ||
    "CUSTOMER";

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-4 py-8 lg:flex-row lg:px-6">
        <aside className="w-full shrink-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6 lg:h-fit lg:w-72">
          <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              Seamarino eSIM
            </p>

            <h2 className="mt-4 break-words text-2xl font-black">
              {session.user.name ??
                "Customer"}
            </h2>

            <p className="mt-2 break-all text-sm text-blue-100">
              {session.user.email}
            </p>

            <div className="mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em]">
              {displayRole}
            </div>
          </div>

          <AccountNavigation />

          <div className="border-t border-slate-100 p-4">
            <form
              action={async () => {
                "use server";

                await signOut({
                  redirectTo:
                    "/login",
                });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-2xl bg-red-600 px-5 py-3.5 font-black text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {children}
        </section>
      </div>
    </div>
  );
}