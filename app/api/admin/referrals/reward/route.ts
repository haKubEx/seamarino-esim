import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  rewardReferralForCompletedOrder,
} from "@/app/services/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RewardBody = {
  orderId?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function isAuthorized(
  request: NextRequest,
) {
  const suppliedKey =
    request.headers
      .get("x-admin-key")
      ?.trim();

  const expectedKey =
    process.env.ADMIN_API_KEY?.trim();

  return Boolean(
    expectedKey &&
      suppliedKey === expectedKey,
  );
}

export async function POST(
  request: NextRequest,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      {
        status: 401,
        headers: noStoreHeaders(),
      },
    );
  }

  try {
    const body =
      (await request.json()) as RewardBody;

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        },
      );
    }

    const result =
      await rewardReferralForCompletedOrder(
        orderId,
      );

    return NextResponse.json(
      result,
      {
        status: result.success
          ? 200
          : 500,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "ADMIN REFERRAL REWARD ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        rewarded: false,
        skipped: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to process the referral reward.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      },
    );
  }
}