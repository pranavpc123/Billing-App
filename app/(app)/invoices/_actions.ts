"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { round2 } from "@/lib/money";
import type { LineItemInput } from "@/app/(app)/billing/new/_actions";

export async function updateAmountPaid(
  invoiceId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "invoices.viewAll")) {
    return { ok: false, error: "Not authorized." };
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { ok: false, error: "Invoice not found." };

  const raw = Number(formData.get("amountPaid"));
  if (!Number.isFinite(raw) || raw < 0) return { ok: false, error: "Enter a valid amount." };

  const amountPaid = round2(Math.min(raw, invoice.totalAmount));
  await prisma.invoice.update({ where: { id: invoiceId }, data: { amountPaid } });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type UpdateInvoiceResult = { ok: true } | { ok: false; error: string };

export async function updateInvoice(
  invoiceId: string,
  formData: FormData
): Promise<UpdateInvoiceResult> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "invoices.edit")) {
    return { ok: false, error: "You are not authorized to edit invoices." };
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true },
  });
  if (!existing) return { ok: false, error: "Invoice not found." };

  const customerName = String(formData.get("customerName") ?? "").trim();
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
  if (items.length === 0) return { ok: false, error: "Add at least one service or product." };
  if (!paymentMethodId) return { ok: false, error: "Select a payment method." };
  if (!visitModeId) return { ok: false, error: "Select a visit mode." };

  const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  const discountAmount = round2(
    discountType === "PERCENT"
      ? subtotal * (Math.min(discountValue, 100) / 100)
      : Math.min(Math.max(discountValue, 0), subtotal)
  );
  const taxRatePercent = existing.taxRatePercent;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = round2(taxableAmount * (taxRatePercent / 100));
  const totalAmount = round2(taxableAmount + taxAmount);

  const amountPaidRaw = Number(formData.get("amountPaid") ?? totalAmount);
  const amountPaid = round2(Math.min(Math.max(amountPaidRaw, 0), totalAmount));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: existing.customerId },
        data: {
          name: customerName,
          phone: contactNumber ?? undefined,
          email: email ?? undefined,
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          contactNumber,
          visitModeId,
          paymentMethodId,
          subtotal,
          discountType,
          discountValue,
          discountAmount,
          taxAmount,
          totalAmount,
          amountPaid,
          notes,
          customFields: customFieldsRaw,
          items: {
            deleteMany: {},
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
    });
  } catch (err) {
    console.error("updateInvoice failed", err);
    return { ok: false, error: "Could not update the invoice. Please try again." };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { ok: true };
}
