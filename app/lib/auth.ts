import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/app/lib/prisma";

type AppUserRole =
  | "CUSTOMER"
  | "ADMIN";

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: AppUserRole;
  phone: string | null;
  emailVerified: Date | null;
};

function normalizeEmail(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function readPassword(
  value: unknown,
) {
  return typeof value === "string"
    ? value
    : "";
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret:
    process.env.AUTH_SECRET,

  trustHost: true,

  session: {
    strategy: "jwt",

    maxAge:
      30 * 24 * 60 * 60,

    updateAge:
      24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      id: "credentials",

      name:
        "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder:
            "you@example.com",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(
        credentials,
      ) {
        try {
          const email =
            normalizeEmail(
              credentials?.email,
            );

          const password =
            readPassword(
              credentials?.password,
            );

          if (
            !email ||
            !password
          ) {
            console.warn(
              "LOGIN REJECTED: Missing credentials.",
            );

            return null;
          }

          if (
            email.length > 254 ||
            password.length > 128
          ) {
            console.warn(
              "LOGIN REJECTED: Invalid credential length.",
              {
                email,
              },
            );

            return null;
          }

          const user =
            await prisma.user.findFirst({
              where: {
                email: {
                  equals:
                    email,

                  mode:
                    "insensitive",
                },
              },

              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
                role: true,
                passwordHash:
                  true,
                emailVerified:
                  true,
              },
            });

          if (!user) {
            console.warn(
              "LOGIN REJECTED: Account not found.",
              {
                email,
              },
            );

            return null;
          }

          const storedHash =
            user.passwordHash.trim();

          const hashLooksValid =
            /^\$2[aby]\$\d{2}\$/.test(
              storedHash,
            );

          if (!hashLooksValid) {
            console.error(
              "LOGIN REJECTED: Invalid bcrypt hash.",
              {
                userId:
                  user.id,

                email:
                  user.email,

                hashLength:
                  storedHash.length,
              },
            );

            return null;
          }

          const passwordMatches =
            await bcrypt.compare(
              password,
              storedHash,
            );

          if (!passwordMatches) {
            console.warn(
              "LOGIN REJECTED: Password mismatch.",
              {
                userId:
                  user.id,

                email:
                  user.email,
              },
            );

            return null;
          }

          const authenticatedUser:
            AuthenticatedUser = {
              id:
                user.id,

              name:
                user.name,

              email:
                user.email,

              image:
                user.image,

              role:
                user.role,

              phone:
                user.phone,

              emailVerified:
                user.emailVerified,
            };

          console.info(
            "CUSTOMER LOGIN SUCCESS:",
            {
              userId:
                user.id,

              email:
                user.email,

              role:
                user.role,
            },
          );

          return authenticatedUser;
        } catch (error) {
          console.error(
            "CREDENTIAL AUTHORIZATION ERROR:",
            error,
          );

          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }) {
      if (user) {
        const authenticatedUser =
          user as AuthenticatedUser;

        token.id =
          authenticatedUser.id;

        token.role =
          authenticatedUser.role;

        token.phone =
          authenticatedUser.phone;

        token.emailVerified =
          authenticatedUser
            .emailVerified
            ?.toISOString() ??
          null;
      }

      if (
        trigger === "update" &&
        session
      ) {
        const update =
          session as {
            name?: unknown;
            phone?: unknown;
          };

        if (
          typeof update.name ===
          "string"
        ) {
          token.name =
            update.name.trim();
        }

        if (
          typeof update.phone ===
          "string"
        ) {
          token.phone =
            update.phone.trim();
        }
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (!session.user) {
        return session;
      }

      session.user.id =
        typeof token.id ===
        "string"
          ? token.id
          : token.sub ?? "";

      session.user.role =
        token.role === "ADMIN"
          ? "ADMIN"
          : "CUSTOMER";

      session.user.phone =
        typeof token.phone ===
        "string"
          ? token.phone
          : null;

      session.user.emailVerified =
        typeof token.emailVerified ===
        "string"
          ? new Date(
              token.emailVerified,
            )
          : null;

      return session;
    },

    async redirect({
      url,
      baseUrl,
    }) {
      if (
        url.startsWith("/") &&
        !url.startsWith("//")
      ) {
        return `${baseUrl}${url}`;
      }

      try {
        const destination =
          new URL(url);

        if (
          destination.origin ===
          baseUrl
        ) {
          return destination.toString();
        }
      } catch {
        // Use the safe fallback below.
      }

      return `${baseUrl}/account`;
    },
  },

  events: {
    async signIn({
      user,
    }) {
      console.info(
        "AUTH SESSION CREATED:",
        {
          userId:
            user.id,

          email:
            user.email,
        },
      );
    },
  },

  debug:
    process.env.NODE_ENV ===
    "development",
});