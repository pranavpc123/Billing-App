import Image from "next/image";
import { formatMoney } from "@/lib/money";
import type { InvoiceForDisplay } from "@/lib/invoice-data";
import { PaymentSeal } from "./PaymentSeal";
import {
  getPaymentStatus,
  getPendingAmount,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_CLASSES,
} from "@/lib/payment-status";

export function InvoiceView({ invoice, settings }: InvoiceForDisplay) {
  const customFields = safeParseJson(invoice.customFields);
  const paymentStatus = getPaymentStatus(invoice.totalAmount, invoice.amountPaid);
  const pendingAmount = getPendingAmount(invoice.totalAmount, invoice.amountPaid);

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
          <p className="font-serif text-lg font-semibold text-navy-500">
            Invoice {invoice.invoiceNumber}
          </p>
          <p className="text-sm text-navy-300">
            {new Date(invoice.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="mt-1 text-xs text-navy-300">Billed by {invoice.staff.name}</p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_CLASSES[paymentStatus]}`}
          >
            {PAYMENT_STATUS_LABEL[paymentStatus]}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-navy-300">Customer</p>
          <p className="mt-1 font-medium text-navy-500">{invoice.customer.name}</p>
          <p className="text-sm text-navy-400">{invoice.customer.whatsapp}</p>
          {invoice.contactNumber && (
            <p className="text-sm text-navy-400">{invoice.contactNumber}</p>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-300">Details</p>
          <p className="mt-1 text-sm text-navy-400">Payment: {invoice.paymentMethod.name}</p>
          <p className="text-sm text-navy-400">Mode: {invoice.visitMode.name}</p>
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
          {invoice.items.map((item) => (
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

      <div className="mt-4 flex items-center justify-end gap-6">
        {settings.showPaymentSeal && paymentStatus === "PAID" && (
          <div className="hidden flex-1 justify-center sm:flex">
            <PaymentSeal />
          </div>
        )}
        <div className="w-full max-w-xs shrink-0 space-y-1.5 text-sm">
          <div className="flex justify-between text-navy-400">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-navy-400">
              <span>Discount</span>
              <span>-{formatMoney(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-navy-400">
              <span>
                {settings.taxLabel} ({invoice.taxRatePercent}%)
              </span>
              <span>{formatMoney(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-navy-100 pt-1.5 text-base font-semibold text-navy-500">
            <span>Total</span>
            <span>{formatMoney(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-navy-400">
            <span>Amount Paid</span>
            <span>{formatMoney(invoice.amountPaid)}</span>
          </div>
          {pendingAmount > 0 && (
            <div className="flex justify-between font-semibold text-red-600">
              <span>Pending Balance</span>
              <span>{formatMoney(pendingAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {(invoice.notes || Object.keys(customFields).length > 0) && (
        <div className="mt-6 space-y-1 border-t border-navy-100 pt-4 text-sm text-navy-400">
          {Object.entries(customFields).map(([key, value]) =>
            value ? (
              <p key={key}>
                <span className="text-navy-300">{key}:</span> {String(value)}
              </p>
            ) : null
          )}
          {invoice.notes && <p>{invoice.notes}</p>}
        </div>
      )}

      {settings.invoiceFooterText && (
        <p className="mt-8 text-center text-sm text-navy-300">{settings.invoiceFooterText}</p>
      )}
    </div>
  );
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
