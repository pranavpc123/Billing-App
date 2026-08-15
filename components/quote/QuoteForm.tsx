"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatMoney, round2 } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { COUNTRY_CODES } from "@/lib/countries";
import {
  lookupCustomerByWhatsapp,
  type CustomerLookupResult,
} from "@/app/(app)/billing/new/_actions";
import { createQuote } from "@/app/(app)/quotes/_actions";

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

export function QuoteForm({
  catalog,
  taxEnabled,
  taxRatePercent,
  taxLabel,
  discountDefaultType,
  discountDefaultValue,
  defaultCountryCode,
}: {
  catalog: CatalogItem[];
  taxEnabled: boolean;
  taxRatePercent: number;
  taxLabel: string;
  discountDefaultType: string;
  discountDefaultValue: number;
  defaultCountryCode: string;
}) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [whatsappLocal, setWhatsappLocal] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [discountType, setDiscountType] = useState(discountDefaultType);
  const [discountValue, setDiscountValue] = useState(discountDefaultValue);

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
  }, [whatsapp, whatsappLocal]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) return setError("Customer name is required.");
    if (!whatsapp) return setError("WhatsApp number is required.");
    if (items.length === 0) return setError("Add at least one service or product.");

    const formData = new FormData();
    formData.set("customerName", customerName.trim());
    formData.set("whatsapp", whatsapp);
    formData.set("contactNumber", contactNumber.trim());
    formData.set("notes", notes.trim());
    formData.set("discountType", discountType);
    formData.set("discountValue", String(discountValue));
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

    setSubmitting(true);
    const result = await createQuote(formData);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/quotes/${result.quoteId}`);
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
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-400">
                WhatsApp Number<span className="ml-0.5 text-gold-700">*</span>
              </label>
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
            </div>
            <Field label="Customer Name" required>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </Field>
            <Field label="Contact Number">
              <Input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                inputMode="tel"
              />
            </Field>
            <div className="sm:col-span-2">
              {lookupLoading && <p className="text-sm text-navy-300">Looking up customer…</p>}
              {!lookupLoading && lookup && (
                <div className="rounded-xl bg-gold-50 px-4 py-3 text-sm text-navy-500">
                  <p className="font-medium">Returning customer — {lookup.name}</p>
                  <p className="mt-0.5 text-navy-400">
                    {lookup.visitCount} visit{lookup.visitCount === 1 ? "" : "s"} ·{" "}
                    {formatMoney(lookup.totalSpent)} spent
                  </p>
                </div>
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
              <div className="overflow-x-auto">
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
                            min={1}
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.localId, { quantity: Number(e.target.value) || 1 })
                            }
                            className="px-2 py-1.5"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
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
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Discount</CardTitle>
          </CardHeader>
          <CardBody>
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
              <span>Quote Total</span>
              <span>{formatMoney(totalAmount)}</span>
            </div>
          </CardBody>
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Create Quote"}
        </Button>
      </div>
    </form>
  );
}
