import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");

  if (
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL!;

  const fulfillmentSecret =
    process.env.FULFILLMENT_SECRET!;

  const headers = {
    Authorization: `Bearer ${fulfillmentSecret}`,
  };

  const sync = await fetch(
    `${baseUrl}/api/esim/sync`,
    {
      method: "POST",
      headers,
    }
  ).then((r) => r.json());

  const deliver = await fetch(
    `${baseUrl}/api/esim/deliver`,
    {
      method: "POST",
      headers,
    }
  ).then((r) => r.json());

  return NextResponse.json({
    success: true,
    sync,
    deliver,
  });
}