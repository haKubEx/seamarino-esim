import type {
  DefaultSession,
  DefaultUser,
} from "next-auth";

type AppUserRole =
  | "CUSTOMER"
  | "ADMIN";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: AppUserRole;
    phone: string | null;
    emailVerified: Date | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      phone: string | null;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppUserRole;
    phone?: string | null;
    emailVerified?: string | null;
  }
}

export {};