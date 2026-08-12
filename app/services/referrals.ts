import { prisma } from "@/app/lib/prisma";

const MAX_TRANSACTION_RETRIES =
  3;

type ReferralRewardResult = {
  success: boolean;
  rewarded: boolean;
  skipped: boolean;
  message: string;

  referralId?: string;
  referrerId?: string;
  referredUserId?: string;

  qualifyingOrderId?: string;

  referrerRewardPhpCentavos?: number;
  referredRewardPhpCentavos?: number;
  minimumReferralDataBytes?: string;
};

function getPrismaErrorCode(
  error: unknown,
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return "";
}

function isRetryableTransactionError(
  error: unknown,
) {
  const code =
    getPrismaErrorCode(
      error,
    );

  return (
    code === "P2034" ||
    code === "P2028"
  );
}

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Unknown referral reward error.";
}

async function getMinimumReferralDataBytes() {
  const settings =
    await prisma.appSetting.upsert({
      where: {
        id: "main",
      },

      update: {},

      create: {
        id: "main",
      },

      select: {
        minimumReferralDataBytes:
          true,
      },
    });

  return settings.minimumReferralDataBytes;
}

function formatMinimumDataRequirement(
  minimumDataBytes: bigint,
) {
  const bytesPerGb =
    BigInt(1024) *
    BigInt(1024) *
    BigInt(1024);

  const wholeGb =
    minimumDataBytes /
    bytesPerGb;

  const remainder =
    minimumDataBytes %
    bytesPerGb;

  if (remainder === BigInt(0)) {
    return `${wholeGb.toString()}GB`;
  }

  const gb =
    Number(minimumDataBytes) /
    Number(bytesPerGb);

  return `${gb.toFixed(2).replace(/\\.?0+$/, "")}GB`;
}

