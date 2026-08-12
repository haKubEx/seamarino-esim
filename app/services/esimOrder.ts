import "server-only";

import crypto from "crypto";

const DEFAULT_ESIM_ACCESS_BASE_URL =
  "https://api.esimaccess.com";

const ORDER_REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_TEXT_LENGTH = 100_000;
const MAX_TRANSACTION_ID_LENGTH = 50;
const MAX_PACKAGE_CODE_LENGTH = 200;
const MIN_PERIOD_NUM = 1;
const MAX_PERIOD_NUM = 365;

type EsimAccessOrderObject = {
  orderNo?: string | null;
};

type EsimAccessOrderResponse = {
  success?: boolean | string | number;
  errorCode?: string | number | null;
  errorMessage?: string | null;
  errorMsg?: string | null;
  obj?: EsimAccessOrderObject | null;
};

export type EsimPurchaseResult = {
  orderNo: string;
  transactionId: string;
  rawResponse: EsimAccessOrderResponse;
};

type EsimAccessConfig = {
  accessCode: string;
  secretKey: string;
  baseUrl: string;
};

type CreateSignatureInput = {
  timestamp: string;
  requestId: string;
  accessCode: string;
  requestBody: string;
  secretKey: string;
};

type PurchaseEsimProfileInput = {
  packageCode: string;
  transactionId: string;

  /**
   * Number of validity days for eSIM Access
   * daily-limit/day-pass packages.
   *
   * Leave undefined for normal fixed-duration
   * packages.
   */
  periodNum?: number;
};

function getEsimAccessConfig(): EsimAccessConfig {
  const accessCode =
    process.env.ESIM_ACCESS_CODE?.trim();

  const secretKey =
    process.env.ESIM_SECRET_KEY?.trim();

  const configuredBaseUrl =
    process.env.ESIM_BASE_URL?.trim();

  const baseUrl = (
    configuredBaseUrl ||
    DEFAULT_ESIM_ACCESS_BASE_URL
  ).replace(/\/+$/, "");

  if (!accessCode) {
    throw new Error(
      "ESIM_ACCESS_CODE is missing from the environment.",
    );
  }

  if (!secretKey) {
    throw new Error(
      "ESIM_SECRET_KEY is missing from the environment.",
    );
  }

  let parsedBaseUrl: URL;

  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new Error(
      "ESIM_BASE_URL is not a valid URL.",
    );
  }

  if (
    parsedBaseUrl.protocol !== "https:" &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "ESIM_BASE_URL must use HTTPS in production.",
    );
  }

  return {
    accessCode,
    secretKey,
    baseUrl,
  };
}

function createSignature({
  timestamp,
  requestId,
  accessCode,
  requestBody,
  secretKey,
}: CreateSignatureInput): string {
  const signData =
    timestamp +
    requestId +
    accessCode +
    requestBody;

  return crypto
    .createHmac("sha256", secretKey)
    .update(signData, "utf8")
    .digest("hex")
    .toLowerCase();
}

function normalizeTransactionId(
  value: string,
): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TRANSACTION_ID_LENGTH);

  if (!normalized) {
    throw new Error(
      "A valid eSIM transaction ID could not be created.",
    );
  }

  return normalized;
}

function normalizePackageCode(
  value: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      "The eSIM package code is missing.",
    );
  }

  if (
    normalized.length >
    MAX_PACKAGE_CODE_LENGTH
  ) {
    throw new Error(
      "The eSIM package code is too long.",
    );
  }

  return normalized;
}

function normalizePeriodNum(
  value: number | undefined,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !Number.isInteger(value) ||
    value < MIN_PERIOD_NUM ||
    value > MAX_PERIOD_NUM
  ) {
    throw new Error(
      `The eSIM daily-plan period must be a whole number between ${MIN_PERIOD_NUM} and ${MAX_PERIOD_NUM} days.`,
    );
  }

  return value;
}

function responseWasSuccessful(
  success:
    | boolean
    | string
    | number
    | undefined,
): boolean {
  if (success === true || success === 1) {
    return true;
  }

  if (typeof success === "string") {
    const normalized =
      success.trim().toLowerCase();

    return (
      normalized === "true" ||
      normalized === "1"
    );
  }

  return false;
}

function stringifyApiValue(
  value: string | number | null | undefined,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
}

function getApiErrorMessage(
  response: EsimAccessOrderResponse,
): string {
  return (
    stringifyApiValue(
      response.errorMessage,
    ) ||
    stringifyApiValue(
      response.errorMsg,
    ) ||
    stringifyApiValue(
      response.errorCode,
    ) ||
    "eSIM Access rejected the order."
  );
}

function createAbortErrorMessage(): string {
  return (
    "The eSIM Access order request timed out. " +
    "The same transaction ID must be reused when retrying."
  );
}

function getFetchErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.name === "AbortError"
  ) {
    return createAbortErrorMessage();
  }

  if (error instanceof Error) {
    return (
      "The eSIM Access order request failed: " +
      error.message.slice(0, 1000)
    );
  }

  return (
    "The eSIM Access order request failed " +
    "because of an unknown network error."
  );
}

