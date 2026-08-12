Γùç injected env (14) from .env.local // tip: Γîÿ suppress logs { quiet: true }
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EsimStatus" AS ENUM ('NOT_ORDERED', 'PROCESSING', 'ISSUED', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('NOT_READY', 'PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_PHP');

-- CreateEnum
CREATE TYPE "CouponRedemptionStatus" AS ENUM ('RESERVED', 'REDEEMED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StoreCreditTransactionType" AS ENUM ('REFERRAL_REWARD', 'MANUAL_ADJUSTMENT', 'ORDER_PAYMENT', 'REFUND', 'EXPIRATION');

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "usdToPhpRate" DOUBLE PRECISION NOT NULL DEFAULT 58,
    "defaultMarkupPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "referralRewardPhpCentavos" INTEGER NOT NULL DEFAULT 5000,
    "referredRewardPhpCentavos" INTEGER NOT NULL DEFAULT 5000,
    "minimumReferralDataBytes" BIGINT NOT NULL DEFAULT 10737418240,
    "maximumWalletUsagePercent" INTEGER NOT NULL DEFAULT 100,
    "walletTopupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "supportEmail" TEXT NOT NULL DEFAULT 'support@seamarinoesim.com',
    "defaultApn" TEXT NOT NULL DEFAULT 'internet',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "referralCode" TEXT,
    "storeCreditPhpCentavos" INTEGER NOT NULL DEFAULT 0,
    "referredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "userId" TEXT,
    "packageCode" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "dataVolumeBytes" BIGINT,
    "selectedDays" INTEGER,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "sellingPriceUsd" DOUBLE PRECISION NOT NULL,
    "subtotalPhpCentavos" INTEGER,
    "discountPhpCentavos" INTEGER NOT NULL DEFAULT 0,
    "amountPhpCentavos" INTEGER NOT NULL,
    "usdToPhpRate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "storeCreditUsedPhpCentavos" INTEGER NOT NULL DEFAULT 0,
    "couponId" TEXT,
    "couponCodeSnapshot" TEXT,
    "couponNameSnapshot" TEXT,
    "couponDiscountTypeSnapshot" "CouponDiscountType",
    "couponDiscountValueSnapshot" DOUBLE PRECISION,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "esimStatus" "EsimStatus" NOT NULL DEFAULT 'NOT_ORDERED',
    "paymongoSessionId" TEXT,
    "paymongoPaymentId" TEXT,
    "paymongoEventId" TEXT,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "esimOrderId" TEXT,
    "esimTransactionId" TEXT,
    "esimTranNo" TEXT,
    "iccid" TEXT,
    "qrCode" TEXT,
    "qrCodeUrl" TEXT,
    "activationCode" TEXT,
    "smdpAddress" TEXT,
    "matchingId" TEXT,
    "smdpStatus" TEXT,
    "supplierEsimStatus" TEXT,
    "apn" TEXT,
    "esimRawResponse" TEXT,
    "esimIssuedAt" TIMESTAMP(3),
    "profileIssuedAt" TIMESTAMP(3),
    "profileLastCheckedAt" TIMESTAMP(3),
    "profileCheckAttempts" INTEGER NOT NULL DEFAULT 0,
    "profileSyncClaimedAt" TIMESTAMP(3),
    "profileSyncClaimId" TEXT,
    "profileSyncLeaseUntil" TIMESTAMP(3),
    "emailDeliveryStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'NOT_READY',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailIdempotencyKey" TEXT,
    "resendEmailId" TEXT,
    "emailClaimedAt" TIMESTAMP(3),
    "emailClaimId" TEXT,
    "emailLeaseUntil" TIMESTAMP(3),
    "emailLastAttemptAt" TIMESTAMP(3),
    "emailLastError" TEXT,
    "processingAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "webhookReceivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSetting" (
    "id" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "markupPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "customName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "CouponDiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maximumDiscountPhpCentavos" INTEGER,
    "minimumPurchasePhpCentavos" INTEGER NOT NULL DEFAULT 0,
    "minimumDataBytes" BIGINT,
    "maximumDataBytes" BIGINT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "applicablePackageCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "status" "CouponRedemptionStatus" NOT NULL DEFAULT 'RESERVED',
    "subtotalPhpCentavos" INTEGER NOT NULL,
    "discountPhpCentavos" INTEGER NOT NULL,
    "finalPhpCentavos" INTEGER NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationEndsAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "qualifyingOrderId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referrerRewardPhpCentavos" INTEGER NOT NULL DEFAULT 5000,
    "referredRewardPhpCentavos" INTEGER NOT NULL DEFAULT 5000,
    "qualifiedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreCreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StoreCreditTransactionType" NOT NULL,
    "amountPhpCentavos" INTEGER NOT NULL,
    "balanceBeforePhpCentavos" INTEGER NOT NULL,
    "balanceAfterPhpCentavos" INTEGER NOT NULL,
    "referralId" TEXT,
    "orderId" TEXT,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivityLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "description" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_referenceNumber_key" ON "Order"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymongoSessionId_key" ON "Order"("paymongoSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymongoPaymentId_key" ON "Order"("paymongoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymongoEventId_key" ON "Order"("paymongoEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_esimOrderId_key" ON "Order"("esimOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_esimTransactionId_key" ON "Order"("esimTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_esimTranNo_key" ON "Order"("esimTranNo");

-- CreateIndex
CREATE UNIQUE INDEX "Order_iccid_key" ON "Order"("iccid");

-- CreateIndex
CREATE UNIQUE INDEX "Order_emailIdempotencyKey_key" ON "Order"("emailIdempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_resendEmailId_key" ON "Order"("resendEmailId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- CreateIndex
CREATE INDEX "Order_packageCode_idx" ON "Order"("packageCode");

-- CreateIndex
CREATE INDEX "Order_dataVolumeBytes_idx" ON "Order"("dataVolumeBytes");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

-- CreateIndex
CREATE INDEX "Order_couponCodeSnapshot_idx" ON "Order"("couponCodeSnapshot");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_esimStatus_idx" ON "Order"("esimStatus");

-- CreateIndex
CREATE INDEX "Order_emailDeliveryStatus_idx" ON "Order"("emailDeliveryStatus");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_status_esimStatus_profileLastCheckedAt_idx" ON "Order"("paymentStatus", "status", "esimStatus", "profileLastCheckedAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_esimStatus_emailDeliveryStatus_emailLas_idx" ON "Order"("paymentStatus", "esimStatus", "emailDeliveryStatus", "emailLastAttemptAt");

-- CreateIndex
CREATE INDEX "Order_profileSyncLeaseUntil_idx" ON "Order"("profileSyncLeaseUntil");

-- CreateIndex
CREATE INDEX "Order_emailLeaseUntil_idx" ON "Order"("emailLeaseUntil");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanSetting_packageCode_key" ON "PlanSetting"("packageCode");

-- CreateIndex
CREATE INDEX "PlanSetting_enabled_idx" ON "PlanSetting"("enabled");

-- CreateIndex
CREATE INDEX "PlanSetting_featured_idx" ON "PlanSetting"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_enabled_idx" ON "Coupon"("enabled");

-- CreateIndex
CREATE INDEX "Coupon_startsAt_idx" ON "Coupon"("startsAt");

-- CreateIndex
CREATE INDEX "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");

-- CreateIndex
CREATE INDEX "Coupon_discountType_idx" ON "Coupon"("discountType");

-- CreateIndex
CREATE INDEX "Coupon_createdAt_idx" ON "Coupon"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_orderId_key" ON "CouponRedemption"("orderId");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_idx" ON "CouponRedemption"("couponId");

-- CreateIndex
CREATE INDEX "CouponRedemption_userId_idx" ON "CouponRedemption"("userId");

-- CreateIndex
CREATE INDEX "CouponRedemption_customerEmail_idx" ON "CouponRedemption"("customerEmail");

-- CreateIndex
CREATE INDEX "CouponRedemption_status_idx" ON "CouponRedemption"("status");

-- CreateIndex
CREATE INDEX "CouponRedemption_reservationEndsAt_idx" ON "CouponRedemption"("reservationEndsAt");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_status_idx" ON "CouponRedemption"("couponId", "status");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_customerEmail_status_idx" ON "CouponRedemption"("couponId", "customerEmail", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_qualifyingOrderId_key" ON "Referral"("qualifyingOrderId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_qualifyingOrderId_idx" ON "Referral"("qualifyingOrderId");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");

-- CreateIndex
CREATE INDEX "StoreCreditTransaction_userId_idx" ON "StoreCreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "StoreCreditTransaction_type_idx" ON "StoreCreditTransaction"("type");

-- CreateIndex
CREATE INDEX "StoreCreditTransaction_referralId_idx" ON "StoreCreditTransaction"("referralId");

-- CreateIndex
CREATE INDEX "StoreCreditTransaction_orderId_idx" ON "StoreCreditTransaction"("orderId");

-- CreateIndex
CREATE INDEX "StoreCreditTransaction_expiresAt_idx" ON "StoreCreditTransaction"("expiresAt");

-- CreateIndex
CREATE INDEX "StoreCreditTransaction_createdAt_idx" ON "StoreCreditTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "AdminActivityLog_adminId_idx" ON "AdminActivityLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminActivityLog_module_idx" ON "AdminActivityLog"("module");

-- CreateIndex
CREATE INDEX "AdminActivityLog_action_idx" ON "AdminActivityLog"("action");

-- CreateIndex
CREATE INDEX "AdminActivityLog_success_idx" ON "AdminActivityLog"("success");

-- CreateIndex
CREATE INDEX "AdminActivityLog_entityType_idx" ON "AdminActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "AdminActivityLog_entityId_idx" ON "AdminActivityLog"("entityId");

-- CreateIndex
CREATE INDEX "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_qualifyingOrderId_fkey" FOREIGN KEY ("qualifyingOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCreditTransaction" ADD CONSTRAINT "StoreCreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCreditTransaction" ADD CONSTRAINT "StoreCreditTransaction_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCreditTransaction" ADD CONSTRAINT "StoreCreditTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActivityLog" ADD CONSTRAINT "AdminActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

