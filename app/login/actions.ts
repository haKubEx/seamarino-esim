"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/app/lib/auth";

export type LoginState = {
  error: string;
};

function normalizeEmail(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function readPassword(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value
    : "";
}

function getSafeCallbackUrl(
  value: FormDataEntryValue | null,
): string {
  if (typeof value !== "string") {
    return "/account";
  }

  const callbackUrl =
    value.trim();

  if (
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return callbackUrl;
  }

  return "/account";
}

export async function loginAction(
  previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  void previousState;

  const email =
    normalizeEmail(
      formData.get("email"),
    );

  const password =
    readPassword(
      formData.get("password"),
    );

  const callbackUrl =
    getSafeCallbackUrl(
      formData.get("callbackUrl"),
    );

  if (!email) {
    return {
      error:
        "Please enter your email address.",
    };
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    return {
      error:
        "Please enter a valid email address.",
    };
  }

  if (!password) {
    return {
      error:
        "Please enter your password.",
    };
  }

  try {
    await signIn(
      "credentials",
      {
        email,
        password,
        redirectTo:
          callbackUrl,
      },
    );

    return {
      error: "",
    };
  } catch (error) {
    if (
      error instanceof AuthError
    ) {
      console.error(
        "LOGIN AUTH ERROR:",
        {
          type:
            error.type,

          cause:
            error.cause,
        },
      );

      switch (error.type) {
        case "CredentialsSignin":
        case "CallbackRouteError":
          return {
            error:
              "The email or password is incorrect.",
          };

        default:
          return {
            error:
              "Unable to sign in. Please try again.",
          };
      }
    }

    /*
     * Successful Auth.js redirects are implemented
     * by throwing a Next.js redirect exception.
     * It must not be caught or converted to a form error.
     */
    throw error;
  }
}