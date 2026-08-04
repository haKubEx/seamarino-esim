import {
  randomUUID,
  timingSafeEqual,
} from "crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ENDPOINT_TIMEOUT_MS = 25_000;
const MAX_RESPONSE_TEXT_LENGTH = 100_000;

type EndpointName =
  | "sync"
  | "delivery";

type EndpointResult = {
  name: EndpointName;
  ok: boolean;
  status: number;
  durationMs: number;
  timedOut: boolean;
  data: unknown;
};

type FulfillmentResult = {
  requestId: string;
  baseUrl: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  sync: EndpointResult;
  delivery: EndpointResult;
};

function normalizeBaseUrl(
  value: string,
): string {
  return value
    .trim()
    .replace(/\/+$/, "");
}

function validateBaseUrl(
  value: string,
): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      "The fulfillment base URL is invalid.",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "The fulfillment base URL must use HTTPS in production.",
    );
  }

  return parsedUrl
    .toString()
    .replace(/\/+$/, "");
}

function getBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredUrl) {
    return validateBaseUrl(
      normalizeBaseUrl(
        configuredUrl,
      ),
    );
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    const normalizedVercelUrl =
      normalizeBaseUrl(
        vercelUrl,
      );

    const fullVercelUrl =
      normalizedVercelUrl.startsWith(
        "http://",
      ) ||
      normalizedVercelUrl.startsWith(
        "https://",
      )
        ? normalizedVercelUrl
        : `https://${normalizedVercelUrl}`;

    return validateBaseUrl(
      fullVercelUrl,
    );
  }

  if (
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "NEXT_PUBLIC_BASE_URL or VERCEL_URL is required in production.",
    );
  }

  return "http://localhost:3000";
}

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers
      .get("authorization")
      ?.trim();

  if (!authorization) {
    return null;
  }

  const match =
    /^Bearer\s+(.+)$/i.exec(
      authorization,
    );

  const token =
    match?.[1]?.trim();

  return token || null;
}

function secureCompare(
  left: string,
  right: string,
): boolean {
  const leftBuffer =
    Buffer.from(left, "utf8");

  const rightBuffer =
    Buffer.from(right, "utf8");

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}

function getAcceptedSecrets(): string[] {
  const secrets = [
    process.env
      .FULFILLMENT_SECRET,
    process.env.CRON_SECRET,
  ]
    .map((value) =>
      value?.trim(),
    )
    .filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    );

  return [...new Set(secrets)];
}

function isAuthorized(
  request: Request,
): boolean {
  const token =
    getBearerToken(request);

  if (!token) {
    return false;
  }

  const acceptedSecrets =
    getAcceptedSecrets();

  if (
    acceptedSecrets.length === 0
  ) {
    console.error(
      "FULFILLMENT CRON: No authorization secret is configured.",
    );

    return false;
  }

  return acceptedSecrets.some(
    (secret) =>
      secureCompare(
        token,
        secret,
      ),
  );
}

function getFulfillmentSecret():
  string {
  const fulfillmentSecret =
    process.env
      .FULFILLMENT_SECRET
      ?.trim();

  if (!fulfillmentSecret) {
    throw new Error(
      "FULFILLMENT_SECRET is missing from the environment.",
    );
  }

  return fulfillmentSecret;
}

function parseEndpointResponse({
  responseText,
  endpointName,
}: {
  responseText: string;
  endpointName: EndpointName;
}): unknown {
  if (!responseText) {
    return null;
  }

  if (
    responseText.length >
    MAX_RESPONSE_TEXT_LENGTH
  ) {
    return {
      error:
        `${endpointName} returned an unexpectedly large response.`,
    };
  }

  try {
    return JSON.parse(
      responseText,
    ) as unknown;
  } catch {
    return {
      rawResponse:
        responseText.slice(
          0,
          5_000,
        ),
    };
  }
}

function getEndpointErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.name === "AbortError"
  ) {
    return (
      "The fulfillment endpoint request timed out."
    );
  }

  if (error instanceof Error) {
    return error.message.slice(
      0,
      1_500,
    );
  }

  return (
    "An unknown fulfillment endpoint error occurred."
  );
}

