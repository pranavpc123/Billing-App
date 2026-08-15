import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base text-navy-500 placeholder:text-navy-300 focus:border-gold-600 focus:outline focus:outline-2 focus:outline-gold-200 disabled:bg-navy-50 disabled:text-navy-300";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${fieldBase} ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", ...props }, ref) => (
    <select ref={ref} className={`${fieldBase} ${className}`} {...props} />
  )
);
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`${fieldBase} ${className}`} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-sm font-medium text-navy-400 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-gold-700">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-navy-300">{hint}</p>}
    </div>
  );
}
