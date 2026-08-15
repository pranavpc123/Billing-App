/**
 * Click-to-chat only: opens WhatsApp to a specific number, optionally with a
 * prefilled message. There is no automated sending and no way to attach a
 * file via this link — staff must manually attach a downloaded PDF inside
 * the chat that opens.
 */
export function buildWaLink(rawNumber: string, message?: string): string {
  const digits = rawNumber.replace(/[^\d]/g, "");
  if (!message) return `https://wa.me/${digits}`;
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digits}?${params.toString()}`;
}
