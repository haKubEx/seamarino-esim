import { NextResponse } from "next/server";
import { getBalance } from "@/app/lib/esimAccess/balance";

export async function GET() {
  try {
    const balance = await getBalance();

    return NextResponse.json(balance);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}