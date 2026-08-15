"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { CORE_BILLING_FIELDS } from "@/lib/billing-fields";
import { sendTestRow } from "@/lib/google-sheets";

async function requireSettingsEdit() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "settings.edit")) {
    throw new Error("Not authorized.");
  }
}

export async function updateBusinessDetails(formData: FormData) {
  await requireSettingsEdit();

  const data: Record<string, string> = {};
  for (const key of [
    "businessName",
    "tagline",
    "address",
    "phoneNumber",
    "whatsappNumber",
    "email",
    "invoiceFooterText",
  ]) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) data[key] = value;
  }

  // Vercel's filesystem is read-only outside /tmp, and /tmp doesn't persist
  // across invocations — logo uploads only work on a real, writable disk
  // (i.e. local/self-hosted). The Settings UI hides the file input on
  // Vercel too; this is the server-side half of that same guard.
  const logo = formData.get("logo");
  if (!process.env.VERCEL && logo instanceof File && logo.size > 0) {
    const ext = logo.name.split(".").pop() || "png";
    const filename = `logo-${Date.now()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await logo.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);
    data.logoUrl = `/uploads/${filename}`;
  }

  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: { ...data, showPaymentSeal: formData.get("showPaymentSeal") === "on" },
  });
  revalidatePath("/settings");
  revalidatePath("/invoices");
}

export async function updateAppointmentsEnabled(enabled: boolean) {
  await requireSettingsEdit();
  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: { appointmentsEnabled: enabled },
  });
  revalidatePath("/", "layout");
}

export async function updateBillingSettings(formData: FormData) {
  await requireSettingsEdit();

  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: {
      invoicePrefix: String(formData.get("invoicePrefix") ?? "DL"),
      invoiceNumberPadding: Number(formData.get("invoiceNumberPadding") ?? 4) || 4,
      taxEnabled: formData.get("taxEnabled") === "on",
      taxRatePercent: Number(formData.get("taxRatePercent") ?? 0) || 0,
      taxLabel: String(formData.get("taxLabel") ?? "GST"),
      discountDefaultType: String(formData.get("discountDefaultType") ?? "FLAT"),
      discountDefaultValue: Number(formData.get("discountDefaultValue") ?? 0) || 0,
    },
  });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function updateBillingFieldConfig(formData: FormData) {
  await requireSettingsEdit();

  const config: Record<string, { required: boolean; visible: boolean }> = {};
  for (const field of CORE_BILLING_FIELDS) {
    const visible = formData.get(`visible_${field.key}`) === "on";
    const required = field.alwaysRequired || formData.get(`required_${field.key}`) === "on";
    config[field.key] = { required, visible: field.alwaysRequired ? true : visible };
  }

  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: { billingFieldConfig: JSON.stringify(config) },
  });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function createPaymentMethod(formData: FormData) {
  await requireSettingsEdit();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.paymentMethod.upsert({
    where: { name },
    update: { active: true },
    create: { name },
  });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function togglePaymentMethodActive(id: string, active: boolean) {
  await requireSettingsEdit();
  await prisma.paymentMethod.update({ where: { id }, data: { active } });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function createVisitMode(formData: FormData) {
  await requireSettingsEdit();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.visitMode.upsert({
    where: { name },
    update: { active: true },
    create: { name },
  });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function toggleVisitModeActive(id: string, active: boolean) {
  await requireSettingsEdit();
  await prisma.visitMode.update({ where: { id }, data: { active } });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function createCustomField(formData: FormData) {
  await requireSettingsEdit();
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "TEXT") as "TEXT" | "NUMBER" | "SELECT";
  const required = formData.get("required") === "on";
  const optionsRaw = String(formData.get("options") ?? "").trim();
  if (!label) return;

  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const options = type === "SELECT" && optionsRaw
    ? JSON.stringify(optionsRaw.split(",").map((o) => o.trim()).filter(Boolean))
    : null;

  await prisma.customFieldDef.create({ data: { key, label, type, required, options } });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function toggleCustomFieldActive(id: string, active: boolean) {
  await requireSettingsEdit();
  await prisma.customFieldDef.update({ where: { id }, data: { active } });
  revalidatePath("/settings/billing");
  revalidatePath("/billing/new");
}

export async function updateGoogleSheetsSettings(formData: FormData) {
  await requireSettingsEdit();

  const googleSheetsEnabled = formData.get("googleSheetsEnabled") === "on";
  const googleSheetsSpreadsheetId = String(formData.get("googleSheetsSpreadsheetId") ?? "").trim() || null;

  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: { googleSheetsEnabled, googleSheetsSpreadsheetId },
  });
  revalidatePath("/settings");
}

export async function sendGoogleSheetsTestRow(): Promise<{ ok: boolean; error?: string }> {
  await requireSettingsEdit();

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });
  if (!settings.googleSheetsSpreadsheetId) {
    return { ok: false, error: "Enter a Spreadsheet ID and save first." };
  }
  return sendTestRow(settings.googleSheetsSpreadsheetId);
}

export async function updateWhatsAppTemplateSettings(formData: FormData) {
  await requireSettingsEdit();

  await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: {
      whatsappDefaultCountryCode:
        String(formData.get("whatsappDefaultCountryCode") ?? "").trim() || "91",
      publicBaseUrl: String(formData.get("publicBaseUrl") ?? "").trim() || null,
      whatsappInvoiceMessageTemplate: String(formData.get("whatsappInvoiceMessageTemplate") ?? "").trim(),
      whatsappQuoteMessageTemplate: String(formData.get("whatsappQuoteMessageTemplate") ?? "").trim(),
    },
  });
  revalidatePath("/settings");
}
