import "server-only";

import crypto from "crypto";

const DEFAULT_ESIM_ACCESS_BASE_URL =
  "https://api.esimaccess.com";

const QUERY_REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_TEXT_LENGTH = 250_000;
const MAX_ORDER_NUMBER_LENGTH = 200;

const PROFILE_PENDING_ERROR_CODES =
  new Set(["200010"]);

const RETRYABLE_API_ERROR_CODES =
  new Set([
    "000001",
    "900001",
  ]);

const PENDING_ESIM_STATUSES =
  new Set([
    "CREATE",
    "PAYING",
    "PAID",
    "GETTING_RESOURCE",
  ]);

const ALLOCATED_ESIM_STATUSES =
  new Set([
    "GOT_RESOURCE",
    "IN_USE",
  ]);

const TERMINAL_ESIM_STATUSES =
  new Set([
    "USED_UP",
    "UNUSED_EXPIRED",
    "USED_EXPIRED",
    "CANCEL",
    "CANCELED",
    "CANCELLED",
    "REVOKE",
    "REVOKED",
  ]);

const AVAILABLE_SMDP_STATUSES =
  new Set([
    "RELEASED",
    "DOWNLOAD",
    "DOWNLOADED",
    "INSTALLATION",
    "INSTALLED",
    "ENABLED",
    "DISABLED",
  ]);

const TERMINAL_SMDP_STATUSES =
  new Set([
    "DELETED",
    "REVOKED",
  ]);

export type EsimPackageProfile = {
  packageCode?: string | null;
  duration?: number | null;
  volume?: number | null;
  locationCode?: string | null;
};

export type EsimProfile = {
  esimTranNo?: string | null;
  orderNo?: string | null;

  imsi?: string | null;
  iccid?: string | null;
  msisdn?: string | null;

  ac?: string | null;
  qrCodeUrl?: string | null;

  smdpStatus?: string | null;
  esimStatus?: string | null;

  eid?: string | null;
  activeType?: string | number | null;
  expiredTime?: string | null;

  totalVolume?: number | null;
  totalDuration?: number | null;
  durationUnit?: string | null;
  orderUsage?: number | null;

  pin?: string | null;
  puk?: string | null;
  apn?: string | null;

  smsStatus?: number | null;
  dataType?: number | null;

  packageList?:
    | EsimPackageProfile[]
    | null;
};

type EsimQueryPager = {
  pageSize?: number | null;
  pageNum?: number | null;
  total?: number | null;
};

export type EsimQueryApiResponse = {
  success?:
    | boolean
    | string
    | number;

  errorCode?:
    | string
    | number
    | null;

  errorMessage?: string | null;
  errorMsg?: string | null;

  obj?: {
    esimList?:
      | EsimProfile[]
      | null;

    pager?:
      | EsimQueryPager
      | null;
  } | null;
};

export type EsimQueryResult = {
  ready: boolean;
  pending: boolean;
  terminal: boolean;
  retryable: boolean;

  profiles: EsimProfile[];
  primaryProfile: EsimProfile | null;

  errorCode: string | null;
  statusMessage: string | null;

  rawResponse: EsimQueryApiResponse;
};

