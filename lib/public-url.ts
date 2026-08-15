import { headers } from "next/headers";

/**
 * Base URL for public invoice/quote links. Prefers the admin-configured
 * override (Settings) since this app runs on a single local PC by default —
 * a bare request origin of "localhost" would only ever open on that same
 * PC, never on a customer's phone. Falls back to the current request's host
 * header, which works automatically if staff already access the app via a
 * LAN IP rather than localhost.
 */
export async function getPublicBaseUrl(publicBaseUrlSetting?: string | null): Promise<string> {
  if (publicBaseUrlSetting) return publicBaseUrlSetting.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
