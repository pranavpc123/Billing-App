import { prisma } from "@/lib/prisma";

const INVOICE_INCLUDE = {
  customer: true,
  staff: true,
  paymentMethod: true,
  visitMode: true,
  items: true,
} as const;

export async function getInvoiceForDisplay(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: INVOICE_INCLUDE });
  if (!invoice) return null;

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });

  return { invoice, settings };
}

/**
 * Public lookup for the no-login customer-facing invoice page. The token is
 * the real security boundary (unguessable, unique); the invoice number in
 * the URL is only cross-checked for consistency, not itself a secret.
 */
export async function getInvoiceForDisplayByToken(invoiceNumber: string, token: string) {
  const invoice = await prisma.invoice.findUnique({ where: { publicToken: token }, include: INVOICE_INCLUDE });
  if (!invoice || invoice.invoiceNumber !== invoiceNumber) return null;

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });

  return { invoice, settings };
}

export type InvoiceForDisplay = NonNullable<Awaited<ReturnType<typeof getInvoiceForDisplay>>>;
