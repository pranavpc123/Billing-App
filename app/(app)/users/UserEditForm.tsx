"use client";

import { useActionState } from "react";
import { updateUser } from "./_actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function UserEditForm({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) =>
      updateUser(userId, formData),
    null
  );

  return (
    <details>
      <summary className="cursor-pointer text-navy-400 hover:text-navy-500">Edit</summary>
      <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
        <Input name="name" defaultValue={name} className="w-36 py-1.5 text-sm" placeholder="Name" />
        <Input
          type="email"
          name="email"
          defaultValue={email}
          className="w-48 py-1.5 text-sm"
          placeholder="Email"
        />
        <Input
          type="password"
          name="password"
          className="w-36 py-1.5 text-sm"
          placeholder="New password (optional)"
          minLength={6}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </details>
  );
}
