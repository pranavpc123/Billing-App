import crypto from "node:crypto";

/**
 * Generates an unguessable token for public invoice/quote links — this, not
 * the invoice/quote number in the URL, is the actual security boundary.
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
