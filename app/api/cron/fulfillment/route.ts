function isAuthorized(request: Request) {
  const authorization =
    request.headers.get("authorization");

  const fulfillmentSecret =
    process.env.FULFILLMENT_SECRET?.trim();

  const cronSecret =
    process.env.CRON_SECRET?.trim();

  const suppliedToken =
    authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

  console.info("FULFILLMENT AUTH CHECK:", {
    hasAuthorizationHeader:
      Boolean(authorization),

    authorizationUsesBearer:
      authorization?.startsWith(
        "Bearer ",
      ) ?? false,

    suppliedTokenLength:
      suppliedToken.length,

    hasFulfillmentSecret:
      Boolean(fulfillmentSecret),

    fulfillmentSecretLength:
      fulfillmentSecret?.length ?? 0,

    hasCronSecret:
      Boolean(cronSecret),

    cronSecretLength:
      cronSecret?.length ?? 0,
  });

  if (!authorization) {
    return false;
  }

  const acceptedTokens = [
    fulfillmentSecret,
    cronSecret,
  ].filter(
    (value): value is string =>
      Boolean(value),
  );

  return acceptedTokens.some(
    (secret) =>
      authorization ===
      `Bearer ${secret}`,
  );
}