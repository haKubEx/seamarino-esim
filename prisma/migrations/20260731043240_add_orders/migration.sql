-- CreateTable
CREATE TABLE "Order" (
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
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymongoSessionId" TEXT,
    "paymongoPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_referenceNumber_key" ON "Order"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymongoSessionId_key" ON "Order"("paymongoSessionId");
