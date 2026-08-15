import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { updateAppointmentsEnabled, updateBusinessDetails } from "./_actions";
import { GoogleSheetsCard } from "./GoogleSheetsCard";
import { WhatsAppTemplateCard } from "./WhatsAppTemplateCard";

export default async function SettingsPage() {
  const session = await auth();
  if (!can(session?.user.role, "settings.edit")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view Settings.
      </p>
    );
  }

  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-500">Settings</h1>
        <p className="mt-1 text-sm text-navy-300">Business identity and invoice branding.</p>
      </div>

      <SettingsNav active="business" />

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateBusinessDetails} className="space-y-4">
            <div className="flex items-center gap-4">
              {settings.logoUrl && (
                <Image src={settings.logoUrl} alt="" width={64} height={64} className="rounded-xl" />
              )}
              <Field label="Logo">
                <input type="file" name="logo" accept="image/*" className="text-sm" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Business Name" required>
                <Input name="businessName" defaultValue={settings.businessName} required />
              </Field>
              <Field label="Tagline">
                <Input name="tagline" defaultValue={settings.tagline ?? ""} />
              </Field>
              <Field label="Phone Number">
                <Input name="phoneNumber" defaultValue={settings.phoneNumber ?? ""} />
              </Field>
              <Field label="WhatsApp Number" hint="Used for invoice/appointment WhatsApp links">
                <Input name="whatsappNumber" defaultValue={settings.whatsappNumber} />
              </Field>
              <Field label="Email">
                <Input type="email" name="email" defaultValue={settings.email ?? ""} />
              </Field>
            </div>
            <Field label="Address">
              <Textarea name="address" rows={2} defaultValue={settings.address ?? ""} />
            </Field>
            <Field label="Invoice Footer Message">
              <Input name="invoiceFooterText" defaultValue={settings.invoiceFooterText ?? ""} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-navy-400">
              <input
                type="checkbox"
                name="showPaymentSeal"
                defaultChecked={settings.showPaymentSeal}
              />
              Show a &quot;Payment Received&quot; seal on invoices
            </label>
            <Button type="submit">Save Business Details</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointments Module</CardTitle>
        </CardHeader>
        <CardBody>
          <form
            action={async () => {
              "use server";
              await updateAppointmentsEnabled(!settings.appointmentsEnabled);
            }}
            className="flex items-center justify-between"
          >
            <p className="text-sm text-navy-400">
              {settings.appointmentsEnabled
                ? "Appointments are enabled and visible in the sidebar."
                : "Appointments are disabled and hidden from staff."}
            </p>
            <Button type="submit" variant="secondary">
              {settings.appointmentsEnabled ? "Disable" : "Enable"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <GoogleSheetsCard
        enabled={settings.googleSheetsEnabled}
        spreadsheetId={settings.googleSheetsSpreadsheetId}
      />

      <WhatsAppTemplateCard
        defaultCountryCode={settings.whatsappDefaultCountryCode}
        publicBaseUrl={settings.publicBaseUrl}
        invoiceMessageTemplate={settings.whatsappInvoiceMessageTemplate}
        quoteMessageTemplate={settings.whatsappQuoteMessageTemplate}
      />
    </div>
  );
}
