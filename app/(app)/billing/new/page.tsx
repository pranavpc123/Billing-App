import { prisma } from "@/lib/prisma";
import { BillingForm } from "@/components/billing/BillingForm";
import { parseBillingFieldConfig } from "@/lib/billing-fields";

export default async function NewBillPage() {
  const [categories, paymentMethods, visitModes, customFieldDefs, settings] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        servicesOrProducts: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.paymentMethod.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.visitMode.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.customFieldDef.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } }),
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

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-navy-500">New Bill</h1>
      <p className="mt-1 text-sm text-navy-300">
        Add customer details and services or products, then complete the sale.
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
          taxEnabled={settings.taxEnabled}
          taxRatePercent={settings.taxRatePercent}
          taxLabel={settings.taxLabel}
          discountDefaultType={settings.discountDefaultType}
          discountDefaultValue={settings.discountDefaultValue}
          defaultCountryCode={settings.whatsappDefaultCountryCode}
        />
      </div>
    </div>
  );
}
