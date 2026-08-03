import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

function normalizeString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value: unknown) {
  return normalizeString(value).toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain a number.";
  }

  return null;
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as RegisterBody;

    const name =
      normalizeString(body.name);

    const email =
      normalizeEmail(body.email);

    const password =
      normalizeString(body.password);

    const confirmPassword =
      normalizeString(
        body.confirmPassword,
      );

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Name, email, password, and password confirmation are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter your complete name.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Name must not exceed 100 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email address is too long.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          error: passwordError,
        },
        {
          status: 400,
        },
      );
    }

    if (
      password !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Passwords do not match.",
        },
        {
          status: 400,
        },
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account already exists for this email address.",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    const user =
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
        },

        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

    /*
     * Link previous guest orders that used
     * the same email address.
     */
    await prisma.order.updateMany({
      where: {
        userId: null,

        customerEmail: {
          equals: email,
          mode: "insensitive",
        },
      },

      data: {
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your account was created successfully.",
        user,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "CUSTOMER REGISTRATION ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create your account.",
      },
      {
        status: 500,
      },
    );
  }
}