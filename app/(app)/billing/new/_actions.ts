"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { round2 } from "@/lib/money";
import { getPendingAmount } from "@/lib/payment-status";
import { syncInvoiceToSheet } from "@/lib/google-sheets";
import { generatePublicToken } from "@/lib/token";

export type LineItemInput = {
  serviceProductId: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
};

export type CustomerLookupResult = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
} | null;

export async function lookupCustomerByWhatsapp(whatsapp: string): Promise<CustomerLookupResult> {
  const session = await auth();
  if (!session?.user) return null;

  const trimmed = whatsapp.trim();
  if (!trimmed) return null;

  const customer = await prisma.customer.findUnique({ where: { whatsapp: trimmed } });
  if (!customer) return null;

  const agg = await prisma.invoice.aggregate({
    where: { customerId: customer.id },
    _sum: { totalAmount: true },
    _count: true,
    _max: { createdAt: true },
  });

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    totalSpent: agg._sum.totalAmount ?? 0,
    visitCount: agg._count,
    lastVisit: agg._max.createdAt ? agg._max.createdAt.toISOString() : null,
  };
}

export type CreateInvoiceResult = { ok: true; invoiceId: string } | { ok: false; error: string };

export async function createInvoice(formData: FormData): Promise<CreateInvoiceResult> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "billing.create")) {
    return { ok: false, error: "You are not authorized to create invoices." };
  }

  const customerName = String(formData.get("customerName") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const visitModeId = String(formData.get("visitModeId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discountType = String(formData.get("discountType") ?? "FLAT");
  const discountValue = Number(formData.get("discountValue") ?? 0) || 0;
  const customFieldsRaw = String(formData.get("customFields") ?? "{}");

  let items: LineItemInput[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, error: "Could not read line items." };
  }

  if (!customerName) return { ok: false, error: "Customer name is required." };
  if (!whatsapp) return { ok: false, error: "WhatsApp number is required." };
  if (items.length === 0) return { ok: false, error: "Add at least one service or product." };
  if (!paymentMethodId) return { ok: false, error: "Select a payment method." };
  if (!visitModeId) return { ok: false, error: "Select a visit mode." };

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

  const amountPaidRaw = Number(formData.get("amountPaid") ?? totalAmount);
  const amountPaid = round2(Math.min(Math.max(amountPaidRaw, 0), totalAmount));

  try {
    const { invoiceId, invoiceNumber, createdAt } = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { whatsapp },
        update: { name: customerName, phone: contactNumber ?? undefined, email: email ?? undefined },
        create: { name: customerName, whatsapp, phone: contactNumber, email },
      });

      const invoiceNumber = await nextInvoiceNumber(tx);

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          publicToken: generatePublicToken(),
          customerId: customer.id,
          contactNumber,
          visitModeId,
          paymentMethodId,
          subtotal,
          discountType,
          discountValue,
          discountAmount,
          taxRatePercent,
          taxAmount,
          totalAmount,
          amountPaid,
          notes,
          customFields: customFieldsRaw,
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

      return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, createdAt: invoice.createdAt };
    });

    if (settings.googleSheetsEnabled && settings.googleSheetsSpreadsheetId) {
      const spreadsheetId = settings.googleSheetsSpreadsheetId;
      const [paymentMethod, visitMode] = await Promise.all([
        prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } }),
        prisma.visitMode.findUnique({ where: { id: visitModeId } }),
      ]);
      after(() =>
        syncInvoiceToSheet(spreadsheetId, {
          invoiceNumber,
          createdAt,
          customerName,
          whatsapp,
          items: items.map((i) => `${i.name} x${i.quantity}`).join(", "),
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          amountPaid,
          pendingAmount: getPendingAmount(totalAmount, amountPaid),
          paymentMethod: paymentMethod?.name ?? "",
          visitMode: visitMode?.name ?? "",
          staffName: session.user.name ?? session.user.email ?? "",
        })
      );
    }

    return { ok: true, invoiceId };
  } catch (err) {
    console.error("createInvoice failed", err);
    return { ok: false, error: "Could not save the invoice. Please try again." };
  }
}
