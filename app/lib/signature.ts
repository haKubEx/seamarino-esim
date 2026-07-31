import crypto from "crypto";

export function createSignature(
  timestamp: string,
  requestId: string,
  accessCode: string,
  secretKey: string
) {
  const message = `${timestamp}${requestId}${accessCode}`;

  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
}