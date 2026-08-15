"use client";

import { useActionState } from "react";
import { updateAmountPaid } from "@/app/(app)/invoices/_actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RecordPaymentForm({
  invoiceId,
  totalAmount,
  currentAmountPaid,
}: {
  invoiceId: string;
  totalAmount: number;
  currentAmountPaid: number;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) =>
      updateAmountPaid(invoiceId, formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 print:hidden">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-400">
          Amount Paid (of {totalAmount})
        </label>
        <Input
          type="number"
          name="amountPaid"
          min={0}
          max={totalAmount}
          step="0.01"
          defaultValue={currentAmountPaid}
          className="w-40"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Update Payment"}
      </Button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Updated.</p>}
    </form>
  );
}
