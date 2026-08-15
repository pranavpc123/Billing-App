import { Prisma } from "@/generated/prisma/client";

/**
 * Same concurrency-safe pattern as lib/invoice-number.ts, but for the
 * separate quote counter — quotes and invoices are different document
 * sequences (QT0001 vs DL0001).
 */
export async function nextQuoteNumber(tx: Prisma.TransactionClient): Promise<string> {
  const updated = await tx.businessSettings.update({
    where: { id: "singleton" },
    data: { quoteNextNumber: { increment: 1 } },
  });
  const n = updated.quoteNextNumber - 1;
  return `${updated.quotePrefix}${String(n).padStart(updated.quoteNumberPadding, "0")}`;
}
