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
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxRatePercent" REAL NOT NULL DEFAULT 0,
    "taxLabel" TEXT NOT NULL DEFAULT 'GST',
    "discountDefaultType" TEXT NOT NULL DEFAULT 'FLAT',
    "discountDefaultValue" REAL NOT NULL DEFAULT 0,
    "appointmentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "billingFieldConfig" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BusinessSettings" ("address", "appointmentsEnabled", "billingFieldConfig", "businessName", "discountDefaultType", "discountDefaultValue", "email", "id", "invoiceFooterText", "invoiceNextNumber", "invoiceNumberPadding", "invoicePrefix", "logoMarkUrl", "logoUrl", "phoneNumber", "tagline", "taxEnabled", "taxLabel", "taxRatePercent", "updatedAt", "whatsappNumber") SELECT "address", "appointmentsEnabled", "billingFieldConfig", "businessName", "discountDefaultType", "discountDefaultValue", "email", "id", "invoiceFooterText", "invoiceNextNumber", "invoiceNumberPadding", "invoicePrefix", "logoMarkUrl", "logoUrl", "phoneNumber", "tagline", "taxEnabled", "taxLabel", "taxRatePercent", "updatedAt", "whatsappNumber" FROM "BusinessSettings";
DROP TABLE "BusinessSettings";
ALTER TABLE "new_BusinessSettings" RENAME TO "BusinessSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
