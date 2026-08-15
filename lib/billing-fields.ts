// Fixed set of core billing-form fields whose required/visible flags are
// admin-toggleable from Settings > Billing (BusinessSettings.billingFieldConfig JSON).
// This is intentionally a small fixed list, not a generic form builder — admins
// who need extra fields beyond this set use CustomFieldDef instead.
export const CORE_BILLING_FIELDS = [
  { key: "customerName", label: "Customer Name", alwaysRequired: true },
  { key: "whatsapp", label: "WhatsApp Number", alwaysRequired: true },
  { key: "contactNumber", label: "Contact Number", alwaysRequired: false },
  { key: "discount", label: "Discount", alwaysRequired: false },
  { key: "notes", label: "Notes / Remarks", alwaysRequired: false },
] as const;

export type CoreFieldKey = (typeof CORE_BILLING_FIELDS)[number]["key"];

export type BillingFieldConfig = Record<CoreFieldKey, { required: boolean; visible: boolean }>;

export const DEFAULT_BILLING_FIELD_CONFIG: BillingFieldConfig = {
  customerName: { required: true, visible: true },
  whatsapp: { required: true, visible: true },
  contactNumber: { required: false, visible: true },
  discount: { required: false, visible: true },
  notes: { required: false, visible: true },
};

export function parseBillingFieldConfig(json: string): BillingFieldConfig {
  try {
    const parsed = JSON.parse(json);
    return { ...DEFAULT_BILLING_FIELD_CONFIG, ...parsed };
  } catch {
    return DEFAULT_BILLING_FIELD_CONFIG;
  }
}
