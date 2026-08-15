/** Simple {{key}} substitution for admin-editable WhatsApp message templates. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (match, key) =>
    key in vars ? vars[key] : match
  );
}
