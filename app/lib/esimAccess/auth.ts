import crypto from "crypto";
import { v4 as uuid } from "uuid";

export function createHeaders(body: object) {
  const accessCode = process.env.ESIM_ACCESS_CODE!;
  const secretKey = process.env.ESIM_SECRET_KEY!;

  const timestamp = Date.now().toString();
  const requestId = uuid();

  const bodyString = JSON.stringify(body);

  const message =
    timestamp +
    requestId +
    accessCode +
    bodyString;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");

  return {
    "RT-AccessCode": accessCode,
    "RT-RequestID": requestId,
    "RT-Timestamp": timestamp,
    "RT-Signature": signature,
  };
}