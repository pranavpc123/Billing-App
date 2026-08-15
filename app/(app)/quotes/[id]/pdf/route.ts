import { NextResponse } from "next/server";
import { getQuoteForDisplay } from "@/lib/quote-data";
import { renderQuotePdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getQuoteForDisplay(id);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const buffer = await renderQuotePdf(data);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.quote.quoteNumber}.pdf"`,
    },
  });
}
