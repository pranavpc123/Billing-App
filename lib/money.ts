const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

const plainNumberFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** No currency symbol/prefix — for templates that supply their own symbol (e.g. "₹{{grand_total}}"). */
export function formatNumber(amount: number): string {
  return plainNumberFormatter.format(amount);
}

/**
 * react-pdf's default (Helvetica) font has no ₹ glyph, so it renders as a
 * broken superscript character. Used only in PDF documents; on-screen HTML
 * uses formatMoney(), which renders ₹ fine via the browser's system font.
 */
export function formatMoneyPdf(amount: number): string {
  return `Rs. ${plainNumberFormatter.format(amount)}`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
