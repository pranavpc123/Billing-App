"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "../_actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

export function AppointmentForm({
  services,
  staff,
  visitModes,
}: {
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  visitModes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [serviceProductId, setServiceProductId] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) =>
      createAppointment(formData),
    null
  );

  useEffect(() => {
    if (state?.ok) router.push("/appointments");
  }, [state, router]);

  const serviceName = services.find((s) => s.id === serviceProductId)?.name ?? "";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Customer Name" required>
        <Input name="customerName" required />
      </Field>
      <Field label="WhatsApp Number" required>
        <Input name="whatsapp" required inputMode="tel" />
      </Field>
      <Field label="Service" required>
        <Select
          name="serviceProductId"
          value={serviceProductId}
          onChange={(e) => setServiceProductId(e.target.value)}
          required
        >
          <option value="">Select a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <input type="hidden" name="serviceName" value={serviceName} />
      </Field>
      <Field label="Staff / Beautician">
        <Select name="staffId" defaultValue="">
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Appointment Date" required>
        <Input type="date" name="date" required />
      </Field>
      <Field label="Appointment Time" required>
        <Input type="time" name="time" required />
      </Field>
      <Field label="Visit Mode">
        <Select name="visitModeId" defaultValue="">
          <option value="">Not specified</option>
          {visitModes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes">
          <Textarea name="notes" rows={3} />
        </Field>
      </div>

      {state?.error && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Booking…" : "Book Appointment"}
        </Button>
      </div>
    </form>
  );
}
