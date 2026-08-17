"use client";

import { Button, type ButtonProps } from "@/components/ui/Button";

export function ConfirmSubmitButton({
  confirmMessage,
  ...props
}: ButtonProps & { confirmMessage: string }) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      {...props}
    />
  );
}
