import {
  randomBytes,
} from "crypto";

import bcrypt from "bcrypt";
import {
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const MAX_REFERRAL_CODE_ATTEMPTS =
  10;

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  referralCode?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function normalizeString(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normalizeEmail(
  value: unknown,
) {
  return normalizeString(
    value,
  ).toLowerCase();
}

function normalizeReferralCode(
  value: unknown,
) {
  return normalizeString(
    value,
  )
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
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
    return "Password must not exceed 128 characters.";
  }

  if (
    !/[a-z]/.test(
      password,
    )
  ) {
    return "Password must contain a lowercase letter.";
  }

  if (
    !/[A-Z]/.test(
      password,
    )
  ) {
    return "Password must contain an uppercase letter.";
  }

  if (
    !/[0-9]/.test(
      password,
    )
  ) {
    return "Password must contain a number.";
  }

  return null;
}

function createNamePrefix(
  name: string,
) {
  const letters =
    name
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-zA-Z0-9]/g,
        "",
      )
      .toUpperCase()
      .slice(0, 6);

  return letters ||
    "SEA";
}

function createRandomCodePart() {
  return randomBytes(3)
    .toString("hex")
    .toUpperCase();
}

function createReferralCodeCandidate(
  name: string,
) {
  const prefix =
    createNamePrefix(name);

  return `${prefix}${createRandomCodePart()}`;
}

async function generateUniqueReferralCode(
  name: string,
) {
  for (
    let attempt = 0;
    attempt <
    MAX_REFERRAL_CODE_ATTEMPTS;
    attempt += 1
  ) {
    const candidate =
      createReferralCodeCandidate(
        name,
      );

    const existingUser =
      await prisma.user.findUnique({
        where: {
          referralCode:
            candidate,
        },

        select: {
          id: true,
        },
      });

    if (!existingUser) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to generate a unique referral code.",
  );
}

async function getReferralSettings() {
  const settings =
    await prisma.appSetting.upsert({
      where: {
        id: "main",
      },

      update: {},

      create: {
        id: "main",
      },

      select: {
        referralRewardPhpCentavos:
          true,

        referredRewardPhpCentavos:
          true,
      },
    });

  return settings;
}

export async function POST(
  request: Request,
) {
  try {
    let body:
      RegisterBody;

    try {
      body =
        (await request.json()) as
          RegisterBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "The registration request is invalid.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const name =
      normalizeString(
        body.name,
      );

    const email =
      normalizeEmail(
        body.email,
      );

    /*
     * Do not trim passwords.
     * Spaces may intentionally be part
     * of a customer's password.
     */
    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body.confirmPassword ===
      "string"
        ? body.confirmPassword
        : "";

    const submittedReferralCode =
      normalizeReferralCode(
        body.referralCode,
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
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      name.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter your complete name.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      name.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Name must not exceed 100 characters.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !isValidEmail(
        email,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid email address.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      email.length > 254
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email address is too long.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
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
          headers:
            noStoreHeaders(),
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
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      submittedReferralCode &&
      (
        submittedReferralCode.length <
          4 ||
        submittedReferralCode.length >
          50 ||
        !/^[A-Z0-9_-]+$/.test(
          submittedReferralCode,
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid referral code.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
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
          headers:
            noStoreHeaders(),
        },
      );
    }

    const referrer =
      submittedReferralCode
        ? await prisma.user.findUnique({
            where: {
              referralCode:
                submittedReferralCode,
            },

            select: {
              id: true,
              email: true,
              referralCode:
                true,
            },
          })
        : null;

    if (
      submittedReferralCode &&
      !referrer
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The referral code was not found.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      referrer &&
      referrer.email
        .trim()
        .toLowerCase() ===
        email
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You cannot use your own referral code.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const [
      passwordHash,
      generatedReferralCode,
      referralSettings,
    ] = await Promise.all([
      bcrypt.hash(
        password,
        12,
      ),

      generateUniqueReferralCode(
        name,
      ),

      getReferralSettings(),
    ]);

    const result =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          /*
           * Recheck inside the transaction
           * to reduce duplicate-registration
           * race conditions.
           */
          const duplicateUser =
            await transaction.user.findUnique({
              where: {
                email,
              },

              select: {
                id: true,
              },
            });

          if (duplicateUser) {
            throw new Error(
              "EMAIL_ALREADY_REGISTERED",
            );
          }

          const user =
            await transaction.user.create({
              data: {
                name,
                email,
                passwordHash,

                referralCode:
                  generatedReferralCode,

                referredById:
                  referrer?.id ??
                  null,

                storeCreditPhpCentavos:
                  0,
              },

              select: {
                id: true,
                name: true,
                email: true,
                referralCode:
                  true,
                storeCreditPhpCentavos:
                  true,
                referredById:
                  true,
                createdAt:
                  true,
              },
            });

          if (
            referrer &&
            submittedReferralCode
          ) {
            await transaction.referral.create({
              data: {
                referralCode:
                  submittedReferralCode,

                referrerId:
                  referrer.id,

                referredUserId:
                  user.id,

                status:
                  "PENDING",

                referrerRewardPhpCentavos:
                  referralSettings
                    .referralRewardPhpCentavos,

                referredRewardPhpCentavos:
                  referralSettings
                    .referredRewardPhpCentavos,
              },
            });
          }

          /*
           * Link previous guest orders
           * created with the same email.
           */
          const linkedOrders =
            await transaction.order.updateMany({
              where: {
                userId:
                  null,

                customerEmail: {
                  equals:
                    email,

                  mode:
                    "insensitive",
                },
              },

              data: {
                userId:
                  user.id,
              },
            });

          return {
            user,
            linkedOrderCount:
              linkedOrders.count,
            referralApplied:
              Boolean(referrer),
          };
        },
        {
          isolationLevel:
            "Serializable",
        },
      );

    return NextResponse.json(
      {
        success: true,

        message:
          result.referralApplied
            ? "Your account was created and the referral code was applied successfully."
            : "Your account was created successfully.",

        user: {
          ...result.user,

          createdAt:
            result.user.createdAt.toISOString(),
        },

        referralApplied:
          result.referralApplied,

        linkedOrderCount:
          result.linkedOrderCount,
      },
      {
        status: 201,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    if (
      error instanceof
        Error &&
      error.message ===
        "EMAIL_ALREADY_REGISTERED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account already exists for this email address.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

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
        headers:
          noStoreHeaders(),
      },
    );
  }
}