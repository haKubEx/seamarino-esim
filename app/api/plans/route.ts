import { NextResponse } from "next/server";

import { fetchEsimAccessPlans } from "@/app/services/esimAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await fetchEsimAccessPlans();

    return NextResponse.json(plans, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("PLANS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load eSIM plans.",
      },
      {
        status: 500,
      },
    );
  }
}