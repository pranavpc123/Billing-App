import { round2 } from "@/lib/money";

export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING";

const EPSILON = 0.01;

export function getPaymentStatus(totalAmount: number, amountPaid: number): PaymentStatus {
  if (amountPaid <= EPSILON) return "PENDING";
  if (amountPaid >= totalAmount - EPSILON) return "PAID";
  return "PARTIAL";
}

export function getPendingAmount(totalAmount: number, amountPaid: number): number {
  return Math.max(0, round2(totalAmount - amountPaid));
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  PAID: "bg-green-50 text-green-700",
  PARTIAL: "bg-gold-100 text-gold-800",
  PENDING: "bg-red-50 text-red-700",
};
