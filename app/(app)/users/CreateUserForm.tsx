"use client";

import { useActionState } from "react";
import { createUser } from "./_actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) =>
      createUser(formData),
    null
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <Field label="Name" required>
        <Input name="name" required />
      </Field>
      <Field label="Email" required>
        <Input type="email" name="email" required />
      </Field>
      <Field label="Password" required hint="Minimum 6 characters">
        <Input type="password" name="password" required minLength={6} />
      </Field>
      <Field label="Role" required>
        <Select name="role" defaultValue="STAFF">
          <option value="STAFF">Billing Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </Field>
      {state?.error && (
        <p className="sm:col-span-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="sm:col-span-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          User created.
        </p>
      )}
      <div className="sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Add User"}
        </Button>
      </div>
    </form>
  );
}
