import { v4 as uuid } from "uuid";
import { createSignature } from "./signature";

const BASE_URL = process.env.ESIM_BASE_URL!;
const ACCESS_CODE = process.env.ESIM_ACCESS_CODE!;
const SECRET_KEY = process.env.ESIM_SECRET_KEY!;

export async function esimAccessRequest(
  endpoint: string,
  body: object
) {
  const timestamp = Date.now().toString();
  const requestId = uuid();

  const signature = createSignature(
    timestamp,
    requestId,
    ACCESS_CODE,
    SECRET_KEY
  );

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "RT-AccessCode": ACCESS_CODE,
      "RT-Timestamp": timestamp,
      "RT-RequestID": requestId,
      "RT-Signature": signature,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  return response.json();
}