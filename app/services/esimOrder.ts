import "server-only";

import crypto from "crypto";

type EsimAccessOrderResponse = {
  success?: boolean | string;
  errorCode?: string | null;
  errorMessage?: string | null;
  errorMsg?: string | null;
  obj?: {
    orderNo?: string;
  };
};

export type EsimPurchaseResult = {
  orderNo: string;
  transactionId: string;
  rawResponse: EsimAccessOrderResponse;
};

function getEsimAccessConfig() {
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

function normalizeTransactionId(value: string) {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 50);

  if (!normalized) {
    throw new Error(
      "A valid eSIM transaction ID could not be created.",
    );
  }

  return normalized;
}

function responseWasSuccessful(
  success: boolean | string | undefined,
) {
  return success === true || success === "true";
}

function getApiErrorMessage(
  response: EsimAccessOrderResponse,
) {
  return (
    response.errorMessage ||
    response.errorMsg ||
    response.errorCode ||
    "eSIM Access rejected the order."
  );
}

export async function purchaseEsimProfile({
  packageCode,
  transactionId,
}: {
  packageCode: string;
  transactionId: string;
}): Promise<EsimPurchaseResult> {
  const normalizedPackageCode =
    packageCode.trim();

  if (!normalizedPackageCode) {
    throw new Error(
      "The eSIM package code is missing.",
    );
  }

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
   * Price and amount are optional according to
   * the eSIM Access API.
   *
   * We use packageCode + count so the supplier
   * processes the current wholesale price.
   */
  const requestBody = JSON.stringify({
    transactionId: safeTransactionId,

    packageInfoList: [
      {
        packageCode:
          normalizedPackageCode,

        count: 1,
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

  console.info(
    "ESIM ACCESS: Creating profile order",
    {
      transactionId:
        safeTransactionId,

      packageCode:
        normalizedPackageCode,

      requestId,
    },
  );

  const response = await fetch(endpoint, {
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
  });

  const responseText =
    await response.text();

  let responseData:
    EsimAccessOrderResponse;

  try {
    responseData = JSON.parse(
      responseText,
    ) as EsimAccessOrderResponse;
  } catch {
    console.error(
      "ESIM ACCESS: Invalid order response",
      {
        status: response.status,
        responseText,
      },
    );

    throw new Error(
      `eSIM Access returned invalid JSON with HTTP ${response.status}.`,
    );
  }

  if (!response.ok) {
    console.error(
      "ESIM ACCESS: Order HTTP error",
      {
        status: response.status,
        transactionId:
          safeTransactionId,

        packageCode:
          normalizedPackageCode,

        response: responseData,
      },
    );

    throw new Error(
      getApiErrorMessage(responseData),
    );
  }

  if (
    !responseWasSuccessful(
      responseData.success,
    )
  ) {
    console.error(
      "ESIM ACCESS: Order rejected",
      {
        transactionId:
          safeTransactionId,

        packageCode:
          normalizedPackageCode,

        response: responseData,
      },
    );

    throw new Error(
      getApiErrorMessage(responseData),
    );
  }

  const orderNo =
    responseData.obj?.orderNo?.trim();

  if (!orderNo) {
    console.error(
      "ESIM ACCESS: Missing order number",
      responseData,
    );

    throw new Error(
      "eSIM Access accepted the request but did not return an order number.",
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