-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceNumber" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "sellingPriceUsd" REAL NOT NULL,
    "amountPhpCentavos" INTEGER NOT NULL,
    "usdToPhpRate" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "esimStatus" TEXT NOT NULL DEFAULT 'NOT_ORDERED',
    "paymongoSessionId" TEXT,
    "paymongoPaymentId" TEXT,
    "paymongoEventId" TEXT,
    "paymentMethod" TEXT,
    "paidAt" DATETIME,
    "esimOrderId" TEXT,
    "esimTransactionId" TEXT,
    "iccid" TEXT,
    "qrCode" TEXT,
    "qrCodeUrl" TEXT,
    "activationCode" TEXT,
    "smdpAddress" TEXT,
    "esimRawResponse" TEXT,
    "esimIssuedAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "emailAttempts" INTEGER NOT NULL DEFAULT 0,
    "processingAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "lastError" TEXT,
    "webhookReceivedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Order" ("amountPhpCentavos", "createdAt", "customerEmail", "customerName", "customerPhone", "id", "packageCode", "paymongoPaymentId", "paymongoSessionId", "planName", "referenceNumber", "sellingPriceUsd", "status", "updatedAt", "usdToPhpRate") SELECT "amountPhpCentavos", "createdAt", "customerEmail", "customerName", "customerPhone", "id", "packageCode", "paymongoPaymentId", "paymongoSessionId", "planName", "referenceNumber", "sellingPriceUsd", "status", "updatedAt", "usdToPhpRate" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_referenceNumber_key" ON "Order"("referenceNumber");
CREATE UNIQUE INDEX "Order_paymongoSessionId_key" ON "Order"("paymongoSessionId");
CREATE UNIQUE INDEX "Order_paymongoPaymentId_key" ON "Order"("paymongoPaymentId");
CREATE UNIQUE INDEX "Order_paymongoEventId_key" ON "Order"("paymongoEventId");
CREATE UNIQUE INDEX "Order_esimOrderId_key" ON "Order"("esimOrderId");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX "Order_packageCode_idx" ON "Order"("packageCode");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_esimStatus_idx" ON "Order"("esimStatus");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
