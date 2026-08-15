import { notFound } from "next/navigation";
import { getInvoiceForDisplayByToken } from "@/lib/invoice-data";
import { getPublicBaseUrl } from "@/lib/public-url";
import { InvoiceView } from "@/components/invoice/InvoiceView";
import { PublicDocumentActions } from "@/components/shared/PublicDocumentActions";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ number: string; token: string }>;
}) {
  const { number, token } = await params;
  const data = await getInvoiceForDisplayByToken(number, token);
  if (!data) notFound();

  const baseUrl = await getPublicBaseUrl(data.settings.publicBaseUrl);

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <PublicDocumentActions
          pdfUrl={`/invoice/${number}/${token}/pdf`}
          filename={`${number}.pdf`}
          pageUrl={`${baseUrl}/invoice/${number}/${token}`}
          label={`Invoice ${number}`}
        />
        <InvoiceView invoice={data.invoice} settings={data.settings} />
        <p className="text-center text-xs text-navy-300 print:hidden">
          Thank you for choosing {data.settings.businessName}.
        </p>
      </div>
    </div>
  );
}
