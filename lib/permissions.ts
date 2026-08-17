import type { Role } from "@/generated/prisma/enums";

export type Resource =
  | "dashboard"
  | "billing.create"
  | "customers.view"
  | "customers.edit"
  | "invoices.viewAll"
  | "invoices.viewOwn"
  | "invoices.edit"
  | "quotes.viewAll"
  | "quotes.viewOwn"
  | "appointments.view"
  | "appointments.delete"
  | "catalog.view"
  | "catalog.edit"
  | "reports.view"
  | "users.edit"
  | "settings.edit";

const MATRIX: Record<Resource, Role[]> = {
  dashboard: ["ADMIN", "MANAGER"],
  "billing.create": ["ADMIN", "MANAGER", "STAFF"],
  "customers.view": ["ADMIN", "MANAGER", "STAFF"],
  "customers.edit": ["ADMIN", "MANAGER"],
  "invoices.viewAll": ["ADMIN", "MANAGER"],
  "invoices.viewOwn": ["ADMIN", "MANAGER", "STAFF"],
  "invoices.edit": ["ADMIN", "MANAGER"],
  "quotes.viewAll": ["ADMIN", "MANAGER"],
  "quotes.viewOwn": ["ADMIN", "MANAGER", "STAFF"],
  "appointments.view": ["ADMIN", "MANAGER", "STAFF"],
  "appointments.delete": ["ADMIN", "MANAGER"],
  "catalog.view": ["ADMIN", "MANAGER", "STAFF"],
  "catalog.edit": ["ADMIN", "MANAGER"],
  "reports.view": ["ADMIN", "MANAGER"],
  "users.edit": ["ADMIN"],
  "settings.edit": ["ADMIN"],
};

export function can(role: Role | undefined | null, resource: Resource): boolean {
  if (!role) return false;
  return MATRIX[resource].includes(role);
}

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", resource: "dashboard" as Resource },
  { href: "/billing/new", label: "New Bill", resource: "billing.create" as Resource },
  { href: "/customers", label: "Customers", resource: "customers.view" as Resource },
  { href: "/invoices", label: "Invoices", resource: "invoices.viewOwn" as Resource },
  { href: "/quotes", label: "Quotes", resource: "quotes.viewOwn" as Resource },
  { href: "/appointments", label: "Appointments", resource: "appointments.view" as Resource, featureFlag: "appointmentsEnabled" as const },
  { href: "/catalog", label: "Services & Products", resource: "catalog.view" as Resource },
  { href: "/reports", label: "Reports", resource: "reports.view" as Resource },
  { href: "/users", label: "Users", resource: "users.edit" as Resource },
  { href: "/settings", label: "Settings", resource: "settings.edit" as Resource },
];
