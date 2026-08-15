import { notFound } from "next/navigation";
import { getQuoteForDisplayByToken } from "@/lib/quote-data";
import { getPublicBaseUrl } from "@/lib/public-url";
import { QuoteView } from "@/components/quote/QuoteView";
import { PublicDocumentActions } from "@/components/shared/PublicDocumentActions";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ number: string; token: string }>;
}) {
  const { number, token } = await params;
  const data = await getQuoteForDisplayByToken(number, token);
  if (!data) notFound();

  const baseUrl = await getPublicBaseUrl(data.settings.publicBaseUrl);

  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <PublicDocumentActions
          pdfUrl={`/quote/${number}/${token}/pdf`}
          filename={`${number}.pdf`}
          pageUrl={`${baseUrl}/quote/${number}/${token}`}
          label={`Quote ${number}`}
        />
        <QuoteView quote={data.quote} settings={data.settings} />
        <p className="text-center text-xs text-navy-300 print:hidden">
          Thank you for choosing {data.settings.businessName}.
        </p>
      </div>
    </div>
  );
}
