import { prisma } from "@/lib/prisma";

const QUOTE_INCLUDE = { staff: true, items: true } as const;

export async function getQuoteForDisplay(id: string) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: QUOTE_INCLUDE });
  if (!quote) return null;

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });

  return { quote, settings };
}

/** Public lookup for the no-login customer-facing quote page — see the matching note in lib/invoice-data.ts. */
export async function getQuoteForDisplayByToken(quoteNumber: string, token: string) {
  const quote = await prisma.quote.findUnique({ where: { publicToken: token }, include: QUOTE_INCLUDE });
  if (!quote || quote.quoteNumber !== quoteNumber) return null;

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });

  return { quote, settings };
}

export type QuoteForDisplay = NonNullable<Awaited<ReturnType<typeof getQuoteForDisplay>>>;
