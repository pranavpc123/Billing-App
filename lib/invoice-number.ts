import { Prisma } from "@/generated/prisma/client";

/**
 * Atomically increments and formats the invoice number counter. Must be called
 * inside the same prisma.$transaction() that creates the Invoice row, so that
 * a failed invoice creation rolls the counter back too (no gaps, no collisions).
 */
export async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const updated = await tx.businessSettings.update({
    where: { id: "singleton" },
    data: { invoiceNextNumber: { increment: 1 } },
  });
  const n = updated.invoiceNextNumber - 1;
  return `${updated.invoicePrefix}${String(n).padStart(updated.invoiceNumberPadding, "0")}`;
}
