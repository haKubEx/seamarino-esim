import {
  createHash,
  randomBytes,
} from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import {
  sendPasswordResetEmail,
} from "@/app/services/passwordResetEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESET_TOKEN_EXPIRY_MINUTES =
  30;

function normalizeAppUrl(
  value: string,
) {
  return value
    .trim()
    .replace(/\/+$/, "");
}

function getApplicationUrl() {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_BASE_URL
      ?.trim();

  if (configuredUrl) {
    return normalizeAppUrl(
      configuredUrl,
    );
  }

  const vercelUrl =
    process.env
      .VERCEL_URL
      ?.trim();

  if (vercelUrl) {
    return normalizeAppUrl(
      `https://${vercelUrl}`,
    );
  }

  return "http://localhost:3000";
}

function normalizeEmail(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value
        .trim()
        .toLowerCase()
    : "";
}

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function hashToken(
  token: string,
) {
  return createHash(
    "sha256",
  )
    .update(token)
    .digest("hex");
}

function genericSuccessResponse() {
  return NextResponse.json({
    success: true,
    message:
      "If an account exists for that email, a password reset link has been sent.",
  });
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

    const email =
      normalizeEmail(
        (
          body as {
            email?: unknown;
          }
        )?.email,
      );

    if (
      !isValidEmail(email) ||
      email.length > 254
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    /*
     * Return the same message even if no account exists.
     * This prevents attackers from discovering registered emails.
     */
    if (!user) {
      return genericSuccessResponse();
    }

    const rawToken =
      randomBytes(32).toString(
        "hex",
      );

    const tokenHash =
      hashToken(rawToken);

    const expiresAt =
      new Date(
        Date.now() +
          RESET_TOKEN_EXPIRY_MINUTES *
            60 *
            1000,
      );

    /*
     * Remove old reset tokens for this account.
     */
    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl =
      `${getApplicationUrl()}/reset-password?token=${encodeURIComponent(
        rawToken,
      )}`;

    try {
      await sendPasswordResetEmail({
        customerName:
          user.name,
        customerEmail:
          user.email,
        resetUrl,
      });
    } catch (emailError) {
      /*
       * Remove the token if email delivery failed.
       */
      await prisma.passwordResetToken.deleteMany({
        where: {
          tokenHash,
        },
      });

      console.error(
        "FORGOT PASSWORD EMAIL ERROR:",
        emailError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "We could not send the reset email. Please try again.",
        },
        {
          status: 500,
        },
      );
    }

    console.info(
      "PASSWORD RESET REQUEST CREATED:",
      {
        userId:
          user.id,
        email:
          user.email,
        expiresAt,
      },
    );

    return genericSuccessResponse();
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process the password reset request.",
      },
      {
        status: 500,
      },
    );
  }
}