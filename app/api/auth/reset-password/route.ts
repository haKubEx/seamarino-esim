import {
  createHash,
} from "crypto";

import bcrypt from "bcrypt";

import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BCRYPT_ROUNDS = 12;

function hashToken(
  token: string,
) {
  return createHash(
    "sha256",
  )
    .update(token)
    .digest("hex");
}

function validatePassword(
  password: string,
) {
  if (
    password.length < 8
  ) {
    return "Password must contain at least 8 characters.";
  }

  if (
    password.length > 128
  ) {
    return "Password is too long.";
  }

  if (
    !/[A-Z]/.test(
      password,
    )
  ) {
    return "Password must contain at least one uppercase letter.";
  }

  if (
    !/[a-z]/.test(
      password,
    )
  ) {
    return "Password must contain at least one lowercase letter.";
  }

  if (
    !/[0-9]/.test(
      password,
    )
  ) {
    return "Password must contain at least one number.";
  }

  return null;
}

export async function POST(
  request: Request,
) {
  try {
    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "The submitted request is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const requestBody =
      body as {
        token?: unknown;
        password?: unknown;
        confirmPassword?: unknown;
      };

    const token =
      typeof requestBody.token ===
        "string"
        ? requestBody.token.trim()
        : "";

    const password =
      typeof requestBody.password ===
        "string"
        ? requestBody.password
        : "";

    const confirmPassword =
      typeof requestBody.confirmPassword ===
        "string"
        ? requestBody.confirmPassword
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The password reset link is invalid.",
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
            "The passwords do not match.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordError =
      validatePassword(
        password,
      );

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          error:
            passwordError,
        },
        {
          status: 400,
        },
      );
    }

    const tokenHash =
      hashToken(token);

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <=
        new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This password reset link is invalid or has expired.",
        },
        {
          status: 400,
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email:
            resetToken.email,
        },

        select: {
          id: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This password reset request is no longer valid.",
        },
        {
          status: 400,
        },
      );
    }

    const newPasswordHash =
      await bcrypt.hash(
        password,
        BCRYPT_ROUNDS,
      );

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          passwordHash:
            newPasswordHash,
        },
      }),

      prisma.passwordResetToken.update({
        where: {
          id:
            resetToken.id,
        },

        data: {
          usedAt:
            new Date(),
        },
      }),

      /*
       * Force logout from all existing sessions.
       */
      prisma.session.deleteMany({
        where: {
          userId:
            user.id,
        },
      }),

      /*
       * Remove any other outstanding reset tokens.
       */
      prisma.passwordResetToken.deleteMany({
        where: {
          email:
            resetToken.email,

          id: {
            not:
              resetToken.id,
          },
        },
      }),
    ]);

    console.info(
      "CUSTOMER PASSWORD RESET:",
      {
        userId:
          user.id,
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to reset your password.",
      },
      {
        status: 500,
      },
    );
  }
}