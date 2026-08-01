import { NextResponse } from "next/server";

import {
  getAppSettings,
  updateUsdToPhpRate,
} from "@/app/services/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.ADMIN_API_KEY?.trim();

  if (!configuredKey) {
    console.error(
      "ADMIN_API_KEY is missing from the environment.",
    );

    return false;
  }

  const suppliedKey =
    request.headers.get("x-admin-key")?.trim();

  return suppliedKey === configuredKey;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const settings = await getAppSettings();

    return NextResponse.json({
      success: true,
      usdToPhpRate: settings.usdToPhpRate,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error(
      "ADMIN SETTINGS GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load the exchange-rate setting.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("usdToPhpRate" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The USD-to-PHP rate is required.",
        },
        {
          status: 400,
        },
      );
    }

    const rate = Number(
      (
        body as {
          usdToPhpRate: unknown;
        }
      ).usdToPhpRate,
    );

    if (
      !Number.isFinite(rate) ||
      rate <= 0 ||
      rate > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a valid USD-to-PHP exchange rate.",
        },
        {
          status: 400,
        },
      );
    }

    const settings =
      await updateUsdToPhpRate(rate);

    return NextResponse.json({
      success: true,
      message:
        "The exchange rate was updated successfully.",
      usdToPhpRate: settings.usdToPhpRate,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error(
      "ADMIN SETTINGS UPDATE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update the exchange rate.",
      },
      {
        status: 500,
      },
    );
  }
}