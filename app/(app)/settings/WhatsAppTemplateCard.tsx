import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COUNTRY_CODES } from "@/lib/countries";
import { updateWhatsAppTemplateSettings } from "./_actions";

export function WhatsAppTemplateCard({
  defaultCountryCode,
  publicBaseUrl,
  invoiceMessageTemplate,
  quoteMessageTemplate,
}: {
  defaultCountryCode: string;
  publicBaseUrl: string | null;
  invoiceMessageTemplate: string;
  quoteMessageTemplate: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Sharing</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-navy-400">
          &quot;Send on WhatsApp&quot; opens a WhatsApp chat with the message below pre-filled — staff
          always review and press Send manually inside WhatsApp. No API, no auto-send.
        </p>

        <form action={updateWhatsAppTemplateSettings} className="space-y-4">
          <Field label="Default Country Code" hint="Preselected on the billing/quote screens">
            <select
              name="whatsappDefaultCountryCode"
              defaultValue={defaultCountryCode}
              className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base text-navy-500 focus:border-gold-600 focus:outline focus:outline-2 focus:outline-gold-200"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Public Base URL"
            hint="This app runs on one PC by default — a plain localhost link won't open on a customer's phone. Set this to an address that actually reaches this machine (e.g. its LAN IP like http://192.168.1.5:3000, a tunnel URL, or a real domain if hosted). Leave blank to use whatever address staff are currently browsing from."
          >
            <Input name="publicBaseUrl" defaultValue={publicBaseUrl ?? ""} placeholder="http://192.168.1.5:3000" />
          </Field>

          <Field
            label="Invoice WhatsApp Message"
            hint="Variables: {{customer_name}} {{invoice_number}} {{invoice_date}} {{subtotal}} {{discount}} {{tax}} {{grand_total}} {{payment_status}} {{invoice_url}} {{business_name}} {{business_phone}}"
          >
            <Textarea name="whatsappInvoiceMessageTemplate" rows={8} defaultValue={invoiceMessageTemplate} />
          </Field>

          <Field
            label="Quote WhatsApp Message"
            hint="Variables: {{customer_name}} {{quote_number}} {{quote_date}} {{subtotal}} {{discount}} {{tax}} {{grand_total}} {{quote_url}} {{business_name}} {{business_phone}}"
          >
            <Textarea name="whatsappQuoteMessageTemplate" rows={8} defaultValue={quoteMessageTemplate} />
          </Field>

          <Button type="submit" variant="secondary">
            Save WhatsApp Settings
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
