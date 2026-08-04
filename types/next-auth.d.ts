import type {
  DefaultSession,
} from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role:
        | "CUSTOMER"
        | "ADMIN";
      phone: string | null;
      emailVerified:
        | Date
        | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role:
      | "CUSTOMER"
      | "ADMIN";
    phone: string | null;
    emailVerified:
      | Date
      | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role:
      | "CUSTOMER"
      | "ADMIN";
    phone: string | null;
    emailVerified:
      | string
      | null;
  }
}

export {};