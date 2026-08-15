import Image from "next/image";
import { formatMoney } from "@/lib/money";
import type { QuoteForDisplay } from "@/lib/quote-data";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-navy-50 text-navy-500",
  SENT: "bg-gold-100 text-gold-800",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-navy-50 text-navy-300",
  CONVERTED: "bg-green-100 text-green-800",
};

export function QuoteView({ quote, settings }: QuoteForDisplay) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-6 print:rounded-none print:border-0 print:p-0 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-navy-100 pb-6">
        <div className="flex items-center gap-3">
          {settings.logoUrl && (
            <Image src={settings.logoUrl} alt="" width={56} height={56} className="rounded-xl" />
          )}
          <div>
            <p className="font-serif text-xl font-semibold text-navy-500">{settings.businessName}</p>
            {settings.tagline && <p className="text-sm text-navy-300">{settings.tagline}</p>}
            {settings.address && <p className="mt-1 text-xs text-navy-300">{settings.address}</p>}
            {settings.phoneNumber && <p className="text-xs text-navy-300">{settings.phoneNumber}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="font-serif text-lg font-semibold text-navy-500">Quotation {quote.quoteNumber}</p>
          <p className="text-sm text-navy-300">
            {new Date(quote.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="mt-1 text-xs text-navy-300">Prepared by {quote.staff.name}</p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[quote.status]}`}
          >
            {quote.status}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-navy-300">Customer</p>
          <p className="mt-1 font-medium text-navy-500">{quote.customerName}</p>
          <p className="text-sm text-navy-400">{quote.whatsapp}</p>
          {quote.contactNumber && <p className="text-sm text-navy-400">{quote.contactNumber}</p>}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-navy-100 text-left text-navy-300">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">Category</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Price</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item) => (
            <tr key={item.id} className="border-b border-navy-50">
              <td className="py-2 text-navy-500">{item.nameSnapshot}</td>
              <td className="py-2 text-navy-300">{item.categorySnapshot}</td>
              <td className="py-2 text-right text-navy-400">{item.quantity}</td>
              <td className="py-2 text-right text-navy-400">{formatMoney(item.unitPrice)}</td>
              <td className="py-2 text-right text-navy-500">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-navy-400">
            <span>Subtotal</span>
            <span>{formatMoney(quote.subtotal)}</span>
          </div>
          {quote.discountAmount > 0 && (
            <div className="flex justify-between text-navy-400">
              <span>Discount</span>
              <span>-{formatMoney(quote.discountAmount)}</span>
            </div>
          )}
          {quote.taxAmount > 0 && (
            <div className="flex justify-between text-navy-400">
              <span>
                {settings.taxLabel} ({quote.taxRatePercent}%)
              </span>
              <span>{formatMoney(quote.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-navy-100 pt-1.5 text-base font-semibold text-navy-500">
            <span>Quote Total</span>
            <span>{formatMoney(quote.totalAmount)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-6 space-y-1 border-t border-navy-100 pt-4 text-sm text-navy-400">
          <p>{quote.notes}</p>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-navy-300">
        This is an estimate, not a tax invoice. Prices may change if not accepted promptly.
      </p>
    </div>
  );
}
