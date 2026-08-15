import { google } from "googleapis";

/**
 * Best-effort sync to a Google Sheet — the app's own database stays the
 * source of truth. Every exported function here must never throw: a Sheets
 * outage or misconfiguration must not block billing. Errors are logged only.
 */

function getCredentials() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  return { email, key };
}

function getSheetsClient() {
  const credentials = getCredentials();
  if (!credentials) return null;

  const auth = new google.auth.JWT({
    email: credentials.email,
    key: credentials.key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function ensureSheetExists(
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
  tabName: string,
  headers: string[]
) {
  if (!sheets) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tabName);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
}

async function appendRow(
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  values: (string | number)[]
) {
  const sheets = getSheetsClient();
  if (!sheets) return;

  await ensureSheetExists(sheets, spreadsheetId, tabName, headers);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

const INVOICE_HEADERS = [
  "Invoice #",
  "Date",
  "Customer",
  "WhatsApp",
  "Items",
  "Subtotal",
  "Discount",
  "Tax",
  "Total",
  "Amount Paid",
  "Pending",
  "Payment Method",
  "Visit Mode",
  "Staff",
];

export async function syncInvoiceToSheet(
  spreadsheetId: string,
  invoice: {
    invoiceNumber: string;
    createdAt: Date;
    customerName: string;
    whatsapp: string;
    items: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    pendingAmount: number;
    paymentMethod: string;
    visitMode: string;
    staffName: string;
  }
) {
  try {
    await appendRow(spreadsheetId, "Invoices", INVOICE_HEADERS, [
      invoice.invoiceNumber,
      invoice.createdAt.toLocaleString("en-IN"),
      invoice.customerName,
      invoice.whatsapp,
      invoice.items,
      invoice.subtotal,
      invoice.discountAmount,
      invoice.taxAmount,
      invoice.totalAmount,
      invoice.amountPaid,
      invoice.pendingAmount,
      invoice.paymentMethod,
      invoice.visitMode,
      invoice.staffName,
    ]);
  } catch (err) {
    console.error("Google Sheets: failed to sync invoice", err);
  }
}

const QUOTE_HEADERS = [
  "Quote #",
  "Date",
  "Customer",
  "WhatsApp",
  "Items",
  "Subtotal",
  "Discount",
  "Tax",
  "Total",
  "Status",
  "Staff",
];

export async function syncQuoteToSheet(
  spreadsheetId: string,
  quote: {
    quoteNumber: string;
    createdAt: Date;
    customerName: string;
    whatsapp: string;
    items: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    staffName: string;
  }
) {
  try {
    await appendRow(spreadsheetId, "Quotes", QUOTE_HEADERS, [
      quote.quoteNumber,
      quote.createdAt.toLocaleString("en-IN"),
      quote.customerName,
      quote.whatsapp,
      quote.items,
      quote.subtotal,
      quote.discountAmount,
      quote.taxAmount,
      quote.totalAmount,
      quote.status,
      quote.staffName,
    ]);
  } catch (err) {
    console.error("Google Sheets: failed to sync quote", err);
  }
}

export async function sendTestRow(spreadsheetId: string): Promise<{ ok: boolean; error?: string }> {
  const credentials = getCredentials();
  if (!credentials) {
    return {
      ok: false,
      error: "GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY are not set in .env.",
    };
  }
  try {
    await appendRow(spreadsheetId, "Test", ["Sent At", "Message"], [
      new Date().toLocaleString("en-IN"),
      "Test row from DELSORA billing app settings.",
    ]);
    return { ok: true };
  } catch (err) {
    console.error("Google Sheets: test row failed", err);
    const message = err instanceof Error ? err.message : "Unknown error.";
    return { ok: false, error: message };
  }
}
