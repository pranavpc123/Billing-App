import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { getReportDef } from "@/lib/reports/registry";
import { rowsToCsv, rowsToXlsx } from "@/lib/reports/export";
import { ReportDocument } from "@/components/invoice/ReportDocument";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!can(session?.user.role, "reports.view")) {
    return new NextResponse("Not authorized", { status: 403 });
  }

  const { type } = await params;
  const def = getReportDef(type);
  if (!def) return new NextResponse("Not found", { status: 404 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const start = from ? startOfDay(new Date(from)) : startOfDay(subDays(new Date(), 30));
  const end = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  const rows = await def.getRows(start, end);
  const filenameBase = `${def.key}-${start.toISOString().slice(0, 10)}-to-${end
    .toISOString()
    .slice(0, 10)}`;

  if (format === "csv") {
    const csv = rowsToCsv(def.columns, rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    const buffer = await rowsToXlsx(def.columns, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  const subtitle = `${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString("en-IN")}`;
  const props: Parameters<typeof ReportDocument>[0] = {
    title: def.label,
    subtitle,
    columns: def.columns,
    rows,
  };
  const element = createElement(ReportDocument, props) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
    },
  });
}
