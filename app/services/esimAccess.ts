import "server-only";

import crypto from "crypto";

import type { EsimPackage } from "@/app/types/esim";

type EsimAccessPackageListResponse = {
  success?: boolean;
  errorCode?: string;
  errorMsg?: string;

  obj?: {
    packageList?: unknown[];
  };

  packageList?: unknown[];
};

type EsimAccessConfig = {
  accessCode: string;
  secretKey: string;
  baseUrl: string;
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
};

function getPositiveInteger(
  value: string | undefined,
  fallback: number,
) {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    return fallback;
  }

  return parsedValue;
}

function getNonNegativeInteger(
  value: string | undefined,
  fallback: number,
) {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 0
  ) {
    return fallback;
  }

  return parsedValue;
}

function getEsimAccessConfig(): EsimAccessConfig {
  const accessCode =
    process.env.ESIM_ACCESS_CODE?.trim();

  const secretKey =
    process.env.ESIM_SECRET_KEY?.trim();

  const baseUrl = (
    process.env.ESIM_BASE_URL?.trim() ||
    "https://api.esimaccess.com"
  ).replace(/\/+$/, "");

  const timeoutMs =
    getPositiveInteger(
      process.env.ESIM_ACCESS_TIMEOUT_MS,
      45_000,
    );

  const retryCount =
    getNonNegativeInteger(
      process.env.ESIM_ACCESS_RETRY_COUNT,
      2,
    );

  const retryDelayMs =
    getPositiveInteger(
      process.env.ESIM_ACCESS_RETRY_DELAY_MS,
      1_500,
    );

  if (!accessCode) {
    throw new Error(
      "ESIM_ACCESS_CODE is missing from the server environment.",
    );
  }

  if (!secretKey) {
    throw new Error(
      "ESIM_SECRET_KEY is missing from the server environment.",
    );
  }

  return {
    accessCode,
    secretKey,
    baseUrl,
    timeoutMs,
    retryCount,
    retryDelayMs,
  };
}

function createSignature({
  timestamp,
  requestId,
  accessCode,
  requestBody,
  secretKey,
}: {
  timestamp: string;
  requestId: string;
  accessCode: string;
  requestBody: string;
  secretKey: string;
}) {
  const signData =
    timestamp +
    requestId +
    accessCode +
    requestBody;

  return crypto
    .createHmac(
      "sha256",
      secretKey,
    )
    .update(signData)
    .digest("hex")
    .toLowerCase();
}

async function parseJsonResponse(
  response: Response,
): Promise<EsimAccessPackageListResponse> {
  const responseText =
    await response.text();

  try {
    return JSON.parse(
      responseText,
    ) as EsimAccessPackageListResponse;
  } catch {
    console.error(
      "ESIM ACCESS INVALID JSON RESPONSE:",
      {
        status: response.status,
        responseText:
          responseText.slice(
            0,
            2000,
          ),
      },
    );

    throw new Error(
      `eSIM Access returned invalid JSON with HTTP ${response.status}.`,
    );
  }
}

function getRequestErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.name === "AbortError"
  ) {
    return "The eSIM Access request timed out.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to connect to eSIM Access.";
}

function isRetryableError(
  error: unknown,
) {
  if (!(error instanceof Error)) {
    return true;
  }

  if (
    error.name === "AbortError"
  ) {
    return true;
  }

  const message =
    error.message.toLowerCase();

  return (
    message.includes("timed out") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("socket") ||
    message.includes("connection") ||
    message.includes("econnreset") ||
    message.includes("etimedout")
  );
}

function wait(
  milliseconds: number,
) {
  return new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

async function requestPackageList({
  accessCode,
  secretKey,
  baseUrl,
  timeoutMs,
  attempt,
}: {
  accessCode: string;
  secretKey: string;
  baseUrl: string;
  timeoutMs: number;
  attempt: number;
}): Promise<EsimPackage[]> {
  const endpoint =
    `${baseUrl}/api/v1/open/package/list`;

  const requestBody =
    JSON.stringify({
      type: "BASE",
    });

  const timestamp =
    Date.now().toString();

  const requestId =
    crypto.randomUUID();

  const signature =
    createSignature({
      timestamp,
      requestId,
      accessCode,
      requestBody,
      secretKey,
    });

  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  try {
    console.info(
      "ESIM ACCESS: Fetching package list",
      {
        endpoint,
        requestId,
        attempt,
        timeoutMs,
      },
    );

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            "RT-AccessCode":
              accessCode,

            "RT-RequestID":
              requestId,

            "RT-Signature":
              signature,

            "RT-Timestamp":
              timestamp,
          },

          body:
            requestBody,

          cache:
            "no-store",

          signal:
            controller.signal,
        },
      );

    const data =
      await parseJsonResponse(
        response,
      );

    if (!response.ok) {
      console.error(
        "ESIM ACCESS HTTP ERROR:",
        {
          status:
            response.status,

          requestId,

          response:
            data,
        },
      );

      throw new Error(
        data.errorMsg ||
          `eSIM Access request failed with HTTP ${response.status}.`,
      );
    }

    if (data.success === false) {
      console.error(
        "ESIM ACCESS API ERROR:",
        {
          requestId,
          response:
            data,
        },
      );

      throw new Error(
        data.errorMsg ||
          data.errorCode ||
          "eSIM Access returned an unsuccessful response.",
      );
    }

    const packageList =
      data.obj?.packageList ??
      data.packageList ??
      [];

    if (
      !Array.isArray(
        packageList,
      )
    ) {
      console.error(
        "ESIM ACCESS INVALID PACKAGE LIST:",
        {
          requestId,
          response:
            data,
        },
      );

      throw new Error(
        "The eSIM Access response did not contain a valid package list.",
      );
    }

    console.info(
      "ESIM ACCESS: Package list received",
      {
        packageCount:
          packageList.length,

        requestId,

        attempt,
      },
    );

    return packageList as EsimPackage[];
  } finally {
    clearTimeout(
      timeout,
    );
  }
}

export async function fetchEsimAccessPlans(): Promise<
  EsimPackage[]
> {
  const {
    accessCode,
    secretKey,
    baseUrl,
    timeoutMs,
    retryCount,
    retryDelayMs,
  } = getEsimAccessConfig();

  const maximumAttempts =
    retryCount + 1;

  let lastError:
    | unknown = null;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      return await requestPackageList({
        accessCode,
        secretKey,
        baseUrl,
        timeoutMs,
        attempt,
      });
    } catch (error) {
      lastError =
        error;

      const message =
        getRequestErrorMessage(
          error,
        );

      const retryable =
        isRetryableError(
          error,
        );

      console.error(
        "ESIM ACCESS PACKAGE LIST ATTEMPT FAILED:",
        {
          attempt,
          maximumAttempts,
          retryable,
          error:
            message,
        },
      );

      if (
        !retryable ||
        attempt >=
          maximumAttempts
      ) {
        break;
      }

      const delay =
        retryDelayMs *
        attempt;

      console.info(
        "ESIM ACCESS: Retrying package list",
        {
          nextAttempt:
            attempt + 1,

          delayMs:
            delay,
        },
      );

      await wait(
        delay,
      );
    }
  }

  throw new Error(
    getRequestErrorMessage(
      lastError,
    ),
  );
}