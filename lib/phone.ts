/**
 * Combines a country code + a locally-entered number into the normalized,
 * country-coded digits-only form used everywhere a WhatsApp number is
 * stored (e.g. "9876543210" + "91" -> "919876543210"). Strips a single
 * leading 0, which is how a local number is often typed/pasted.
 */
export function normalizePhone(localNumber: string, countryCode: string): string {
  let digits = localNumber.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  const code = countryCode.replace(/\D/g, "");
  if (digits.startsWith(code) && digits.length > code.length + 6) return digits;
  return `${code}${digits}`;
}
