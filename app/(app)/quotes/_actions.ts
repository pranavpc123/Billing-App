"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { nextQuoteNumber } from "@/lib/quote-number";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { round2 } from "@/lib/money";
import { syncQuoteToSheet } from "@/lib/google-sheets";
import { generatePublicToken } from "@/lib/token";
import { revalidatePath } from "next/cache";

export type LineItemInput = {
  serviceProductId: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
};

export type CreateQuoteResult = { ok: true; quoteId: string } | { ok: false; error: string };

export async function createQuote(formData: FormData): Promise<CreateQuoteResult> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "billing.create")) {
    return { ok: false, error: "You are not authorized to create quotes." };
  }

  const customerName = String(formData.get("customerName") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discountType = String(formData.get("discountType") ?? "FLAT");
  const discountValue = Number(formData.get("discountValue") ?? 0) || 0;

  let items: LineItemInput[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, error: "Could not read line items." };
  }

  if (!customerName) return { ok: false, error: "Customer name is required." };
  if (!whatsapp) return { ok: false, error: "WhatsApp number is required." };
  if (items.length === 0) return { ok: false, error: "Add at least one service or product." };

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });

  const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  const discountAmount = round2(
    discountType === "PERCENT"
      ? subtotal * (Math.min(discountValue, 100) / 100)
      : Math.min(Math.max(discountValue, 0), subtotal)
  );
  const taxRatePercent = settings.taxEnabled ? settings.taxRatePercent : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = round2(taxableAmount * (taxRatePercent / 100));
  const totalAmount = round2(taxableAmount + taxAmount);

  try {
    const existingCustomer = await prisma.customer.findUnique({ where: { whatsapp } });

    const { quoteId, quoteNumber, createdAt } = await prisma.$transaction(async (tx) => {
      const quoteNumber = await nextQuoteNumber(tx);
      const quote = await tx.quote.create({
        data: {
          quoteNumber,
          publicToken: generatePublicToken(),
          customerId: existingCustomer?.id,
          customerName,
          whatsapp,
          contactNumber,
          subtotal,
          discountType,
          discountValue,
          discountAmount,
          taxRatePercent,
          taxAmount,
          totalAmount,
          notes,
          staffId: session.user.id,
          items: {
            create: items.map((i) => ({
              serviceProductId: i.serviceProductId || null,
              nameSnapshot: i.name,
              categorySnapshot: i.category ?? null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: round2(i.quantity * i.unitPrice),
            })),
          },
        },
      });
      return { quoteId: quote.id, quoteNumber: quote.quoteNumber, createdAt: quote.createdAt };
    });

    if (settings.googleSheetsEnabled && settings.googleSheetsSpreadsheetId) {
      const spreadsheetId = settings.googleSheetsSpreadsheetId;
      after(() =>
        syncQuoteToSheet(spreadsheetId, {
          quoteNumber,
          createdAt,
          customerName,
          whatsapp,
          items: items.map((i) => `${i.name} x${i.quantity}`).join(", "),
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          status: "DRAFT",
          staffName: session.user.name ?? session.user.email ?? "",
        })
      );
    }

    return { ok: true, quoteId };
  } catch (err) {
    console.error("createQuote failed", err);
    return { ok: false, error: "Could not save the quote. Please try again." };
  }
}

export async function updateQuoteStatus(
  quoteId: string,
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED"
) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "billing.create")) {
    throw new Error("Not authorized.");
  }
  await prisma.quote.update({ where: { id: quoteId }, data: { status } });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export type ConvertQuoteResult = { ok: true; invoiceId: string } | { ok: false; error: string };

export async function convertQuoteToInvoice(
  quoteId: string,
  formData: FormData
): Promise<ConvertQuoteResult> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "billing.create")) {
    return { ok: false, error: "You are not authorized to convert quotes." };
  }

  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const visitModeId = String(formData.get("visitModeId") ?? "");
  if (!paymentMethodId) return { ok: false, error: "Select a payment method." };
  if (!visitModeId) return { ok: false, error: "Select a visit mode." };

  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote) return { ok: false, error: "Quote not found." };
  if (quote.status === "CONVERTED") return { ok: false, error: "This quote is already converted." };

  const amountPaidRaw = Number(formData.get("amountPaid") ?? quote.totalAmount);
  const amountPaid = round2(Math.min(Math.max(amountPaidRaw, 0), quote.totalAmount));

  try {
    const invoiceId = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { whatsapp: quote.whatsapp },
        update: { name: quote.customerName, phone: quote.contactNumber ?? undefined },
        create: { name: quote.customerName, whatsapp: quote.whatsapp, phone: quote.contactNumber },
      });

      const invoiceNumber = await nextInvoiceNumber(tx);

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          publicToken: generatePublicToken(),
          customerId: customer.id,
          contactNumber: quote.contactNumber,
          visitModeId,
          paymentMethodId,
          subtotal: quote.subtotal,
          discountType: quote.discountType,
          discountValue: quote.discountValue,
          discountAmount: quote.discountAmount,
          taxRatePercent: quote.taxRatePercent,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          amountPaid,
          notes: quote.notes,
          staffId: session.user.id,
          items: {
            create: quote.items.map((i) => ({
              serviceProductId: i.serviceProductId,
              nameSnapshot: i.nameSnapshot,
              categorySnapshot: i.categorySnapshot,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
            })),
          },
        },
      });

      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "CONVERTED", convertedInvoiceId: invoice.id },
      });

      return invoice.id;
    });

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    return { ok: true, invoiceId };
  } catch (err) {
    console.error("convertQuoteToInvoice failed", err);
    return { ok: false, error: "Could not convert the quote. Please try again." };
  }
}
