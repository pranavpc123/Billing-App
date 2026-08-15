"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function updateCustomer(customerId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "customers.edit")) {
    return { ok: false as const, error: "Not authorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { ok: false as const, error: "Name is required." };

  await prisma.customer.update({ where: { id: customerId }, data: { name, phone, notes } });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return { ok: true as const };
}