async function rewardReferralTransaction(
  orderId: string,
): Promise<ReferralRewardResult> {
  return prisma.$transaction(
    async (transaction) => {
      const minimumReferralDataBytes =
        await getMinimumReferralDataBytes();

      const minimumDataLabel =
        formatMinimumDataRequirement(
          minimumReferralDataBytes,
        );

      const order =
        await transaction.order.findUnique({
          where: {
            id:
              orderId,
          },

          select: {
            id:
              true,

            referenceNumber:
              true,

            planName:
              true,

            packageCode:
              true,

            userId:
              true,

            dataVolumeBytes:
              true,

            status:
              true,

            paymentStatus:
              true,

            esimStatus:
              true,

            emailDeliveryStatus:
              true,

            emailSent:
              true,

            completedAt:
              true,
          },
        });

      if (!order) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "The qualifying order was not found.",
        };
      }

      if (!order.userId) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "The completed order is not linked to a customer account.",
        };
      }

      if (
        order.paymentStatus !==
          "PAID" ||
        order.status !==
          "COMPLETED" ||
        order.esimStatus !==
          "DELIVERED" ||
        order.emailDeliveryStatus !==
          "SENT" ||
        !order.emailSent
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "The order is not fully paid, delivered, and emailed to the customer.",
        };
      }

      if (
        order.dataVolumeBytes ===
        null
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "The order does not contain a data-volume snapshot.",
        };
      }

      if (
        order.dataVolumeBytes <
        minimumReferralDataBytes
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            `Referral rewards require a delivered eSIM plan with at least ${minimumDataLabel} of data.`,
        };
      }

      const referral =
        await transaction.referral.findUnique({
          where: {
            referredUserId:
              order.userId,
          },

          select: {
            id:
              true,

            referralCode:
              true,

            referrerId:
              true,

            referredUserId:
              true,

            qualifyingOrderId:
              true,

            status:
              true,

            referrerRewardPhpCentavos:
              true,

            referredRewardPhpCentavos:
              true,
          },
        });

      if (!referral) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "The customer was not registered through a referral.",
        };
      }

      if (
        referral.status ===
        "REWARDED"
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "This referral was already rewarded.",

          referralId:
            referral.id,

          referrerId:
            referral.referrerId,

          referredUserId:
            referral.referredUserId,

          qualifyingOrderId:
            referral.qualifyingOrderId ??
            undefined,
        };
      }

      if (
        referral.status ===
        "CANCELLED"
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "This referral was cancelled.",

          referralId:
            referral.id,
        };
      }

      if (
        referral.qualifyingOrderId &&
        referral.qualifyingOrderId !==
          order.id
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "This referral is already linked to another qualifying order.",

          referralId:
            referral.id,

          qualifyingOrderId:
            referral.qualifyingOrderId,
        };
      }

      if (
        referral.referrerId ===
        referral.referredUserId
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "A customer cannot reward their own referral.",

          referralId:
            referral.id,
        };
      }

      const [
        referrer,
        referredUser,
      ] = await Promise.all([
        transaction.user.findUnique({
          where: {
            id:
              referral.referrerId,
          },

          select: {
            id:
              true,

            storeCreditPhpCentavos:
              true,
          },
        }),

        transaction.user.findUnique({
          where: {
            id:
              referral.referredUserId,
          },

          select: {
            id:
              true,

            storeCreditPhpCentavos:
              true,
          },
        }),
      ]);

      if (
        !referrer ||
        !referredUser
      ) {
        throw new Error(
          "The referrer or referred customer account no longer exists.",
        );
      }

      const referrerReward =
        Math.max(
          0,
          referral
            .referrerRewardPhpCentavos,
        );

      const referredReward =
        Math.max(
          0,
          referral
            .referredRewardPhpCentavos,
        );

      if (
        referrerReward === 0 &&
        referredReward === 0
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "This referral has no reward amount configured.",

          referralId:
            referral.id,
        };
      }

      const rewardedAt =
        new Date();

      /*
       * Claim the referral before changing any
       * user balances. The status condition keeps
       * concurrent workers from rewarding twice.
       */
      const claimResult =
        await transaction.referral.updateMany({
          where: {
            id:
              referral.id,

            status: {
              in: [
                "PENDING",
                "QUALIFIED",
              ],
            },

            OR: [
              {
                qualifyingOrderId:
                  null,
              },
              {
                qualifyingOrderId:
                  order.id,
              },
            ],
          },

          data: {
            status:
              "QUALIFIED",

            qualifyingOrderId:
              order.id,

            qualifiedAt:
              rewardedAt,

            cancelledAt:
              null,
          },
        });

      if (
        claimResult.count !== 1
      ) {
        return {
          success: true,
          rewarded: false,
          skipped: true,
          message:
            "Another process already handled this referral.",

          referralId:
            referral.id,
        };
      }

      const referrerBalanceBefore =
        referrer
          .storeCreditPhpCentavos;

      const referrerBalanceAfter =
        referrerBalanceBefore +
        referrerReward;

      const referredBalanceBefore =
        referredUser
          .storeCreditPhpCentavos;

      const referredBalanceAfter =
        referredBalanceBefore +
        referredReward;

      if (
        referrerReward > 0
      ) {
        await transaction.user.update({
          where: {
            id:
              referrer.id,
          },

          data: {
            storeCreditPhpCentavos: {
              increment:
                referrerReward,
            },
          },
        });
      }

      if (
        referredReward > 0
      ) {
        await transaction.user.update({
          where: {
            id:
              referredUser.id,
          },

          data: {
            storeCreditPhpCentavos: {
              increment:
                referredReward,
            },
          },
        });
      }

      const ledgerEntries: Array<{
        userId: string;
        type:
          "REFERRAL_REWARD";
        amountPhpCentavos: number;
        balanceBeforePhpCentavos: number;
        balanceAfterPhpCentavos: number;
        referralId: string;
        orderId: string;
        description: string;
      }> = [];

      if (
        referrerReward > 0
      ) {
        ledgerEntries.push({
          userId:
            referrer.id,

          type:
            "REFERRAL_REWARD",

          amountPhpCentavos:
            referrerReward,

          balanceBeforePhpCentavos:
            referrerBalanceBefore,

          balanceAfterPhpCentavos:
            referrerBalanceAfter,

          referralId:
            referral.id,

          orderId:
            order.id,

          description:
            `Referral reward for ${order.referenceNumber} (${order.planName}, minimum ${minimumDataLabel} requirement met).`,
        });
      }

      if (
        referredReward > 0
      ) {
        ledgerEntries.push({
          userId:
            referredUser.id,

          type:
            "REFERRAL_REWARD",

          amountPhpCentavos:
            referredReward,

          balanceBeforePhpCentavos:
            referredBalanceBefore,

          balanceAfterPhpCentavos:
            referredBalanceAfter,

          referralId:
            referral.id,

          orderId:
            order.id,

          description:
            `Welcome referral reward for ${order.referenceNumber} (${order.planName}, minimum ${minimumDataLabel} requirement met).`,
        });
      }

      if (
        ledgerEntries.length >
        0
      ) {
        await transaction
          .storeCreditTransaction
          .createMany({
            data:
              ledgerEntries,
          });
      }

      await transaction.referral.update({
        where: {
          id:
            referral.id,
        },

        data: {
          status:
            "REWARDED",

          qualifyingOrderId:
            order.id,

          qualifiedAt:
            rewardedAt,

          rewardedAt,

          cancelledAt:
            null,
        },
      });

      return {
        success: true,
        rewarded: true,
        skipped: false,

        message:
          "Referral rewards were added successfully.",

        referralId:
          referral.id,

        referrerId:
          referral.referrerId,

        referredUserId:
          referral.referredUserId,

        qualifyingOrderId:
          order.id,

        referrerRewardPhpCentavos:
          referrerReward,

        referredRewardPhpCentavos:
          referredReward,

        minimumReferralDataBytes:
          minimumReferralDataBytes.toString(),
      };
    },
    {
      isolationLevel:
        "Serializable",
    },
  );
}

