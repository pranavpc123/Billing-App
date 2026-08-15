import { prisma } from "@/lib/prisma";
import { QuoteForm } from "@/components/quote/QuoteForm";

export default async function NewQuotePage() {
  const [categories, settings] = await Promise.all([
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
      <h1 className="font-serif text-2xl font-semibold text-navy-500">New Quote</h1>
      <p className="mt-1 text-sm text-navy-300">
        Prepare a price estimate for a customer — convert it to an invoice once they accept.
      </p>
      <div className="mt-6">
        <QuoteForm
          catalog={catalog}
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
