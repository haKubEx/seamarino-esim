import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type EndpointResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BASE_URL
      ?.trim()
      .replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  const vercelUrl =
    process.env.VERCEL_URL
      ?.trim()
      .replace(/\/+$/, "");

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

function isAuthorized(request: Request) {
  const authorization =
    request.headers.get("authorization");

  const fulfillmentSecret =
    process.env.FULFILLMENT_SECRET?.trim();

  const cronSecret =
    process.env.CRON_SECRET?.trim();

  if (!authorization) {
    return false;
  }

  const acceptedTokens = [
    fulfillmentSecret,
    cronSecret,
  ].filter(
    (value): value is string =>
      Boolean(value),
  );

  return acceptedTokens.some(
    (secret) =>
      authorization === `Bearer ${secret}`,
  );
}

async function callProtectedEndpoint({
  url,
  fulfillmentSecret,
}: {
  url: string;
  fulfillmentSecret: string;
}): Promise<EndpointResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization:
        `Bearer ${fulfillmentSecret}`,
    },
    cache: "no-store",
  });

  const responseText =
    await response.text();

  let data: unknown;

  try {
    data = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    data = {
      rawResponse: responseText,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function runFulfillment() {
  const fulfillmentSecret =
    process.env.FULFILLMENT_SECRET?.trim();

  if (!fulfillmentSecret) {
    throw new Error(
      "FULFILLMENT_SECRET is missing from the environment.",
    );
  }

  const baseUrl = getBaseUrl();

  /*
   * First retrieve any eSIM profiles that are
   * still waiting for supplier allocation.
   */
  const syncResult =
    await callProtectedEndpoint({
      url: `${baseUrl}/api/esim/sync`,
      fulfillmentSecret,
    });

  /*
   * Then deliver every issued profile that has
   * not yet been emailed to its customer.
   */
  const deliveryResult =
    await callProtectedEndpoint({
      url: `${baseUrl}/api/esim/deliver`,
      fulfillmentSecret,
    });

  return {
    baseUrl,
    sync: syncResult,
    delivery: deliveryResult,
  };
}

async function handleFulfillmentRequest(
  request: Request,
) {
  if (!isAuthorized(request)) {
    console.error(
      "FULFILLMENT CRON: Unauthorized request.",
    );

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

  try {
    const result =
      await runFulfillment();

    const success =
      result.sync.ok &&
      result.delivery.ok;

    if (!success) {
      console.error(
        "FULFILLMENT CRON: One or more jobs failed.",
        {
          syncStatus:
            result.sync.status,
          deliveryStatus:
            result.delivery.status,
          syncData:
            result.sync.data,
          deliveryData:
            result.delivery.data,
        },
      );
    }

    return NextResponse.json(
      {
        success,

        sync: {
          status:
            result.sync.status,
          response:
            result.sync.data,
        },

        delivery: {
          status:
            result.delivery.status,
          response:
            result.delivery.data,
        },
      },
      {
        status: success ? 200 : 502,
      },
    );
  } catch (error) {
    console.error(
      "FULFILLMENT CRON ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown fulfillment error.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * Runhooks currently sends POST requests.
 */
export async function POST(
  request: Request,
) {
  return handleFulfillmentRequest(
    request,
  );
}

/*
 * Vercel Cron sends GET requests.
 * Keeping GET allows both schedulers to work.
 */
export async function GET(
  request: Request,
) {
  return handleFulfillmentRequest(
    request,
  );
}