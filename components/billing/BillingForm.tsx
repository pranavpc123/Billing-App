"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatMoney, round2 } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { COUNTRY_CODES } from "@/lib/countries";
import type { BillingFieldConfig } from "@/lib/billing-fields";
import {
  createInvoice,
  lookupCustomerByWhatsapp,
  type CustomerLookupResult,
} from "@/app/(app)/billing/new/_actions";
import { updateInvoice } from "@/app/(app)/invoices/_actions";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  type: string;
  defaultPrice: number;
};

type LineItem = {
  localId: string;
  serviceProductId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
};

type CustomFieldDef = {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT";
  required: boolean;
  options: string[];
};

export type EditInvoiceData = {
  invoiceId: string;
  customerName: string;
  whatsapp: string;
  contactNumber: string;
  email: string;
  notes: string;
  items: LineItem[];
  discountType: string;
  discountValue: number;
  paymentMethodId: string;
  visitModeId: string;
  customFieldValues: Record<string, string>;
  amountPaid: number;
};

export function BillingForm({
  catalog,
  paymentMethods,
  visitModes,
  customFieldDefs,
  fieldConfig,
  taxEnabled,
  taxRatePercent,
  taxLabel,
  discountDefaultType,
  discountDefaultValue,
  defaultCountryCode,
  editInvoice,
}: {
  catalog: CatalogItem[];
  paymentMethods: { id: string; name: string }[];
  visitModes: { id: string; name: string }[];
  customFieldDefs: CustomFieldDef[];
  fieldConfig: BillingFieldConfig;
  taxEnabled: boolean;
  taxRatePercent: number;
  taxLabel: string;
  discountDefaultType: string;
  discountDefaultValue: number;
  defaultCountryCode: string;
  editInvoice?: EditInvoiceData;
}) {
  const router = useRouter();
  const isEditing = !!editInvoice;

  const [customerName, setCustomerName] = useState(editInvoice?.customerName ?? "");
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [whatsappLocal, setWhatsappLocal] = useState("");
  const [contactNumber, setContactNumber] = useState(editInvoice?.contactNumber ?? "");
  const [email, setEmail] = useState(editInvoice?.email ?? "");
  const [notes, setNotes] = useState(editInvoice?.notes ?? "");
  const [items, setItems] = useState<LineItem[]>(editInvoice?.items ?? []);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [discountType, setDiscountType] = useState(editInvoice?.discountType ?? discountDefaultType);
  const [discountValue, setDiscountValue] = useState(
    editInvoice?.discountValue ?? discountDefaultValue
  );
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(
    editInvoice?.customFieldValues ?? {}
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    editInvoice?.paymentMethodId ?? paymentMethods[0]?.id ?? ""
  );
  const [visitModeId, setVisitModeId] = useState(
    editInvoice?.visitModeId ?? visitModes[0]?.id ?? ""
  );
  // null = not manually touched, so it tracks the computed total (fully paid, today's default)
  const [amountReceived, setAmountReceived] = useState<number | null>(
    editInvoice?.amountPaid ?? null
  );

  const [lookup, setLookup] = useState<CustomerLookupResult>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const whatsapp = useMemo(
    () => (whatsappLocal.trim() ? normalizePhone(whatsappLocal, countryCode) : ""),
    [whatsappLocal, countryCode]
  );

  useEffect(() => {
    if (isEditing) return;
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      if (whatsappLocal.trim().length < 6) {
        setLookup(null);
        return;
      }
      setLookupLoading(true);
      const result = await lookupCustomerByWhatsapp(whatsapp);
      setLookup(result);
      setLookupLoading(false);
      if (result) {
        setCustomerName((prev) => prev || result.name);
        setContactNumber((prev) => prev || result.phone || "");
      }
    }, 500);
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [whatsapp, whatsappLocal, isEditing]);

  function addItem() {
    const catalogItem = catalog.find((c) => c.id === selectedCatalogId);
    if (!catalogItem) return;
    setItems((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        serviceProductId: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        quantity: 1,
        unitPrice: catalogItem.defaultPrice,
      },
    ]);
    setSelectedCatalogId("");
  }

  function updateItem(localId: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)));
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  }

  const subtotal = useMemo(
    () => round2(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)),
    [items]
  );
  const discountAmount = useMemo(() => {
    if (discountType === "PERCENT") return round2(subtotal * (Math.min(discountValue, 100) / 100));
    return round2(Math.min(Math.max(discountValue, 0), subtotal));
  }, [subtotal, discountType, discountValue]);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxEnabled ? round2(taxableAmount * (taxRatePercent / 100)) : 0;
  const totalAmount = round2(taxableAmount + taxAmount);

  const effectiveAmountReceived =
    amountReceived === null ? totalAmount : Math.min(amountReceived, totalAmount);
  const pendingAmount = round2(Math.max(0, totalAmount - effectiveAmountReceived));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) return setError("Customer name is required.");
    if (!isEditing && fieldConfig.whatsapp.required && !whatsapp.trim())
      return setError("WhatsApp number is required.");
    if (items.length === 0) return setError("Add at least one service or product.");
    if (!paymentMethodId) return setError("Select a payment method.");
    if (!visitModeId) return setError("Select a visit mode.");
    for (const def of customFieldDefs) {
      if (def.required && !customFieldValues[def.key]?.trim()) {
        return setError(`${def.label} is required.`);
      }
    }

    const formData = new FormData();
    formData.set("customerName", customerName.trim());
    if (!isEditing) formData.set("whatsapp", whatsapp);
    formData.set("contactNumber", contactNumber.trim());
    formData.set("email", email.trim());
    formData.set("notes", notes.trim());
    formData.set("paymentMethodId", paymentMethodId);
    formData.set("visitModeId", visitModeId);
    formData.set("discountType", discountType);
    formData.set("discountValue", String(discountValue));
    formData.set("amountPaid", String(effectiveAmountReceived));
    formData.set(
      "items",
      JSON.stringify(
        items.map((i) => ({
          serviceProductId: i.serviceProductId,
          name: i.name,
          category: i.category,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      )
    );
    formData.set("customFields", JSON.stringify(customFieldValues));

    setSubmitting(true);

    if (isEditing) {
      const result = await updateInvoice(editInvoice.invoiceId, formData);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/invoices/${editInvoice.invoiceId}`);
      return;
    }

    const result = await createInvoice(formData);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/invoices/${result.invoiceId}`);
  }

  const groupedCatalog = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of catalog) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [catalog]);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fieldConfig.whatsapp.visible && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-400">
                  WhatsApp Number
                  {fieldConfig.whatsapp.required && <span className="ml-0.5 text-gold-700">*</span>}
                </label>
                {isEditing ? (
                  <>
                    <Input value={`+${editInvoice.whatsapp}`} disabled />
                    <p className="mt-1 text-xs text-navy-300">
                      WhatsApp number can&apos;t be changed on an existing invoice.
                    </p>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <div className="w-28 shrink-0">
                      <Select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            +{c.code}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Input
                        value={whatsappLocal}
                        onChange={(e) => setWhatsappLocal(e.target.value)}
                        placeholder="9xxxxxxxxx"
                        inputMode="tel"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {fieldConfig.customerName.visible && (
              <Field label="Customer Name" required>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </Field>
            )}
            {fieldConfig.contactNumber.visible && (
              <Field label="Contact Number" required={fieldConfig.contactNumber.required}>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  inputMode="tel"
                />
              </Field>
            )}
            <Field label="Email" hint="Optional">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              {lookupLoading && <p className="text-sm text-navy-300">Looking up customer…</p>}
              {!lookupLoading && lookup && (
                <div className="rounded-xl bg-gold-50 px-4 py-3 text-sm text-navy-500">
                  <p className="font-medium">Returning customer — {lookup.name}</p>
                  <p className="mt-0.5 text-navy-400">
                    {lookup.visitCount} visit{lookup.visitCount === 1 ? "" : "s"} ·{" "}
                    {formatMoney(lookup.totalSpent)} spent
                    {lookup.lastVisit &&
                      ` · last visit ${new Date(lookup.lastVisit).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
              )}
              {!lookupLoading && !lookup && whatsappLocal.trim().length >= 6 && (
                <p className="text-sm text-navy-300">New customer — will be added on save.</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services & Products</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
                className="flex-1"
              >
                <option value="">Select a service or product…</option>
                {groupedCatalog.map(([category, catItems]) => (
                  <optgroup key={category} label={category}>
                    {catItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {formatMoney(item.defaultPrice)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addItem} disabled={!selectedCatalogId}>
                + Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-navy-200 px-4 py-6 text-center text-sm text-navy-300">
                No items added yet.
              </p>
            ) : (
              <>
                {/* Mobile: stacked cards (a 6-column table has no usable narrow layout) */}
                <div className="space-y-3 md:hidden">
                  {items.map((item) => (
                    <div
                      key={item.localId}
                      className="rounded-xl border border-navy-100 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-navy-500">{item.name}</p>
                          <p className="text-xs text-navy-300">{item.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.localId)}
                          className="shrink-0 text-navy-300 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Field label="Qty">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step="1"
                            value={item.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateItem(item.localId, { quantity: Number(e.target.value) || 0 })
                            }
                            onBlur={() => {
                              if (!item.quantity || item.quantity < 1)
                                updateItem(item.localId, { quantity: 1 });
                            }}
                            className="px-3 py-2"
                          />
                        </Field>
                        <Field label="Price">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateItem(item.localId, { unitPrice: Number(e.target.value) || 0 })
                            }
                            className="px-3 py-2"
                          />
                        </Field>
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-navy-400">
                        <span>Amount</span>
                        <span className="font-medium text-navy-500">
                          {formatMoney(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet: full table */}
                <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-100 text-left text-navy-300">
                      <th className="py-2 pr-2 font-medium">Item</th>
                      <th className="py-2 pr-2 font-medium">Category</th>
                      <th className="w-20 py-2 pr-2 font-medium">Qty</th>
                      <th className="w-28 py-2 pr-2 font-medium">Price</th>
                      <th className="w-28 py-2 pr-2 font-medium text-right">Amount</th>
                      <th className="w-8 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.localId} className="border-b border-navy-50">
                        <td className="py-2 pr-2 text-navy-500">{item.name}</td>
                        <td className="py-2 pr-2 text-navy-300">{item.category}</td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step="1"
                            value={item.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateItem(item.localId, { quantity: Number(e.target.value) || 0 })
                            }
                            onBlur={() => {
                              if (!item.quantity || item.quantity < 1)
                                updateItem(item.localId, { quantity: 1 });
                            }}
                            className="px-2 py-1.5"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateItem(item.localId, { unitPrice: Number(e.target.value) || 0 })
                            }
                            className="px-2 py-1.5"
                          />
                        </td>
                        <td className="py-2 pr-2 text-right text-navy-500">
                          {formatMoney(item.quantity * item.unitPrice)}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.localId)}
                            className="text-navy-300 hover:text-red-600"
                            aria-label="Remove item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {(customFieldDefs.length > 0 || fieldConfig.notes.visible) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {customFieldDefs.map((def) => (
                <Field key={def.key} label={def.label} required={def.required}>
                  {def.type === "SELECT" ? (
                    <Select
                      value={customFieldValues[def.key] ?? ""}
                      onChange={(e) =>
                        setCustomFieldValues((prev) => ({ ...prev, [def.key]: e.target.value }))
                      }
                    >
                      <option value="">Select…</option>
                      {def.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={def.type === "NUMBER" ? "number" : "text"}
                      value={customFieldValues[def.key] ?? ""}
                      onChange={(e) =>
                        setCustomFieldValues((prev) => ({ ...prev, [def.key]: e.target.value }))
                      }
                    />
                  )}
                </Field>
              ))}
              {fieldConfig.notes.visible && (
                <div className="sm:col-span-2">
                  <Field label="Notes / Remarks" required={fieldConfig.notes.required}>
                    <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </Field>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="Payment Method" required>
              <Select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Visit / Order Mode" required>
              <Select value={visitModeId} onChange={(e) => setVisitModeId(e.target.value)}>
                {visitModes.map((vm) => (
                  <option key={vm.id} value={vm.id}>
                    {vm.name}
                  </option>
                ))}
              </Select>
            </Field>
            {fieldConfig.discount.visible && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount Type">
                  <Select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="FLAT">Flat (₹)</option>
                    <option value="PERCENT">Percent (%)</option>
                  </Select>
                </Field>
                <Field label="Discount Value">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  />
                </Field>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between text-navy-400">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-navy-400">
                <span>Discount</span>
                <span>-{formatMoney(discountAmount)}</span>
              </div>
            )}
            {taxEnabled && (
              <div className="flex justify-between text-navy-400">
                <span>
                  {taxLabel} ({taxRatePercent}%)
                </span>
                <span>{formatMoney(taxAmount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-navy-100 pt-2 text-base font-semibold text-navy-500">
              <span>Final Amount</span>
              <span>{formatMoney(totalAmount)}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amount Received</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Field
              label="Amount Received Now"
              hint="Defaults to the full amount — reduce it to record an advance."
            >
              <Input
                type="number"
                min={0}
                max={totalAmount}
                step="0.01"
                value={effectiveAmountReceived}
                onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
              />
            </Field>
            {amountReceived !== null && effectiveAmountReceived < totalAmount && (
              <button
                type="button"
                onClick={() => setAmountReceived(null)}
                className="text-sm font-medium text-navy-400 hover:text-navy-500"
              >
                Mark as fully paid
              </button>
            )}
            {pendingAmount > 0 && (
              <div className="flex justify-between rounded-lg bg-gold-50 px-3 py-2 text-sm font-medium text-gold-800">
                <span>Pending Balance</span>
                <span>{formatMoney(pendingAmount)}</span>
              </div>
            )}
          </CardBody>
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Saving…" : isEditing ? "Save Changes" : "Complete Sale"}
        </Button>
      </div>
    </form>
  );
}
