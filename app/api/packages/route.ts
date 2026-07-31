import { NextResponse } from "next/server";
import { getPackages } from "@/app/lib/esimAccess/packages";

export async function GET() {
  try {
    const packages = await getPackages();

    return NextResponse.json(packages);
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