function parseOrderResponse({
  responseText,
  httpStatus,
}: {
  responseText: string;
  httpStatus: number;
}): EsimAccessOrderResponse {
  if (!responseText.trim()) {
    throw new Error(
      `eSIM Access returned an empty response with HTTP ${httpStatus}.`,
    );
  }

  if (
    responseText.length >
    MAX_RESPONSE_TEXT_LENGTH
  ) {
    throw new Error(
      "eSIM Access returned an unexpectedly large order response.",
    );
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(responseText);
  } catch {
    console.error(
      "ESIM ACCESS: Invalid order JSON response",
      {
        httpStatus,
        responsePreview:
          responseText.slice(0, 2000),
      },
    );

    throw new Error(
      `eSIM Access returned invalid JSON with HTTP ${httpStatus}.`,
    );
  }

  if (
    typeof parsedValue !== "object" ||
    parsedValue === null ||
    Array.isArray(parsedValue)
  ) {
    throw new Error(
      "eSIM Access returned an invalid order response structure.",
    );
  }

  return parsedValue as EsimAccessOrderResponse;
}

export async function purchaseEsimProfile({
  packageCode,
  transactionId,
  periodNum,
}: PurchaseEsimProfileInput): Promise<EsimPurchaseResult> {
  const normalizedPackageCode =
    normalizePackageCode(packageCode);

  const normalizedPeriodNum =
    normalizePeriodNum(periodNum);

  /*
   * This value must remain stable for every retry
   * of the same customer order.
   *
   * eSIM Access uses transactionId to recognize
   * duplicate order requests.
   */
  const safeTransactionId =
    normalizeTransactionId(transactionId);

  const {
    accessCode,
    secretKey,
    baseUrl,
  } = getEsimAccessConfig();

  const endpoint =
    `${baseUrl}/api/v1/open/esim/order`;

  /*
   * Price and amount are optional in the
   * eSIM Access order API.
   *
   * packageCode + count lets the supplier
   * use the current wholesale package price.
   *
   * Daily-limit/day-pass packages may also
   * include periodNum. count must remain 1
   * because it represents the package/profile
   * quantity, not the selected number of days.
   */
  const requestBody = JSON.stringify({
    transactionId: safeTransactionId,

    packageInfoList: [
      {
        packageCode:
          normalizedPackageCode,

        count: 1,

        ...(normalizedPeriodNum !==
        undefined
          ? {
              periodNum:
                normalizedPeriodNum,
            }
          : {}),
      },
    ],
  });

  const timestamp = Date.now().toString();
  const requestId = crypto.randomUUID();

  const signature = createSignature({
    timestamp,
    requestId,
    accessCode,
    requestBody,
    secretKey,
  });

  const abortController =
    new AbortController();

  const timeout = setTimeout(() => {
    abortController.abort();
  }, ORDER_REQUEST_TIMEOUT_MS);

  console.info(
    "ESIM ACCESS: Creating profile order",
    {
      transactionId:
        safeTransactionId,

      packageCode:
        normalizedPackageCode,

      periodNum:
        normalizedPeriodNum ?? null,

      requestId,
    },
  );

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",

      headers: {
        Accept: "application/json",

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

      body: requestBody,

      cache: "no-store",

      signal:
        abortController.signal,
    });
  } catch (error) {
    const message =
      getFetchErrorMessage(error);

    console.error(
      "ESIM ACCESS: Order network failure",
      {
        transactionId:
          safeTransactionId,

        packageCode:
          normalizedPackageCode,

        periodNum:
          normalizedPeriodNum ?? null,

        requestId,

        error: message,
      },
    );

    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }

  const responseText =
    await response.text();

  const responseData =
    parseOrderResponse({
      responseText,
      httpStatus: response.status,
    });

  if (!response.ok) {
    const apiError =
      getApiErrorMessage(responseData);

    console.error(
      "ESIM ACCESS: Order HTTP error",
      {
        httpStatus:
          response.status,

        transactionId:
          safeTransactionId,

        packageCode:
          normalizedPackageCode,

        periodNum:
          normalizedPeriodNum ?? null,

        requestId,

        errorCode:
          responseData.errorCode,

        errorMessage:
          responseData.errorMessage ??
          responseData.errorMsg,
      },
    );

    throw new Error(
      `eSIM Access order failed with HTTP ${response.status}: ${apiError}`,
    );
  }

  if (
    !responseWasSuccessful(
      responseData.success,
    )
  ) {
    const apiError =
      getApiErrorMessage(responseData);

    console.error(
      "ESIM ACCESS: Order rejected",
      {
        transactionId:
          safeTransactionId,

        packageCode:
          normalizedPackageCode,

        periodNum:
          normalizedPeriodNum ?? null,

        requestId,

        errorCode:
          responseData.errorCode,

        errorMessage:
          responseData.errorMessage ??
          responseData.errorMsg,
      },
    );

    throw new Error(apiError);
  }

  const orderNo =
    responseData.obj?.orderNo?.trim();

  if (!orderNo) {
    console.error(
      "ESIM ACCESS: Successful order response missing order number",
      {
        transactionId:
          safeTransactionId,

        packageCode:
          normalizedPackageCode,

        periodNum:
          normalizedPeriodNum ?? null,

        requestId,

        success:
          responseData.success,

        errorCode:
          responseData.errorCode,
      },
    );

    throw new Error(
      "eSIM Access accepted the order request but did not return an order number.",
    );
  }

  console.info(
    "ESIM ACCESS: Profile order created",
    {
      orderNo,

      transactionId:
        safeTransactionId,

      packageCode:
        normalizedPackageCode,

      requestId,
    },
  );

  return {
    orderNo,

    transactionId:
      safeTransactionId,

    rawResponse:
      responseData,
  };
}