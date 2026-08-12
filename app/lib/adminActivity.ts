import { headers } from "next/headers";

import { prisma } from "@/app/lib/prisma";

type LogAdminActivityInput = {
  adminId: string;
  action: string;
  module: string;
  description: string;

  entityId?: string | null;
  entityType?: string | null;

  oldValue?: unknown;
  newValue?: unknown;

  success?: boolean;
  errorMessage?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;
};

function toJsonValue(
  value: unknown,
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(
      value,
      (_, currentValue) =>
        typeof currentValue ===
        "bigint"
          ? currentValue.toString()
          : currentValue,
    ),
  );
}

async function getRequestMetadata() {
  try {
    const requestHeaders =
      await headers();

    const forwardedFor =
      requestHeaders
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim();

    const realIp =
      requestHeaders
        .get("x-real-ip")
        ?.trim();

    return {
      ipAddress:
        forwardedFor ||
        realIp ||
        null,

      userAgent:
        requestHeaders
          .get("user-agent")
          ?.trim() ||
        null,
    };
  } catch {
    return {
      ipAddress:
        null,
      userAgent:
        null,
    };
  }
}

export async function logAdminActivity(
  input: LogAdminActivityInput,
) {
  try {
    const metadata =
      await getRequestMetadata();

    await prisma.adminActivityLog.create({
      data: {
        adminId:
          input.adminId,

        action:
          input.action.trim(),

        module:
          input.module.trim(),

        entityId:
          input.entityId ??
          null,

        entityType:
          input.entityType ??
          null,

        description:
          input.description.trim(),

        oldValue:
          toJsonValue(
            input.oldValue,
          ),

        newValue:
          toJsonValue(
            input.newValue,
          ),

        ipAddress:
          input.ipAddress ??
          metadata.ipAddress,

        userAgent:
          input.userAgent ??
          metadata.userAgent,

        success:
          input.success ??
          true,

        errorMessage:
          input.errorMessage ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN ACTIVITY LOG ERROR:",
      error,
    );
  }
}