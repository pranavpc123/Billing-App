import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getInvoiceForDisplay } from "@/lib/invoice-data";
import { parseBillingFieldConfig } from "@/lib/billing-fields";
import { BillingForm } from "@/components/billing/BillingForm";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!can(session?.user.role, "invoices.edit")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to edit invoices.
      </p>
    );
  }

  const data = await getInvoiceForDisplay(id);
  if (!data) notFound();
  const { invoice, settings } = data;

  const [categories, paymentMethods, visitModes, customFieldDefs] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { servicesOrProducts: { where: { active: true }, orderBy: { name: "asc" } } },
    }),
    // Include inactive so the invoice's current selection still shows as an option.
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.visitMode.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.customFieldDef.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const catalog = categories.flatMap((c) =>
    c.servicesOrProducts.map((sp) => ({
      id: sp.id,
      name: sp.name,
      category: c.name,
      type: sp.type,
      defaultPrice: sp.defaultPrice,
    }))
  );

  let customFieldValues: Record<string, string> = {};
  try {
    customFieldValues = JSON.parse(invoice.customFields);
  } catch {
    customFieldValues = {};
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-navy-500">
        Edit Invoice {invoice.invoiceNumber}
      </h1>
      <p className="mt-1 text-sm text-navy-300">
        Update line items, discount, payment, or customer details, then save.
      </p>
      <div className="mt-6">
        <BillingForm
          catalog={catalog}
          paymentMethods={paymentMethods}
          visitModes={visitModes}
          customFieldDefs={customFieldDefs.map((f) => ({
            key: f.key,
            label: f.label,
            type: f.type,
            required: f.required,
            options: f.options ? (JSON.parse(f.options) as string[]) : [],
          }))}
          fieldConfig={parseBillingFieldConfig(settings.billingFieldConfig)}
          taxEnabled={invoice.taxRatePercent > 0}
          taxRatePercent={invoice.taxRatePercent}
          taxLabel={settings.taxLabel}
          discountDefaultType={invoice.discountType}
          discountDefaultValue={invoice.discountValue}
          defaultCountryCode={settings.whatsappDefaultCountryCode}
          editInvoice={{
            invoiceId: invoice.id,
            customerName: invoice.customer.name,
            whatsapp: invoice.customer.whatsapp,
            contactNumber: invoice.contactNumber ?? "",
            email: invoice.customer.email ?? "",
            notes: invoice.notes ?? "",
            items: invoice.items.map((it) => ({
              localId: it.id,
              serviceProductId: it.serviceProductId ?? "",
              name: it.nameSnapshot,
              category: it.categorySnapshot ?? "",
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
            discountType: invoice.discountType,
            discountValue: invoice.discountValue,
            paymentMethodId: invoice.paymentMethodId,
            visitModeId: invoice.visitModeId,
            customFieldValues,
            amountPaid: invoice.amountPaid,
          }}
        />
      </div>
    </div>
  );
}
