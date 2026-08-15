-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "contactNumber" TEXT,
    "subtotal" REAL NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL DEFAULT 0,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "taxRatePercent" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "staffId" TEXT NOT NULL,
    "convertedInvoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "serviceProductId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "categorySnapshot" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "lineTotal" REAL NOT NULL,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_serviceProductId_fkey" FOREIGN KEY ("serviceProductId") REFERENCES "ServiceProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "businessName" TEXT NOT NULL DEFAULT 'DELSORA',
    "tagline" TEXT DEFAULT 'Designer Boutique & Makeover Studio',
    "whatsappNumber" TEXT NOT NULL DEFAULT '+918921549258',
    "phoneNumber" TEXT,
    "email" TEXT DEFAULT 'delsora2017boutique@gamil.com',
    "address" TEXT DEFAULT 'Edavanna, Wandoor Road, 676541',
    "logoUrl" TEXT DEFAULT '/logo-full.png',
    "logoMarkUrl" TEXT DEFAULT '/logo-mark.png',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'DL',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1,
    "invoiceNumberPadding" INTEGER NOT NULL DEFAULT 4,
    "invoiceFooterText" TEXT DEFAULT 'Thank you for shopping with DELSORA!',
    "showPaymentSeal" BOOLEAN NOT NULL DEFAULT false,
    "quotePrefix" TEXT NOT NULL DEFAULT 'QT',
    "quoteNextNumber" INTEGER NOT NULL DEFAULT 1,
    "quoteNumberPadding" INTEGER NOT NULL DEFAULT 4,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxRatePercent" REAL NOT NULL DEFAULT 0,
    "taxLabel" TEXT NOT NULL DEFAULT 'GST',
    "discountDefaultType" TEXT NOT NULL DEFAULT 'FLAT',
    "discountDefaultValue" REAL NOT NULL DEFAULT 0,
    "appointmentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "billingFieldConfig" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BusinessSettings" ("address", "appointmentsEnabled", "billingFieldConfig", "businessName", "discountDefaultType", "discountDefaultValue", "email", "id", "invoiceFooterText", "invoiceNextNumber", "invoiceNumberPadding", "invoicePrefix", "logoMarkUrl", "logoUrl", "phoneNumber", "showPaymentSeal", "tagline", "taxEnabled", "taxLabel", "taxRatePercent", "updatedAt", "whatsappNumber") SELECT "address", "appointmentsEnabled", "billingFieldConfig", "businessName", "discountDefaultType", "discountDefaultValue", "email", "id", "invoiceFooterText", "invoiceNextNumber", "invoiceNumberPadding", "invoicePrefix", "logoMarkUrl", "logoUrl", "phoneNumber", "showPaymentSeal", "tagline", "taxEnabled", "taxLabel", "taxRatePercent", "updatedAt", "whatsappNumber" FROM "BusinessSettings";
DROP TABLE "BusinessSettings";
ALTER TABLE "new_BusinessSettings" RENAME TO "BusinessSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_convertedInvoiceId_key" ON "Quote"("convertedInvoiceId");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_createdAt_idx" ON "Quote"("createdAt");

-- CreateIndex
CREATE INDEX "Quote_staffId_idx" ON "Quote"("staffId");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteItem_serviceProductId_idx" ON "QuoteItem"("serviceProductId");