export async function rewardReferralForCompletedOrder(
  orderId: string,
): Promise<ReferralRewardResult> {
  const normalizedOrderId =
    orderId.trim();

  if (!normalizedOrderId) {
    return {
      success: false,
      rewarded: false,
      skipped: true,
      message:
        "A valid order ID is required.",
    };
  }

  for (
    let attempt = 1;
    attempt <=
    MAX_TRANSACTION_RETRIES;
    attempt += 1
  ) {
    try {
      const result =
        await rewardReferralTransaction(
          normalizedOrderId,
        );

      if (
        result.rewarded
      ) {
        console.info(
          "REFERRAL REWARD COMPLETED:",
          {
            orderId:
              normalizedOrderId,

            qualifyingOrderId:
              result
                .qualifyingOrderId,

            referralId:
              result.referralId,

            referrerId:
              result.referrerId,

            referredUserId:
              result.referredUserId,

            minimumDataBytes:
              result.minimumReferralDataBytes,

            referrerRewardPhpCentavos:
              result
                .referrerRewardPhpCentavos,

            referredRewardPhpCentavos:
              result
                .referredRewardPhpCentavos,
          },
        );
      } else {
        console.info(
          "REFERRAL REWARD NOT APPLIED:",
          {
            orderId:
              normalizedOrderId,

            skipped:
              result.skipped,

            message:
              result.message,
          },
        );
      }

      return result;
    } catch (error) {
      if (
        isRetryableTransactionError(
          error,
        ) &&
        attempt <
          MAX_TRANSACTION_RETRIES
      ) {
        await new Promise<void>(
          (resolve) => {
            setTimeout(
              resolve,
              attempt * 150,
            );
          },
        );

        continue;
      }

      console.error(
        "REFERRAL REWARD ERROR:",
        {
          orderId:
            normalizedOrderId,

          attempt,

          error:
            getErrorMessage(
              error,
            ),
        },
      );

      return {
        success: false,
        rewarded: false,
        skipped: false,
        message:
          getErrorMessage(
            error,
          ),
      };
    }
  }

  return {
    success: false,
    rewarded: false,
    skipped: false,
    message:
      "Unable to process the referral reward.",
  };
}