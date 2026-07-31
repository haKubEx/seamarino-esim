import { esimClient } from "./client";
import { createHeaders } from "./auth";

export async function getBalance() {
  const body = {};

  const headers = createHeaders(body);

  const response = await esimClient.post(
    "/api/v1/open/balance/query",
    body,
    {
      headers,
    }
  );

  return response.data;
}