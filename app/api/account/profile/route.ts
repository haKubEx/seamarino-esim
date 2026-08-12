import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 40;

type ProfileUpdateBody = {
  name?: unknown;
  phone?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
  };
}

function normalizeName(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizePhone(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1_500,
    );
  }

  return "Unknown profile error.";
}

export async function GET() {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must sign in to view your profile.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            session.user.id,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account could not be found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        profile: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone,

          role:
            user.role,

          emailVerified:
            user.emailVerified
              ?.toISOString() ??
            null,

          createdAt:
            user.createdAt
              .toISOString(),

          updatedAt:
            user.updatedAt
              .toISOString(),
        },
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "ACCOUNT PROFILE GET ERROR:",
      {
        error: message,
      },
    );

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV ===
          "development"
            ? message
            : "Unable to load your profile.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must sign in to update your profile.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    let body:
      ProfileUpdateBody;

    try {
      body =
        (await request.json()) as
          ProfileUpdateBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "The profile request body is invalid.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const name =
      normalizeName(body.name);

    const phone =
      normalizePhone(body.phone);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your name is required.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      name.length >
      MAX_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Your name must not exceed ${MAX_NAME_LENGTH} characters.`,
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      phone &&
      phone.length >
        MAX_PHONE_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Your phone number must not exceed ${MAX_PHONE_LENGTH} characters.`,
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      phone &&
      !/^[0-9+\-().\s]+$/.test(
        phone,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid phone number.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id:
            session.user.id,
        },

        data: {
          name,
          phone,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          updatedAt: true,
        },
      });

    console.info(
      "ACCOUNT PROFILE UPDATED:",
      {
        userId:
          updatedUser.id,

        email:
          updatedUser.email,
      },
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Your profile was updated successfully.",

        profile: {
          id:
            updatedUser.id,

          name:
            updatedUser.name,

          email:
            updatedUser.email,

          phone:
            updatedUser.phone,

          role:
            updatedUser.role,

          emailVerified:
            updatedUser
              .emailVerified
              ?.toISOString() ??
            null,

          updatedAt:
            updatedUser
              .updatedAt
              .toISOString(),
        },
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "ACCOUNT PROFILE UPDATE ERROR:",
      {
        error: message,
      },
    );

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV ===
          "development"
            ? message
            : "Unable to update your profile.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}