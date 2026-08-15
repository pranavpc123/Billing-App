import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInvoiceForDisplay } from "@/lib/invoice-data";
import { getPublicBaseUrl } from "@/lib/public-url";
import { renderTemplate } from "@/lib/template";
import { formatNumber } from "@/lib/money";
import { getPaymentStatus, PAYMENT_STATUS_LABEL } from "@/lib/payment-status";
import { InvoiceView } from "@/components/invoice/InvoiceView";
import { InvoiceActions } from "@/components/invoice/InvoiceActions";
import { RecordPaymentForm } from "@/components/invoice/RecordPaymentForm";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const data = await getInvoiceForDisplay(id);
  if (!data) notFound();

  const isOwnInvoice = data.invoice.staffId === session?.user.id;
  const canViewAll = session?.user.role === "ADMIN" || session?.user.role === "MANAGER";
  if (!canViewAll && !isOwnInvoice) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view this invoice.
      </p>
    );
  }

  const { invoice, settings } = data;
  const baseUrl = await getPublicBaseUrl(settings.publicBaseUrl);
  const publicUrl = `${baseUrl}/invoice/${invoice.invoiceNumber}/${invoice.publicToken}`;
  const paymentStatus = getPaymentStatus(invoice.totalAmount, invoice.amountPaid);

  const whatsappMessage = renderTemplate(settings.whatsappInvoiceMessageTemplate, {
    customer_name: invoice.customer.name,
    invoice_number: invoice.invoiceNumber,
    invoice_date: new Date(invoice.createdAt).toLocaleDateString("en-IN"),
    subtotal: formatNumber(invoice.subtotal),
    discount: formatNumber(invoice.discountAmount),
    tax: formatNumber(invoice.taxAmount),
    grand_total: formatNumber(invoice.totalAmount),
    payment_status: PAYMENT_STATUS_LABEL[paymentStatus],
    invoice_url: publicUrl,
    business_name: settings.businessName,
    business_phone: settings.phoneNumber ?? settings.whatsappNumber,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-serif text-2xl font-semibold text-navy-500">
          Invoice {invoice.invoiceNumber}
        </h1>
      </div>
      <InvoiceActions
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        whatsapp={invoice.customer.whatsapp}
        whatsappMessage={whatsappMessage}
        publicUrl={publicUrl}
      />
      <InvoiceView invoice={invoice} settings={settings} />
      {canViewAll && paymentStatus !== "PAID" && (
        <div className="rounded-2xl border border-navy-100 bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-navy-500">Record Payment</h2>
          <p className="mt-1 text-sm text-navy-300">
            Update the amount paid when the customer clears more of the balance.
          </p>
          <div className="mt-4">
            <RecordPaymentForm
              invoiceId={invoice.id}
              totalAmount={invoice.totalAmount}
              currentAmountPaid={invoice.amountPaid}
            />
          </div>
        </div>
      )}
    </div>
  );
}
