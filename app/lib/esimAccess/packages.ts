import { esimClient } from "./client";
import { createHeaders } from "./auth";

export async function getPackages() {
  const body = {};

  const headers = createHeaders(body);

  const response = await esimClient.post(
    "/api/v1/open/package/list",
    body,
    {
      headers,
    }
  );

  return response.data;
}