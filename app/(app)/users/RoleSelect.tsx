"use client";

import { useRef } from "react";
import { Select } from "@/components/ui/Input";

export function RoleSelect({
  action,
  defaultValue,
  disabled,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: string;
  disabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <Select
        name="role"
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={() => formRef.current?.requestSubmit()}
        className="w-32 px-2 py-1.5 text-xs"
      >
        <option value="STAFF">Billing Staff</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Admin</option>
      </Select>
    </form>
  );
}