type EsimAccessConfiguration = {
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

function getEsimAccessConfiguration():
  EsimAccessConfiguration {
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
    process.env.NODE_ENV === "production" &&
    parsedBaseUrl.protocol !== "https:"
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

function normalizeOrderNumber(
  orderNo: string,
): string {
  const normalized =
    orderNo.trim();

  if (!normalized) {
    throw new Error(
      "The eSIM Access order number is missing.",
    );
  }

  if (
    normalized.length >
    MAX_ORDER_NUMBER_LENGTH
  ) {
    throw new Error(
      "The eSIM Access order number is too long.",
    );
  }

  return normalized;
}

function normalizeString(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeStatus(
  value: string | null | undefined,
): string | null {
  const normalized =
    normalizeString(value);

  return normalized
    ? normalized.toUpperCase()
    : null;
}

function normalizeErrorCode(
  value:
    | string
    | number
    | null
    | undefined,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  if (
    !normalized ||
    normalized === "0"
  ) {
    return null;
  }

  return normalized;
}

function responseWasSuccessful(
  success:
    | boolean
    | string
    | number
    | undefined,
): boolean {
  if (
    success === true ||
    success === 1
  ) {
    return true;
  }

  if (
    typeof success === "string"
  ) {
    const normalized =
      success.trim().toLowerCase();

    return (
      normalized === "true" ||
      normalized === "1"
    );
  }

  return false;
}

function getApiErrorMessage(
  response: EsimQueryApiResponse,
): string {
  return (
    normalizeString(
      response.errorMessage,
    ) ||
    normalizeString(
      response.errorMsg,
    ) ||
    normalizeErrorCode(
      response.errorCode,
    ) ||
    "eSIM Access could not query the profile."
  );
}

function hasInstallationData(
  profile: EsimProfile,
): boolean {
  return Boolean(
    normalizeString(profile.iccid) &&
    normalizeString(profile.ac) &&
    normalizeString(
      profile.qrCodeUrl,
    ),
  );
}

function profileIsTerminal(
  profile: EsimProfile,
): boolean {
  const esimStatus =
    normalizeStatus(
      profile.esimStatus,
    );

  const smdpStatus =
    normalizeStatus(
      profile.smdpStatus,
    );

  return Boolean(
    (
      esimStatus &&
      TERMINAL_ESIM_STATUSES.has(
        esimStatus,
      )
    ) ||
    (
      smdpStatus &&
      TERMINAL_SMDP_STATUSES.has(
        smdpStatus,
      )
    ),
  );
}

function profileIsPending(
  profile: EsimProfile,
): boolean {
  if (profileIsTerminal(profile)) {
    return false;
  }

  const esimStatus =
    normalizeStatus(
      profile.esimStatus,
    );

  if (
    esimStatus &&
    PENDING_ESIM_STATUSES.has(
      esimStatus,
    )
  ) {
    return true;
  }

  return !hasInstallationData(
    profile,
  );
}

function profileIsReady(
  profile: EsimProfile,
): boolean {
  /*
   * Never deliver a profile that is explicitly
   * cancelled, expired, deleted, or revoked.
   */
  if (profileIsTerminal(profile)) {
    return false;
  }

  /*
   * ICCID, activation code, and QR-code URL are
   * the minimum installation details required by
   * the delivery route.
   */
  if (!hasInstallationData(profile)) {
    return false;
  }

  const esimStatus =
    normalizeStatus(
      profile.esimStatus,
    );

  const smdpStatus =
    normalizeStatus(
      profile.smdpStatus,
    );

  const hasAllocatedEsimStatus =
    esimStatus !== null &&
    ALLOCATED_ESIM_STATUSES.has(
      esimStatus,
    );

  const hasAvailableSmdpStatus =
    smdpStatus !== null &&
    AVAILABLE_SMDP_STATUSES.has(
      smdpStatus,
    );

  if (
    hasAllocatedEsimStatus ||
    hasAvailableSmdpStatus
  ) {
    return true;
  }

  /*
   * Keep waiting when the supplier explicitly says
   * the eSIM is still being created or allocated.
   */
  if (
    esimStatus !== null &&
    PENDING_ESIM_STATUSES.has(
      esimStatus,
    )
  ) {
    return false;
  }

  /*
   * eSIM Access may introduce a new non-terminal
   * status before this application is updated. If
   * complete installation credentials are already
   * present, treat the profile as deliverable rather
   * than leaving a paid order stuck indefinitely.
   */
  return true;
}

function getProfileScore(
  profile: EsimProfile,
): number {
  let score = 0;

  if (profileIsReady(profile)) {
    score += 1_000;
  }

  if (
    hasInstallationData(profile)
  ) {
    score += 500;
  }

  if (
    normalizeString(
      profile.esimTranNo,
    )
  ) {
    score += 100;
  }

  if (
    normalizeString(profile.iccid)
  ) {
    score += 100;
  }

  if (
    normalizeString(profile.ac)
  ) {
    score += 100;
  }

  if (
    normalizeString(
      profile.qrCodeUrl,
    )
  ) {
    score += 100;
  }

  if (
    normalizeString(profile.apn)
  ) {
    score += 10;
  }

  if (
    profileIsTerminal(profile)
  ) {
    score -= 2_000;
  }

  return score;
}

function selectPrimaryProfile(
  profiles: EsimProfile[],
): EsimProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  return [...profiles].sort(
    (left, right) =>
      getProfileScore(right) -
      getProfileScore(left),
  )[0] ?? null;
}

function validateProfiles(
  value: unknown,
): EsimProfile[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(
      "eSIM Access returned an invalid profile list.",
    );
  }

  return value.filter(
    (
      item,
    ): item is EsimProfile =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item),
  );
}