async function callProtectedEndpoint({
  name,
  url,
  fulfillmentSecret,
  requestId,
}: {
  name: EndpointName;
  url: string;
  fulfillmentSecret: string;
  requestId: string;
}): Promise<EndpointResult> {
  const startedAt =
    Date.now();

  const abortController =
    new AbortController();

  const timeout = setTimeout(
    () => {
      abortController.abort();
    },
    ENDPOINT_TIMEOUT_MS,
  );

  try {
    const response =
      await fetch(url, {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${fulfillmentSecret}`,

          "X-Fulfillment-Request-Id":
            requestId,
        },

        cache: "no-store",

        signal:
          abortController.signal,
      });

    const responseText =
      await response.text();

    const data =
      parseEndpointResponse({
        responseText,
        endpointName: name,
      });

    return {
      name,
      ok: response.ok,
      status: response.status,
      durationMs:
        Date.now() -
        startedAt,
      timedOut: false,
      data,
    };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      error.name ===
        "AbortError";

    const errorMessage =
      getEndpointErrorMessage(
        error,
      );

    console.error(
      `FULFILLMENT CRON: ${name} endpoint failed.`,
      {
        requestId,
        url,
        timedOut,
        error:
          errorMessage,
      },
    );

    return {
      name,
      ok: false,
      status: timedOut
        ? 504
        : 502,
      durationMs:
        Date.now() -
        startedAt,
      timedOut,
      data: {
        success: false,
        error:
          errorMessage,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runFulfillment():
  Promise<FulfillmentResult> {
  const startedAtDate =
    new Date();

  const startedAt =
    startedAtDate.getTime();

  const requestId =
    randomUUID();

  const fulfillmentSecret =
    getFulfillmentSecret();

  const baseUrl =
    getBaseUrl();

  console.info(
    "FULFILLMENT CRON: Run started.",
    {
      requestId,
      baseUrl,
      startedAt:
        startedAtDate.toISOString(),
    },
  );

  /*
   * Run sync first so newly allocated
   * supplier profiles are saved before
   * the delivery phase begins.
   */
  const syncResult =
    await callProtectedEndpoint({
      name: "sync",

      url:
        `${baseUrl}/api/esim/sync`,

      fulfillmentSecret,
      requestId,
    });

  /*
   * Always run delivery even when sync
   * fails. Orders synchronized during an
   * earlier run may still be waiting for
   * final delivery or email dispatch.
   */
  const deliveryResult =
    await callProtectedEndpoint({
      name: "delivery",

      url:
        `${baseUrl}/api/esim/deliver`,

      fulfillmentSecret,
      requestId,
    });

  const finishedAtDate =
    new Date();

  const result: FulfillmentResult = {
    requestId,
    baseUrl,

    startedAt:
      startedAtDate.toISOString(),

    finishedAt:
      finishedAtDate.toISOString(),

    durationMs:
      finishedAtDate.getTime() -
      startedAt,

    sync:
      syncResult,

    delivery:
      deliveryResult,
  };

  console.info(
    "FULFILLMENT CRON: Run completed.",
    {
      requestId,

      durationMs:
        result.durationMs,

      syncOk:
        syncResult.ok,

      syncStatus:
        syncResult.status,

      syncDurationMs:
        syncResult.durationMs,

      deliveryOk:
        deliveryResult.ok,

      deliveryStatus:
        deliveryResult.status,

      deliveryDurationMs:
        deliveryResult.durationMs,
    },
  );

  return result;
}

function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized.",
    },
    {
      status: 401,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}

async function handleFulfillmentRequest(
  request: Request,
) {
  if (!isAuthorized(request)) {
    console.error(
      "FULFILLMENT CRON: Unauthorized request.",
      {
        method:
          request.method,

        userAgent:
          request.headers.get(
            "user-agent",
          ),
      },
    );

    return createUnauthorizedResponse();
  }

  try {
    const result =
      await runFulfillment();

    const allSucceeded =
      result.sync.ok &&
      result.delivery.ok;

    const partiallySucceeded =
      result.sync.ok ||
      result.delivery.ok;

    if (!allSucceeded) {
      console.error(
        "FULFILLMENT CRON: One or more phases failed.",
        {
          requestId:
            result.requestId,

          syncStatus:
            result.sync.status,

          syncData:
            result.sync.data,

          deliveryStatus:
            result.delivery.status,

          deliveryData:
            result.delivery.data,
        },
      );
    }

    return NextResponse.json(
      {
        success:
          allSucceeded,

        partialSuccess:
          !allSucceeded &&
          partiallySucceeded,

        requestId:
          result.requestId,

        startedAt:
          result.startedAt,

        finishedAt:
          result.finishedAt,

        durationMs:
          result.durationMs,

        sync: {
          success:
            result.sync.ok,

          status:
            result.sync.status,

          durationMs:
            result.sync
              .durationMs,

          timedOut:
            result.sync
              .timedOut,

          response:
            result.sync.data,
        },

        delivery: {
          success:
            result.delivery.ok,

          status:
            result.delivery
              .status,

          durationMs:
            result.delivery
              .durationMs,

          timedOut:
            result.delivery
              .timedOut,

          response:
            result.delivery
              .data,
        },
      },
      {
        status:
          allSucceeded
            ? 200
            : partiallySucceeded
              ? 207
              : 502,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message.slice(
            0,
            1_500,
          )
        : "Unknown fulfillment error.";

    console.error(
      "FULFILLMENT CRON ERROR:",
      {
        error:
          errorMessage,
      },
    );

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage,
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

export async function POST(
  request: Request,
) {
  return handleFulfillmentRequest(
    request,
  );
}

export async function GET(
  request: Request,
) {
  return handleFulfillmentRequest(
    request,
  );
}