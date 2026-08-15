import { NextResponse } from "next/server";
import { getInvoiceForDisplay } from "@/lib/invoice-data";
import { renderInvoicePdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getInvoiceForDisplay(id);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const buffer = await renderInvoicePdf(data);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.invoice.invoiceNumber}.pdf"`,
    },
  });
}
