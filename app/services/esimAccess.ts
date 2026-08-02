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
};

function getEsimAccessConfig(): EsimAccessConfig {
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
        responseText,
      },
    );

    throw new Error(
      `eSIM Access returned invalid JSON with HTTP ${response.status}.`,
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
  } = getEsimAccessConfig();

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

  const response =
    await fetch(endpoint, {
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
    });

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
      data,
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

  if (!Array.isArray(packageList)) {
    console.error(
      "ESIM ACCESS INVALID PACKAGE LIST:",
      data,
    );

    throw new Error(
      "The eSIM Access response did not contain a valid package list.",
    );
  }

  return packageList as EsimPackage[];
}