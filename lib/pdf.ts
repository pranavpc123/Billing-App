import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import path from "node:path";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { QuoteDocument } from "@/components/quote/QuoteDocument";
import type { InvoiceForDisplay } from "@/lib/invoice-data";
import type { QuoteForDisplay } from "@/lib/quote-data";

const LOGO_PATH = path.join(process.cwd(), "public", "logo-mark.png");

export async function renderInvoicePdf(data: InvoiceForDisplay): Promise<Buffer> {
  const props: Parameters<typeof InvoiceDocument>[0] = { ...data, logoPath: LOGO_PATH };
  // InvoiceDocument renders a react-pdf <Document>, but its own props aren't
  // DocumentProps — react-pdf's renderToBuffer types demand a literal <Document>
  // element, so the wrapper component needs this cast to satisfy that signature.
  const element = createElement(InvoiceDocument, props) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export async function renderQuotePdf(data: QuoteForDisplay): Promise<Buffer> {
  const props: Parameters<typeof QuoteDocument>[0] = { ...data, logoPath: LOGO_PATH };
  const element = createElement(QuoteDocument, props) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
