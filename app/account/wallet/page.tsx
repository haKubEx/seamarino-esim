import {
  redirect,
} from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

import WalletClient from "./WalletClient";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/wallet");
  }

  const userId = session.user.id;

  const [customer, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        storeCreditPhpCentavos: true,
      },
    }),

    prisma.storeCreditTransaction.findMany({
      where: { userId },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        type: true,
        amountPhpCentavos: true,
        balanceBeforePhpCentavos: true,
        balanceAfterPhpCentavos: true,
        description: true,
        orderId: true,
        referralId: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  if (!customer) {
    redirect("/login?callbackUrl=/account/wallet");
  }

  const orderIds = [
    ...new Set(
      transactions
        .map((transaction) => transaction.orderId)
        .filter((orderId): orderId is string => Boolean(orderId)),
    ),
  ];

  const orders =
    orderIds.length > 0
      ? await prisma.order.findMany({
          where: {
            id: { in: orderIds },
            userId,
          },
          select: {
            id: true,
            referenceNumber: true,
            planName: true,
          },
        })
      : [];

  const orderById = new Map(
    orders.map((order) => [order.id, order]),
  );

  const totalEarnedPhpCentavos =
    transactions.reduce((total, transaction) => {
      if (
        transaction.amountPhpCentavos > 0 &&
        transaction.type !== "REFUND"
      ) {
        return total + transaction.amountPhpCentavos;
      }

      return total;
    }, 0);

  const totalUsedPhpCentavos =
    transactions.reduce((total, transaction) => {
      if (transaction.amountPhpCentavos < 0) {
        return total + Math.abs(transaction.amountPhpCentavos);
      }

      return total;
    }, 0);

  const totalRestoredPhpCentavos =
    transactions.reduce((total, transaction) => {
      if (
        transaction.type === "REFUND" &&
        transaction.amountPhpCentavos > 0
      ) {
        return total + transaction.amountPhpCentavos;
      }

      return total;
    }, 0);

  return (
    <WalletClient
      data={{
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          availableBalancePhpCentavos: Math.max(
            0,
            customer.storeCreditPhpCentavos,
          ),
        },

        stats: {
          totalEarnedPhpCentavos,
          totalUsedPhpCentavos,
          totalRestoredPhpCentavos,
          totalTransactions: transactions.length,
        },

        transactions: transactions.map((transaction) => {
          const order = transaction.orderId
            ? orderById.get(transaction.orderId) ?? null
            : null;

          return {
            id: transaction.id,
            type: transaction.type,
            amountPhpCentavos: transaction.amountPhpCentavos,
            balanceBeforePhpCentavos:
              transaction.balanceBeforePhpCentavos,
            balanceAfterPhpCentavos:
              transaction.balanceAfterPhpCentavos,
            description: transaction.description,
            orderId: transaction.orderId,
            referralId: transaction.referralId,
            expiresAt:
              transaction.expiresAt?.toISOString() ?? null,
            createdAt: transaction.createdAt.toISOString(),
            order: order
              ? {
                  referenceNumber: order.referenceNumber,
                  planName: order.planName,
                }
              : null,
          };
        }),
      }}
    />
  );
}