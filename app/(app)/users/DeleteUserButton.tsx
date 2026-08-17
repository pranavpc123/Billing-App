"use client";

import { useActionState } from "react";
import { deleteUser } from "./_actions";
import { Button } from "@/components/ui/Button";

export function DeleteUserButton({ userId, disabled }: { userId: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(
    async () => deleteUser(userId),
    null as { ok: boolean; error?: string } | null
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Delete this user? This cannot be undone.")) e.preventDefault();
      }}
    >
      <Button type="submit" variant="danger" size="sm" disabled={disabled || pending}>
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
