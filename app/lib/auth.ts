import "server-only";

import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/app/lib/prisma";

function normalizeEmail(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function normalizePassword(value: unknown) {
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
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Email and password",

      credentials: {
        email: {
          label: "Email address",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email =
          normalizeEmail(
            credentials?.email,
          );

        const password =
          normalizePassword(
            credentials?.password,
          );

        if (!email || !password) {
          return null;
        }

        const user =
          await prisma.user.findUnique({
            where: {
              email,
            },
          });

        if (!user) {
          return null;
        }

        const passwordMatches =
          await bcrypt.compare(
            password,
            user.passwordHash,
          );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
    }) {
      if (user?.id) {
        token.userId = user.id;
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (
        session.user &&
        typeof token.userId ===
          "string"
      ) {
        session.user.id =
          token.userId;
      }

      return session;
    },
  },
});