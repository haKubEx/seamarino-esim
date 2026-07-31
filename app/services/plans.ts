import type { EsimPackage } from "@/app/types/esim";

export async function getPlans(): Promise<EsimPackage[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/plans`, {
    cache: "no-store",
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