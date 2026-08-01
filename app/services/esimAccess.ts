import "server-only";

import crypto from "crypto";

import type { EsimPackage } from "@/app/types/esim";

type EsimAccessResponse = {
  success?: boolean;
  errorCode?: string;
  errorMsg?: string;
  obj?: {
    packageList?: unknown[];
  };
  packageList?: unknown[];
};

function getEsimAccessConfig() {
  const accessCode = process.env.ESIM_ACCESS_CODE?.trim();
  const secretKey = process.env.ESIM_SECRET_KEY?.trim();

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

export async function fetchEsimAccessPlans(): Promise<
  EsimPackage[]
> {
  const {
    accessCode,
    secretKey,
    baseUrl,
  } = getEsimAccessConfig();

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

  let data: EsimAccessResponse;

  try {
    data = JSON.parse(
      responseText,
    ) as EsimAccessResponse;
  } catch {
    console.error(
      "Invalid eSIM Access response:",
      responseText,
    );

    throw new Error(
      `eSIM Access returned invalid JSON with HTTP ${response.status}.`,
    );
  }

  if (!response.ok) {
    console.error(
      "eSIM Access HTTP error:",
      data,
    );

    throw new Error(
      data.errorMsg ||
        `eSIM Access request failed with HTTP ${response.status}.`,
    );
  }

  if (data.success === false) {
    console.error(
      "eSIM Access API error:",
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
      "Unexpected eSIM Access response:",
      data,
    );

    throw new Error(
      "The eSIM Access response did not contain a valid package list.",
    );
  }

  return packageList as EsimPackage[];
}