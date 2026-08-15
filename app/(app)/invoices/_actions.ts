"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { round2 } from "@/lib/money";

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
