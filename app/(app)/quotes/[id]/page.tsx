import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getQuoteForDisplay } from "@/lib/quote-data";
import { getPublicBaseUrl } from "@/lib/public-url";
import { renderTemplate } from "@/lib/template";
import { formatNumber } from "@/lib/money";
import { QuoteView } from "@/components/quote/QuoteView";
import { QuoteActions } from "@/components/quote/QuoteActions";
import { ConvertToInvoiceForm } from "@/components/quote/ConvertToInvoiceForm";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const data = await getQuoteForDisplay(id);
  if (!data) notFound();

  const isOwnQuote = data.quote.staffId === session?.user.id;
  const canViewAll = can(session?.user.role, "quotes.viewAll");
  if (!canViewAll && !isOwnQuote) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view this quote.
      </p>
    );
  }

  const canConvert = can(session?.user.role, "billing.create") && data.quote.status !== "CONVERTED";

  const [paymentMethods, visitModes] = canConvert
    ? await Promise.all([
        prisma.paymentMethod.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
        prisma.visitMode.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      ])
    : [[], []];

  const { quote, settings } = data;
  const baseUrl = await getPublicBaseUrl(settings.publicBaseUrl);
  const publicUrl = `${baseUrl}/quote/${quote.quoteNumber}/${quote.publicToken}`;

  const whatsappMessage = renderTemplate(settings.whatsappQuoteMessageTemplate, {
    customer_name: quote.customerName,
    quote_number: quote.quoteNumber,
    quote_date: new Date(quote.createdAt).toLocaleDateString("en-IN"),
    subtotal: formatNumber(quote.subtotal),
    discount: formatNumber(quote.discountAmount),
    tax: formatNumber(quote.taxAmount),
    grand_total: formatNumber(quote.totalAmount),
    quote_url: publicUrl,
    business_name: settings.businessName,
    business_phone: settings.phoneNumber ?? settings.whatsappNumber,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-serif text-2xl font-semibold text-navy-500">
          Quote {quote.quoteNumber}
        </h1>
      </div>
      <QuoteActions
        quoteId={quote.id}
        quoteNumber={quote.quoteNumber}
        whatsapp={quote.whatsapp}
        whatsappMessage={whatsappMessage}
        publicUrl={publicUrl}
      />
      <QuoteView quote={quote} settings={settings} />

      {data.quote.status === "CONVERTED" && data.quote.convertedInvoiceId && (
        <div className="rounded-2xl border border-green-100 bg-green-50 p-6 print:hidden">
          <p className="text-sm font-medium text-green-800">
            This quote has been converted to an invoice.
          </p>
          <Link
            href={`/invoices/${data.quote.convertedInvoiceId}`}
            className="mt-1 inline-block text-sm font-medium text-green-700 underline"
          >
            View invoice →
          </Link>
        </div>
      )}

      {canConvert && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Convert to Invoice</CardTitle>
          </CardHeader>
          <CardBody>
            <ConvertToInvoiceForm
              quoteId={data.quote.id}
              totalAmount={data.quote.totalAmount}
              paymentMethods={paymentMethods}
              visitModes={visitModes}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
