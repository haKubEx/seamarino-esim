import crypto from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type EsimAccessResponse = {
  success?: boolean;
  errorCode?: string;
  errorMsg?: string;
  obj?: {
    packageList?: unknown[];
  };
  packageList?: unknown[];
};

export async function GET() {
  try {
    const accessCode = process.env.ESIM_ACCESS_CODE?.trim();
    const secretKey = process.env.ESIM_SECRET_KEY?.trim();
    const baseUrl =
      process.env.ESIM_BASE_URL?.trim() ??
      "https://api.esimaccess.com";

    if (!accessCode || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing eSIM Access credentials.",
        },
        { status: 500 },
      );
    }

    const endpoint = `${baseUrl}/api/v1/open/package/list`;

    const requestBody = JSON.stringify({
      type: "BASE",
    });

    const timestamp = Date.now().toString();
    const requestId = crypto.randomUUID();

    const signData =
      timestamp +
      requestId +
      accessCode +
      requestBody;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(signData)
      .digest("hex")
      .toLowerCase();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "RT-AccessCode": accessCode,
        "RT-RequestID": requestId,
        "RT-Signature": signature,
        "RT-Timestamp": timestamp,
      },
      body: requestBody,
      cache: "no-store",
    });

    const responseText = await response.text();

    let data: EsimAccessResponse;

    try {
      data = JSON.parse(responseText) as EsimAccessResponse;
    } catch {
      console.error("Invalid eSIM Access response:", responseText);

      return NextResponse.json(
        {
          success: false,
          error: "eSIM Access returned invalid JSON.",
          status: response.status,
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      console.error("eSIM Access HTTP error:", data);

      return NextResponse.json(
        {
          success: false,
          error:
            data.errorMsg ??
            `eSIM Access request failed with HTTP ${response.status}.`,
          details: data,
        },
        { status: 502 },
      );
    }

    const packageList =
      data.obj?.packageList ??
      data.packageList ??
      [];

    if (!Array.isArray(packageList)) {
      console.error("Unexpected eSIM Access response:", data);

      return NextResponse.json(
        {
          success: false,
          error: "The API response did not contain a package list.",
          details: data,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(packageList);
  } catch (error) {
    console.error("PLANS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      { status: 500 },
    );
  }
}