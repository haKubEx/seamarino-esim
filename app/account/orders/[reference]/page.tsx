import {
  notFound,
  redirect,
} from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

import OrderDetailsClient from "./OrderDetailsClient";

type OrderDetailsPageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const session =
    await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/account/orders",
    );
  }

  const {
    reference,
  } = await params;

  const decodedReference =
    decodeURIComponent(
      reference,
    ).trim();

  if (!decodedReference) {
    notFound();
  }

  const order =
    await prisma.order.findFirst({
      where: {
        referenceNumber:
          decodedReference,

        userId:
          session.user.id,
      },

      select: {
        referenceNumber:
          true,

        planName:
          true,

        packageCode:
          true,

        status:
          true,

        paymentStatus:
          true,

        esimStatus:
          true,

        /*
         * Full pricing breakdown.
         */
        subtotalPhpCentavos:
          true,

        discountPhpCentavos:
          true,

        storeCreditUsedPhpCentavos:
          true,

        amountPhpCentavos:
          true,

        couponCodeSnapshot:
          true,

        createdAt:
          true,

        paidAt:
          true,

        completedAt:
          true,

        iccid:
          true,

        qrCode:
          true,

        qrCodeUrl:
          true,

        activationCode:
          true,

        smdpAddress:
          true,

        smdpStatus:
          true,

        supplierEsimStatus:
          true,

        apn:
          true,

        lastError:
          true,
      },
    });

  if (!order) {
    notFound();
  }

  const subtotalPhpCentavos =
    order.subtotalPhpCentavos ??
    (
      order.amountPhpCentavos +
      order.discountPhpCentavos +
      order.storeCreditUsedPhpCentavos
    );

  return (
    <OrderDetailsClient
      order={{
        referenceNumber:
          order.referenceNumber,

        planName:
          order.planName,

        packageCode:
          order.packageCode,

        status:
          order.status,

        paymentStatus:
          order.paymentStatus,

        esimStatus:
          order.esimStatus,

        subtotalPhpCentavos,

        discountPhpCentavos:
          order.discountPhpCentavos,

        storeCreditUsedPhpCentavos:
          order.storeCreditUsedPhpCentavos,

        amountPhpCentavos:
          order.amountPhpCentavos,

        couponCodeSnapshot:
          order.couponCodeSnapshot,

        createdAt:
          order.createdAt.toISOString(),

        paidAt:
          order.paidAt?.toISOString() ??
          null,

        completedAt:
          order.completedAt?.toISOString() ??
          null,

        iccid:
          order.iccid,

        qrCode:
          order.qrCode,

        qrCodeUrl:
          order.qrCodeUrl,

        activationCode:
          order.activationCode,

        smdpAddress:
          order.smdpAddress,

        smdpStatus:
          order.smdpStatus,

        supplierEsimStatus:
          order.supplierEsimStatus,

        apn:
          order.apn,

        lastError:
          order.lastError,
      }}
    />
  );
}