function parseQueryResponse({
  responseText,
  httpStatus,
  orderNo,
}: {
  responseText: string;
  httpStatus: number;
  orderNo: string;
}): EsimQueryApiResponse {
  if (!responseText.trim()) {
    throw new Error(
      `eSIM Access returned an empty query response with HTTP ${httpStatus}.`,
    );
  }

  if (
    responseText.length >
    MAX_RESPONSE_TEXT_LENGTH
  ) {
    throw new Error(
      "eSIM Access returned an unexpectedly large profile-query response.",
    );
  }

  let parsedValue: unknown;

  try {
    parsedValue =
      JSON.parse(responseText);
  } catch {
    console.error(
      "ESIM ACCESS: Invalid query JSON response",
      {
        httpStatus,
        orderNo,
        responsePreview:
          responseText.slice(
            0,
            2_000,
          ),
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
      "eSIM Access returned an invalid profile-query response structure.",
    );
  }

  return (
    parsedValue as
      EsimQueryApiResponse
  );
}

function createPendingResult({
  responseData,
  errorCode,
  statusMessage,
}: {
  responseData:
    EsimQueryApiResponse;
  errorCode: string | null;
  statusMessage: string | null;
}): EsimQueryResult {
  return {
    ready: false,
    pending: true,
    terminal: false,
    retryable: true,

    profiles: [],
    primaryProfile: null,

    errorCode,
    statusMessage,

    rawResponse: responseData,
  };
}

function getFetchErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.name === "AbortError"
  ) {
    return (
      "The eSIM Access profile query timed out."
    );
  }

  if (error instanceof Error) {
    return (
      "The eSIM Access profile query failed: " +
      error.message.slice(
        0,
        1_000,
      )
    );
  }

  return (
    "The eSIM Access profile query failed " +
    "because of an unknown network error."
  );
}

