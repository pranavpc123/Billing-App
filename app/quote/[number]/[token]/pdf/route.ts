import { NextResponse } from "next/server";
import { getQuoteForDisplayByToken } from "@/lib/quote-data";
import { renderQuotePdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string; token: string }> }
) {
  const { number, token } = await params;
  const data = await getQuoteForDisplayByToken(number, token);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const buffer = await renderQuotePdf(data);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.quote.quoteNumber}.pdf"`,
    },
  });
}
