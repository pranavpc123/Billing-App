import { stringify } from "csv-stringify/sync";
import ExcelJS from "exceljs";
import type { ReportColumn, ReportRow } from "./registry";

export function rowsToCsv(columns: ReportColumn[], rows: ReportRow[]): string {
  return stringify(rows.map((r) => columns.map((c) => r[c.key])), {
    header: true,
    columns: columns.map((c) => c.label),
  });
}

export async function rowsToXlsx(columns: ReportColumn[], rows: ReportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: 20 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