export async function queryEsimProfiles(
  orderNo: string,
): Promise<EsimQueryResult> {
  const normalizedOrderNo =
    normalizeOrderNumber(orderNo);

  const {
    accessCode,
    secretKey,
    baseUrl,
  } = getEsimAccessConfiguration();

  const endpoint =
    `${baseUrl}/api/v1/open/esim/query`;

  const requestBody =
    JSON.stringify({
      orderNo:
        normalizedOrderNo,

      iccid: "",

      pager: {
        pageNum: 1,
        pageSize: 50,
      },
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

  const abortController =
    new AbortController();

  const timeout = setTimeout(
    () => {
      abortController.abort();
    },
    QUERY_REQUEST_TIMEOUT_MS,
  );

  console.info(
    "ESIM ACCESS: Querying allocated profiles",
    {
      orderNo:
        normalizedOrderNo,
      requestId,
    },
  );

  let response: Response;

  try {
    response = await fetch(
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

        body: requestBody,

        cache: "no-store",

        signal:
          abortController.signal,
      },
    );
  } catch (error) {
    const message =
      getFetchErrorMessage(
        error,
      );

    console.error(
      "ESIM ACCESS: Profile query network failure",
      {
        orderNo:
          normalizedOrderNo,
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
    parseQueryResponse({
      responseText,
      httpStatus:
        response.status,
      orderNo:
        normalizedOrderNo,
    });

  const errorCode =
    normalizeErrorCode(
      responseData.errorCode,
    );

  const statusMessage =
    normalizeString(
      responseData.errorMessage,
    ) ||
    normalizeString(
      responseData.errorMsg,
    );

  /*
   * 200010 is not a fulfillment failure.
   *
   * The order exists, but the SM-DP+
   * server is still allocating the profile.
   */
  if (
    errorCode &&
    PROFILE_PENDING_ERROR_CODES.has(
      errorCode,
    )
  ) {
    console.info(
      "ESIM ACCESS: Profile allocation is still pending",
      {
        orderNo:
          normalizedOrderNo,
        requestId,
        errorCode,
      },
    );

    return createPendingResult({
      responseData,
      errorCode,
      statusMessage:
        statusMessage ||
        "The eSIM profile is still being allocated.",
    });
  }

  /*
   * Supplier server-busy responses are
   * temporary and should be retried by cron.
   */
  if (
    errorCode &&
    RETRYABLE_API_ERROR_CODES.has(
      errorCode,
    )
  ) {
    console.warn(
      "ESIM ACCESS: Temporary query error",
      {
        orderNo:
          normalizedOrderNo,
        requestId,
        errorCode,
        statusMessage,
      },
    );

    return createPendingResult({
      responseData,
      errorCode,
      statusMessage:
        statusMessage ||
        "The supplier is temporarily unavailable.",
    });
  }

  if (!response.ok) {
    const apiError =
      getApiErrorMessage(
        responseData,
      );

    console.error(
      "ESIM ACCESS: Query HTTP error",
      {
        httpStatus:
          response.status,
        orderNo:
          normalizedOrderNo,
        requestId,
        errorCode,
        errorMessage:
          statusMessage,
      },
    );

    throw new Error(
      `eSIM Access profile query failed with HTTP ${response.status}: ${apiError}`,
    );
  }

  if (
    !responseWasSuccessful(
      responseData.success,
    )
  ) {
    const apiError =
      getApiErrorMessage(
        responseData,
      );

    console.error(
      "ESIM ACCESS: Profile query rejected",
      {
        orderNo:
          normalizedOrderNo,
        requestId,
        errorCode,
        errorMessage:
          statusMessage,
      },
    );

    throw new Error(apiError);
  }

  const profiles =
    validateProfiles(
      responseData.obj
        ?.esimList,
    );

  /*
   * A successful response with no profiles
   * can occur while supplier data is becoming
   * consistent. Treat it as pending so cron
   * can query again instead of failing payment.
   */
  if (profiles.length === 0) {
    console.info(
      "ESIM ACCESS: Query succeeded but no profiles are available yet",
      {
        orderNo:
          normalizedOrderNo,
        requestId,
      },
    );

    return {
      ready: false,
      pending: true,
      terminal: false,
      retryable: true,

      profiles: [],
      primaryProfile: null,

      errorCode: null,
      statusMessage:
        "The supplier order exists, but no allocated profile was returned yet.",

      rawResponse:
        responseData,
    };
  }

  const primaryProfile =
    selectPrimaryProfile(
      profiles,
    );

  const ready =
    primaryProfile !== null &&
    profileIsReady(
      primaryProfile,
    );

  const terminal =
    primaryProfile !== null &&
    profileIsTerminal(
      primaryProfile,
    );

  const pending =
    !ready &&
    !terminal &&
    (
      primaryProfile === null ||
      profileIsPending(
        primaryProfile,
      )
    );

  console.info(
    "ESIM ACCESS: Profile query completed",
    {
      orderNo:
        normalizedOrderNo,

      requestId,

      profileCount:
        profiles.length,

      ready,
      pending,
      terminal,

      esimTranNo:
        primaryProfile
          ?.esimTranNo,

      iccid:
        primaryProfile
          ?.iccid,

      esimStatus:
        primaryProfile
          ?.esimStatus,

      smdpStatus:
        primaryProfile
          ?.smdpStatus,

      hasActivationCode:
        Boolean(
          normalizeString(
            primaryProfile?.ac,
          ),
        ),

      hasQrCode:
        Boolean(
          normalizeString(
            primaryProfile
              ?.qrCodeUrl,
          ),
        ),
    },
  );

  return {
    ready,
    pending,
    terminal,
    retryable:
      pending && !terminal,

    profiles,
    primaryProfile,

    errorCode: null,

    statusMessage:
      ready
        ? "The eSIM profile is ready for delivery."
        : terminal
          ? "The eSIM profile is in a terminal supplier state."
          : "The eSIM profile is not ready for delivery yet.",

    rawResponse:
      responseData,
  };
}