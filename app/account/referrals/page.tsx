import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

import ReferralDashboardClient from "./ReferralDashboardClient";

export const dynamic =
  "force-dynamic";

export default async function ReferralPage() {
  const session =
    await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/account/referrals",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        storeCreditPhpCentavos:
          true,

        referralsCreated: {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            referralCode: true,
            status: true,

            referrerRewardPhpCentavos:
              true,

            referredRewardPhpCentavos:
              true,

            qualifiedAt: true,
            rewardedAt: true,
            cancelledAt: true,
            createdAt: true,

            referredUser: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },

            qualifyingOrder: {
              select: {
                referenceNumber:
                  true,

                planName:
                  true,

                amountPhpCentavos:
                  true,

                paymentStatus:
                  true,

                esimStatus:
                  true,

                status:
                  true,

                completedAt:
                  true,
              },
            },
          },
        },

        referralReceived: {
          select: {
            id: true,
            referralCode: true,
            status: true,

            referrerRewardPhpCentavos:
              true,

            referredRewardPhpCentavos:
              true,

            qualifiedAt: true,
            rewardedAt: true,
            createdAt: true,

            referrer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },

        storeCreditTransactions: {
          orderBy: {
            createdAt: "desc",
          },

          take: 100,

          select: {
            id: true,
            type: true,
            amountPhpCentavos:
              true,

            balanceBeforePhpCentavos:
              true,

            balanceAfterPhpCentavos:
              true,

            description: true,
            expiresAt: true,
            createdAt: true,

            referral: {
              select: {
                referralCode:
                  true,

                status:
                  true,
              },
            },

            order: {
              select: {
                referenceNumber:
                  true,

                planName:
                  true,
              },
            },
          },
        },
      },
    });

  if (!user) {
    redirect("/login");
  }

  const pendingCount =
    user.referralsCreated.filter(
      (referral) =>
        referral.status ===
        "PENDING",
    ).length;

  const qualifiedCount =
    user.referralsCreated.filter(
      (referral) =>
        referral.status ===
        "QUALIFIED",
    ).length;

  const rewardedCount =
    user.referralsCreated.filter(
      (referral) =>
        referral.status ===
        "REWARDED",
    ).length;

  const cancelledCount =
    user.referralsCreated.filter(
      (referral) =>
        referral.status ===
        "CANCELLED",
    ).length;

  const totalEarnedCentavos =
    user.storeCreditTransactions.reduce(
      (total, transaction) => {
        if (
          transaction.amountPhpCentavos <=
          0
        ) {
          return total;
        }

        return (
          total +
          transaction.amountPhpCentavos
        );
      },
      0,
    );

  return (
    <ReferralDashboardClient
      data={{
        user: {
          id: user.id,
          name: user.name,
          email: user.email,

          referralCode:
            user.referralCode,

          storeCreditPhpCentavos:
            user.storeCreditPhpCentavos,
        },

        stats: {
          totalReferrals:
            user.referralsCreated
              .length,

          pendingCount,
          qualifiedCount,
          rewardedCount,
          cancelledCount,
          totalEarnedCentavos,
        },

        referrals:
          user.referralsCreated.map(
            (referral) => ({
              ...referral,

              qualifiedAt:
                referral.qualifiedAt
                  ?.toISOString() ??
                null,

              rewardedAt:
                referral.rewardedAt
                  ?.toISOString() ??
                null,

              cancelledAt:
                referral.cancelledAt
                  ?.toISOString() ??
                null,

              createdAt:
                referral.createdAt
                  .toISOString(),

              referredUser: {
                ...referral.referredUser,

                createdAt:
                  referral.referredUser
                    .createdAt
                    .toISOString(),
              },

              qualifyingOrder:
                referral.qualifyingOrder
                  ? {
                      ...referral.qualifyingOrder,

                      completedAt:
                        referral
                          .qualifyingOrder
                          .completedAt
                          ?.toISOString() ??
                        null,
                    }
                  : null,
            }),
          ),

        referralReceived:
          user.referralReceived
            ? {
                ...user.referralReceived,

                qualifiedAt:
                  user.referralReceived
                    .qualifiedAt
                    ?.toISOString() ??
                  null,

                rewardedAt:
                  user.referralReceived
                    .rewardedAt
                    ?.toISOString() ??
                  null,

                createdAt:
                  user.referralReceived
                    .createdAt
                    .toISOString(),
              }
            : null,

        transactions:
          user.storeCreditTransactions.map(
            (transaction) => ({
              ...transaction,

              expiresAt:
                transaction.expiresAt
                  ?.toISOString() ??
                null,

              createdAt:
                transaction.createdAt
                  .toISOString(),
            }),
          ),
      }}
    />
  );
}