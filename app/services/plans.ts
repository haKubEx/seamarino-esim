import type { EsimPackage } from "@/app/types/esim";

function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim().replace(/\/+$/, "");

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export async function getPlans(): Promise<EsimPackage[]> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/api/plans`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Plans API failed with status ${response.status}: ${errorText}`,
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Plans API returned an invalid response.");
  }

  return data as EsimPackage[];
}