const API_KEY = process.env.ESIM_API_KEY;
const SECRET_KEY = process.env.ESIM_SECRET_KEY;
const BASE_URL = process.env.ESIM_BASE_URL;

export async function esimRequest(endpoint: string) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "X-API-Key": API_KEY ?? "",
      "X-Secret-Key": SECRET_KEY ?? "",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}