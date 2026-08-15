"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

async function requireCatalogEdit() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "catalog.edit")) {
    throw new Error("Not authorized.");
  }
}

export async function createCategory(formData: FormData) {
  await requireCatalogEdit();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.category.upsert({
    where: { name },
    update: { active: true },
    create: { name },
  });
  revalidatePath("/catalog");
}

export async function toggleCategoryActive(categoryId: string, active: boolean) {
  await requireCatalogEdit();
  await prisma.category.update({ where: { id: categoryId }, data: { active } });
  revalidatePath("/catalog");
}

export async function createServiceProduct(formData: FormData) {
  await requireCatalogEdit();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const type = String(formData.get("type") ?? "SERVICE");
  const defaultPrice = Number(formData.get("defaultPrice") ?? 0) || 0;
  if (!name || !categoryId) return;
  await prisma.serviceProduct.create({ data: { name, categoryId, type, defaultPrice } });
  revalidatePath("/catalog");
  revalidatePath("/billing/new");
}

export async function updateServiceProduct(serviceProductId: string, formData: FormData) {
  await requireCatalogEdit();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const type = String(formData.get("type") ?? "SERVICE");
  const defaultPrice = Number(formData.get("defaultPrice") ?? 0) || 0;
  const active = formData.get("active") === "on";
  if (!name || !categoryId) return;
  await prisma.serviceProduct.update({
    where: { id: serviceProductId },
    data: { name, categoryId, type, defaultPrice, active },
  });
  revalidatePath("/catalog");
  revalidatePath("/billing/new");
}
