import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcrypt";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
  };
}

function normalizePassword(
  value: unknown,
) {
  return typeof value === "string"
    ? value
    : "";
}

function validateNewPassword(
  password: string,
) {
  if (password.length < 8) {
    return "Your new password must contain at least 8 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Your new password must contain a lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Your new password must contain an uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Your new password must contain a number.";
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must sign in to change your password.",
        },
        {
          status: 401,
          headers: noStoreHeaders(),
        },
      );
    }

    const body =
      (await request.json()) as ChangePasswordBody;

    const currentPassword =
      normalizePassword(
        body.currentPassword,
      );

    const newPassword =
      normalizePassword(
        body.newPassword,
      );

    const confirmPassword =
      normalizePassword(
        body.confirmPassword,
      );

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Current password, new password, and confirmation are required.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const passwordError =
      validateNewPassword(
        newPassword,
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
          headers: noStoreHeaders(),
        },
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The new passwords do not match.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your new password must be different from your current password.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },

        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User account not found.",
        },
        {
          status: 404,
          headers: noStoreHeaders(),
        },
      );
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (!currentPasswordMatches) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your current password is incorrect.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12,
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        passwordHash:
          newPasswordHash,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your password was changed successfully.",
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to change your password.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}