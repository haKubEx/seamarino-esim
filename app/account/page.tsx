import Link from "next/link";
import { redirect } from "next/navigation";

import {
  auth,
  signOut,
} from "@/app/lib/auth";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/account",
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
            Seamarino Account
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Welcome,{" "}
            {session.user.name ||
              "Customer"}
          </h1>

          <p className="mt-4 text-lg text-blue-100">
            Signed in as{" "}
            {session.user.email}
          </p>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Link
            href="/account/orders"
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              My Orders
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              View eSIM purchases
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Check order status and access
              your QR codes and installation
              details.
            </p>
          </Link>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Account
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Sign out securely
            </h2>

            <form
              className="mt-6"
              action={async () => {
                "use server";

                await signOut({
                  redirectTo: "/",
                });
              }}
            >
              <button
                type="submit"
                className="rounded-2xl bg-[#0A2D62] px-6 py-4 font-black text-white transition hover:bg-blue-800"
              >
                Sign Out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}