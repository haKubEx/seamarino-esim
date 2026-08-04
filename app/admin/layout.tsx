import type {
  ReactNode,
} from "react";

import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";

import AdminSidebar from "./components/AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const session =
    await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/admin",
    );
  }

  if (
    session.user.role !==
    "ADMIN"
  ) {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}