import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(
      "PayMongo webhook received:",
      JSON.stringify(body, null, 2),
    );

    return NextResponse.json(
      {
        received: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PayMongo webhook error:", error);

    return NextResponse.json(
      {
        error: "Invalid webhook request.",
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayMongo webhook endpoint is active.",
  });
}