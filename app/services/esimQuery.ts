import "server-only";

import crypto from "crypto";

export type EsimProfile = {
  esimTranNo?: string;
  orderNo?: string;
  imsi?: string;
  iccid?: string;
  msisdn?: string;

  ac?: string;
  qrCodeUrl?: string;

  smdpStatus?: string;
  esimStatus?: string;

  eid?: string;
  activeType?: string;
  expiredTime?: string;

  totalVolume?: number;
  totalDuration?: number;
  durationUnit?: string;
  orderUsage?: number;

  pin?: string;
  puk?: string;
  apn?: string;

  packageList?: Array<{
    packageCode?: string;
    duration?: number;
    volume?: number;
    locationCode?: string;
  }>;
};

type EsimQueryApiResponse = {
  success?: boolean | string;

  errorCode?: string | null;
  errorMessage?: string | null;
  errorMsg?: string | null;

  obj?: {
    esimList?: EsimProfile[];

    pager?: {
      pageSize?: number;
      pageNum?: number;
      total?: number;
    };
  };
};

export type EsimQueryResult = {
  ready: boolean;
  pending: boolean;

  profiles: EsimProfile[];

  primaryProfile: EsimProfile | null;

  rawResponse: EsimQueryApiResponse;
};

function getEsimAccessConfiguration() {
  const accessCode =
    process.env.ESIM_ACCESS_CODE?.trim();

  const secretKey =
    process.env.ESIM_SECRET_KEY?.trim();

  const baseUrl = (
    process.env.ESIM_BASE_URL?.trim() ||
    "https://api.esimaccess.com"
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
    .createHmac("sha256", secretKey)
    .update(signData)
    .digest("hex")
    .toLowerCase();
}

function responseWasSuccessful(
  success: boolean | string | undefined,
) {
  return success === true || success === "true";
}

function getErrorMessage(
  response: EsimQueryApiResponse,
) {
  return (
    response.errorMessage ||
    response.errorMsg ||
    response.errorCode ||
    "eSIM Access could not query the profile."
  );
}

function profileIsReady(profile: EsimProfile) {
  const hasInstallationData =
    Boolean(profile.ac?.trim()) &&
    Boolean(profile.qrCodeUrl?.trim()) &&
    Boolean(profile.iccid?.trim());

  const normalizedEsimStatus =
    profile.esimStatus?.trim().toUpperCase();

  const normalizedSmdpStatus =
    profile.smdpStatus?.trim().toUpperCase();

  const allocated =
    normalizedEsimStatus === "GOT_RESOURCE" ||
    normalizedEsimStatus === "IN_USE";

  const releasedOrLater =
    normalizedSmdpStatus === "RELEASED" ||
    normalizedSmdpStatus === "DOWNLOAD" ||
    normalizedSmdpStatus === "INSTALLATION" ||
    normalizedSmdpStatus === "ENABLED";

  return (
    hasInstallationData &&
    (allocated || releasedOrLater)
  );
}

export async function queryEsimProfiles(
  orderNo: string,
): Promise<EsimQueryResult> {
  const normalizedOrderNo = orderNo.trim();

  if (!normalizedOrderNo) {
    throw new Error(
      "The eSIM Access order number is missing.",
    );
  }

  const {
    accessCode,
    secretKey,
    baseUrl,
  } = getEsimAccessConfiguration();

  const endpoint =
    `${baseUrl}/api/v1/open/esim/query`;

  const requestBody = JSON.stringify({
    orderNo: normalizedOrderNo,

    iccid: "",

    pager: {
      pageNum: 1,
      pageSize: 50,
    },
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

  console.info(
    "ESIM ACCESS: Querying allocated profiles",
    {
      orderNo: normalizedOrderNo,
      requestId,
    },
  );

  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      Accept: "application/json",
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

  let responseData: EsimQueryApiResponse;

  try {
    responseData = JSON.parse(
      responseText,
    ) as EsimQueryApiResponse;
  } catch {
    console.error(
      "ESIM ACCESS: Invalid query response",
      {
        status: response.status,
        orderNo: normalizedOrderNo,
        responseText,
      },
    );

    throw new Error(
      `eSIM Access returned invalid JSON with HTTP ${response.status}.`,
    );
  }

  /*
   * Error 200010 means that the SM-DP+ server
   * is still allocating the eSIM profile.
   */
  if (responseData.errorCode === "200010") {
    console.info(
      "ESIM ACCESS: Profile allocation is still pending",
      {
        orderNo: normalizedOrderNo,
      },
    );

    return {
      ready: false,
      pending: true,
      profiles: [],
      primaryProfile: null,
      rawResponse: responseData,
    };
  }

  if (!response.ok) {
    console.error(
      "ESIM ACCESS: Query HTTP error",
      {
        status: response.status,
        orderNo: normalizedOrderNo,
        response: responseData,
      },
    );

    throw new Error(
      getErrorMessage(responseData),
    );
  }

  if (!responseWasSuccessful(responseData.success)) {
    console.error(
      "ESIM ACCESS: Query rejected",
      {
        orderNo: normalizedOrderNo,
        response: responseData,
      },
    );

    throw new Error(
      getErrorMessage(responseData),
    );
  }

  const profiles =
    responseData.obj?.esimList ?? [];

  if (!Array.isArray(profiles)) {
    throw new Error(
      "eSIM Access returned an invalid profile list.",
    );
  }

  const primaryProfile =
    profiles.find(profileIsReady) ??
    profiles[0] ??
    null;

  const ready =
    primaryProfile !== null &&
    profileIsReady(primaryProfile);

  console.info(
    "ESIM ACCESS: Profile query completed",
    {
      orderNo: normalizedOrderNo,
      profileCount: profiles.length,
      ready,
      esimTranNo:
        primaryProfile?.esimTranNo,
      iccid: primaryProfile?.iccid,
      esimStatus:
        primaryProfile?.esimStatus,
      smdpStatus:
        primaryProfile?.smdpStatus,
    },
  );

  return {
    ready,
    pending: !ready,
    profiles,
    primaryProfile,
    rawResponse: responseData,
  };
}