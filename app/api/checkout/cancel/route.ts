import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { releaseCouponForOrder } from "@/app/services/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CancelRequestBody = {
  referenceNumber?: unknown;
};

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message.slice(0, 1500)
    : "Unknown cancellation error.";
}

function normalizeReferenceNumber(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

async function readReferenceNumber(
  request: Request,
) {
  const contentType =
    request.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    const body =
      (await request.json()) as
        CancelRequestBody;

    return normalizeReferenceNumber(
      body.referenceNumber,
    );
  }

  if (
    contentType.includes(
      "multipart/form-data",
    ) ||
    contentType.includes(
      "application/x-www-form-urlencoded",
    )
  ) {
    const formData =
      await request.formData();

    return normalizeReferenceNumber(
      formData.get(
        "referenceNumber",
      ),
    );
  }

  /*
   * Fallback for clients that omit
   * the Content-Type header.
   */
  try {
    const formData =
      await request.formData();

    return normalizeReferenceNumber(
      formData.get(
        "referenceNumber",
      ),
    );
  } catch {
    return "";
  }
}

export async function POST(
  request: Request,
) {
  const session =
    await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const referenceNumber =
      await readReferenceNumber(
        request,
      );

    if (!referenceNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Order reference number is required.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const order =
            await transaction.order.findFirst({
              where: {
                referenceNumber,

                userId:
                  session.user.id,
              },

              select: {
                id: true,
                referenceNumber: true,
                userId: true,

                status: true,
                paymentStatus: true,
                esimStatus: true,

                amountPhpCentavos: true,

                storeCreditUsedPhpCentavos:
                  true,
              },
            });

          if (!order) {
            return {
              success: false,
              statusCode: 404,
              error:
                "Order not found.",

              orderId: null,
              restoredPhpCentavos:
                0,
            };
          }

          if (
            order.status !==
              "PENDING" ||
            order.paymentStatus !==
              "PENDING"
          ) {
            return {
              success: false,
              statusCode: 409,
              error:
                "Only pending unpaid orders can be cancelled.",

              orderId:
                order.id,

              restoredPhpCentavos:
                0,
            };
          }

          if (
            order.esimStatus !==
            "NOT_ORDERED"
          ) {
            return {
              success: false,
              statusCode: 409,
              error:
                "This order can no longer be cancelled because eSIM processing has started.",

              orderId:
                order.id,

              restoredPhpCentavos:
                0,
            };
          }

          const creditToRestore =
            Math.max(
              0,
              order
                .storeCreditUsedPhpCentavos,
            );

          const cancelledAt =
            new Date();

          /*
           * Claim the pending order before
           * restoring any store credit.
           *
           * This prevents two cancellation
           * requests from restoring credit twice.
           */
          const cancellationClaim =
            await transaction.order.updateMany({
              where: {
                id:
                  order.id,

                userId:
                  session.user.id,

                status:
                  "PENDING",

                paymentStatus:
                  "PENDING",

                esimStatus:
                  "NOT_ORDERED",
              },

              data: {
                status:
                  "CANCELLED",

                paymentStatus:
                  "CANCELLED",

                esimStatus:
                  "NOT_ORDERED",

                cancelledAt,

                storeCreditUsedPhpCentavos:
                  0,

                amountPhpCentavos: {
                  increment:
                    creditToRestore,
                },

                paymongoSessionId:
                  null,

                lastError:
                  "The customer cancelled this unpaid order.",

                lastAttemptAt:
                  cancelledAt,
              },
            });

          if (
            cancellationClaim.count !==
            1
          ) {
            return {
              success: false,
              statusCode: 409,
              error:
                "The order changed while it was being cancelled. Refresh the page and try again.",

              orderId:
                order.id,

              restoredPhpCentavos:
                0,
            };
          }

          if (
            creditToRestore > 0 &&
            order.userId
          ) {
            const customer =
              await transaction.user.findUnique({
                where: {
                  id:
                    order.userId,
                },

                select: {
                  id: true,

                  storeCreditPhpCentavos:
                    true,
                },
              });

            if (!customer) {
              throw new Error(
                "The customer account could not be found while restoring store credit.",
              );
            }

            const balanceBefore =
              customer
                .storeCreditPhpCentavos;

            const balanceAfter =
              balanceBefore +
              creditToRestore;

            await transaction.user.update({
              where: {
                id:
                  customer.id,
              },

              data: {
                storeCreditPhpCentavos: {
                  increment:
                    creditToRestore,
                },
              },
            });

            await transaction
              .storeCreditTransaction
              .create({
                data: {
                  userId:
                    customer.id,

                  type:
                    "REFUND",

                  amountPhpCentavos:
                    creditToRestore,

                  balanceBeforePhpCentavos:
                    balanceBefore,

                  balanceAfterPhpCentavos:
                    balanceAfter,

                  orderId:
                    order.id,

                  description:
                    `Store credit restored after cancelling ${order.referenceNumber}.`,
                },
              });
          }

          return {
            success: true,
            statusCode: 200,
            error: null,

            orderId:
              order.id,

            restoredPhpCentavos:
              creditToRestore,
          };
        },
        {
          isolationLevel:
            "Serializable",
        },
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error,
        },
        {
          status:
            result.statusCode,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    /*
     * Coupon release uses its own Prisma
     * operation, so run it after the main
     * cancellation transaction completes.
     */
    if (result.orderId) {
      try {
        await releaseCouponForOrder(
          result.orderId,
        );
      } catch (error) {
        console.error(
          "CANCEL ORDER: Unable to release coupon reservation:",
          {
            orderId:
              result.orderId,

            error:
              getErrorMessage(
                error,
              ),
          },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,

        message:
          result
            .restoredPhpCentavos >
          0
            ? "Order cancelled and store credit restored."
            : "Order cancelled.",

        restoredPhpCentavos:
          result
            .restoredPhpCentavos,

        referenceNumber,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "CANCEL PENDING ORDER ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Unable to cancel this pending order.",

        details:
          process.env.NODE_ENV ===
          "development"
            ? getErrorMessage(
                error,
              )
            : undefined,
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,

      message:
        "Use the Cancel Order button on a pending unpaid order.",

      method:
        "POST",
    },
    {
      status: 405,

      headers: {
        Allow: "POST",

        "Cache-Control":
          "no-store",
      },
    },
  );
}