"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

async function requireUsersEdit() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "users.edit")) {
    throw new Error("Not authorized.");
  }
  return session;
}

export async function createUser(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireUsersEdit();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "STAFF") as "ADMIN" | "MANAGER" | "STAFF";

  if (!name || !email || password.length < 6) {
    return { ok: false, error: "Name, email, and a password (6+ chars) are required." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "A user with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role } });
  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserActive(userId: string, active: boolean) {
  await requireUsersEdit();
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/users");
}

export async function updateUserRole(userId: string, role: "ADMIN" | "MANAGER" | "STAFF") {
  await requireUsersEdit();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");
}
