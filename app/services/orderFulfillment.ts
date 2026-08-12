import "server-only";

import { prisma } from "@/app/lib/prisma";
import {
  purchaseEsimProfile,
} from "@/app/services/esimOrder";

export type FulfillmentResult =
  | {
      status: "ORDERED";
      orderId: string;
      referenceNumber: string;
      supplierOrderNo: string;
      transactionId: string;
    }
  | {
      status: "ALREADY_FULFILLED";
      orderId: string;
      referenceNumber: string;
      supplierOrderNo:
        | string
        | null;
    }
  | {
      status: "PROCESSING";
      orderId: string;
      referenceNumber: string;
      supplierOrderNo:
        | string
        | null;
    };

function getErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      1500,
    );
  }

  return "Unknown eSIM fulfillment error.";
}

function createEsimTransactionId(
  referenceNumber: string,
) {
  return referenceNumber
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    )
    .slice(
      0,
      50,
    );
}

export async function fulfillPaidOrder(
  orderId: string,
): Promise<FulfillmentResult> {
  const normalizedOrderId =
    orderId.trim();

  if (!normalizedOrderId) {
    throw new Error(
      "Order ID is required.",
    );
  }

  const order =
    await prisma.order.findUnique({
      where: {
        id: normalizedOrderId,
      },
    });

  if (!order) {
    throw new Error(
      "Order was not found.",
    );
  }

  if (
    order.paymentStatus !==
    "PAID"
  ) {
    throw new Error(
      "Only paid orders can be fulfilled.",
    );
  }

  /*
   * Never purchase another eSIM when a supplier
   * order already exists or the profile has
   * already reached an issued/delivered state.
   */
  if (
    order.esimOrderId ||
    order.esimStatus ===
      "ISSUED" ||
    order.esimStatus ===
      "DELIVERED" ||
    order.status ===
      "COMPLETED"
  ) {
    return {
      status:
        "ALREADY_FULFILLED",

      orderId:
        order.id,

      referenceNumber:
        order.referenceNumber,

      supplierOrderNo:
        order.esimOrderId,
    };
  }

  /*
   * Claim the order before calling eSIM Access.
   *
   * Only NOT_ORDERED / FAILED orders without a
   * supplier order can be claimed. This prevents
   * webhook + admin retry from purchasing twice.
   */
  const claimResult =
    await prisma.order.updateMany({
      where: {
        id:
          order.id,

        paymentStatus:
          "PAID",

        esimStatus: {
          in: [
            "NOT_ORDERED",
            "FAILED",
          ],
        },

        esimOrderId:
          null,
      },

      data: {
        status:
          "PROCESSING",

        esimStatus:
          "PROCESSING",

        processingAttempts: {
          increment:
            1,
        },

        lastAttemptAt:
          new Date(),

        lastError:
          null,
      },
    });

  if (
    claimResult.count ===
    0
  ) {
    const currentOrder =
      await prisma.order.findUnique({
        where: {
          id:
            order.id,
        },

        select: {
          id: true,
          referenceNumber:
            true,
          paymentStatus:
            true,
          status:
            true,
          esimStatus:
            true,
          esimOrderId:
            true,
        },
      });

    if (!currentOrder) {
      throw new Error(
        "Order was not found after the fulfillment claim.",
      );
    }

    if (
      currentOrder.esimOrderId ||
      currentOrder.esimStatus ===
        "ISSUED" ||
      currentOrder.esimStatus ===
        "DELIVERED" ||
      currentOrder.status ===
        "COMPLETED"
    ) {
      return {
        status:
          "ALREADY_FULFILLED",

        orderId:
          currentOrder.id,

        referenceNumber:
          currentOrder
            .referenceNumber,

        supplierOrderNo:
          currentOrder
            .esimOrderId,
      };
    }

    return {
      status:
        "PROCESSING",

      orderId:
        currentOrder.id,

      referenceNumber:
        currentOrder
          .referenceNumber,

      supplierOrderNo:
        currentOrder
          .esimOrderId,
    };
  }

  const transactionId =
    order.esimTransactionId ??
    createEsimTransactionId(
      order.referenceNumber,
    );

  /*
   * Persist the idempotent supplier transaction
   * identifier before making the external call.
   * Every retry reuses this same value.
   */
  await prisma.order.update({
    where: {
      id:
        order.id,
    },

    data: {
      esimTransactionId:
        transactionId,
    },
  });

  try {
    const purchaseResult =
      await purchaseEsimProfile({
        packageCode:
          order.packageCode,

        transactionId,

        /*
         * Daily-plan validity. Normal plans keep
         * selectedDays null, so periodNum is omitted.
         */
        periodNum:
          order.selectedDays ??
          undefined,
      });

    await prisma.order.update({
      where: {
        id:
          order.id,
      },

      data: {
        status:
          "PROCESSING",

        paymentStatus:
          "PAID",

        esimStatus:
          "PROCESSING",

        esimOrderId:
          purchaseResult
            .orderNo,

        esimTransactionId:
          purchaseResult
            .transactionId,

        lastError:
          null,

        lastAttemptAt:
          new Date(),
      },
    });

    console.info(
      "ESIM FULFILLMENT ORDER CREATED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        supplierOrderNo:
          purchaseResult
            .orderNo,

        transactionId:
          purchaseResult
            .transactionId,

        selectedDays:
          order.selectedDays,
      },
    );

    return {
      status:
        "ORDERED",

      orderId:
        order.id,

      referenceNumber:
        order.referenceNumber,

      supplierOrderNo:
        purchaseResult
          .orderNo,

      transactionId:
        purchaseResult
          .transactionId,
    };
  } catch (error) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "ESIM FULFILLMENT FAILED:",
      {
        orderId:
          order.id,

        referenceNumber:
          order.referenceNumber,

        packageCode:
          order.packageCode,

        transactionId,

        selectedDays:
          order.selectedDays,

        error:
          errorMessage,
      },
    );

    /*
     * Payment remains PAID. Only supplier
     * fulfillment failed, so the order remains
     * eligible for a safe retry.
     */
    await prisma.order.update({
      where: {
        id:
          order.id,
      },

      data: {
        status:
          "FAILED",

        paymentStatus:
          "PAID",

        esimStatus:
          "FAILED",

        esimTransactionId:
          transactionId,

        lastError:
          errorMessage,

        lastAttemptAt:
          new Date(),
      },
    });

    throw new Error(
      errorMessage,
    );
  }
}