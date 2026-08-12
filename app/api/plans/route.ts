import { NextResponse } from "next/server";

import { getPlans } from "@/app/services/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const MAX_ERROR_MESSAGE_LENGTH = 1_500;

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      MAX_ERROR_MESSAGE_LENGTH,
    );
  }

  return "Unable to load eSIM plans.";
}

export async function GET() {
  try {
    /*
     * Always use the centralized plans service.
     *
     * It handles:
     * - supplier normalization
     * - PlanSetting overrides
     * - enabled/featured flags
     * - markup calculation
     * - USD selling price
     * - PHP selling price
     * - PayMongo centavo amount
     * - process-level supplier caching
     */
    const plans =
      await getPlans();

    return NextResponse.json(
      plans,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      },
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "PUBLIC PLANS API ERROR:",
      {
        error: message,
      },
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}