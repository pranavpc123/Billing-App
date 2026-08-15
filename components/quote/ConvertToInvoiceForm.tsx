"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { convertQuoteToInvoice } from "@/app/(app)/quotes/_actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";

export function ConvertToInvoiceForm({
  quoteId,
  totalAmount,
  paymentMethods,
  visitModes,
}: {
  quoteId: string;
  totalAmount: number;
  paymentMethods: { id: string; name: string }[];
  visitModes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { ok: boolean; error?: string; invoiceId?: string } | null,
      formData: FormData
    ) => {
      const result = await convertQuoteToInvoice(quoteId, formData);
      return result.ok ? { ok: true, invoiceId: result.invoiceId } : { ok: false, error: result.error };
    },
    null
  );

  useEffect(() => {
    if (state?.ok && state.invoiceId) router.push(`/invoices/${state.invoiceId}`);
  }, [state, router]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Field label="Payment Method" required>
        <Select name="paymentMethodId" defaultValue={paymentMethods[0]?.id ?? ""} required>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Visit / Order Mode" required>
        <Select name="visitModeId" defaultValue={visitModes[0]?.id ?? ""} required>
          {visitModes.map((vm) => (
            <option key={vm.id} value={vm.id}>
              {vm.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Amount Received Now" hint={`Total is ${totalAmount}`}>
        <Input type="number" name="amountPaid" min={0} max={totalAmount} step="0.01" defaultValue={totalAmount} />
      </Field>
      {state?.error && (
        <p className="sm:col-span-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Converting…" : "Convert to Invoice"}
        </Button>
      </div>
    </form>
  );
}
