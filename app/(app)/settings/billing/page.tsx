import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { CORE_BILLING_FIELDS } from "@/lib/billing-fields";
import { parseBillingFieldConfig } from "@/lib/billing-fields";
import {
  createCustomField,
  createPaymentMethod,
  createVisitMode,
  toggleCustomFieldActive,
  togglePaymentMethodActive,
  toggleVisitModeActive,
  updateBillingFieldConfig,
  updateBillingSettings,
} from "../_actions";

export default async function BillingSettingsPage() {
  const session = await auth();
  if (!can(session?.user.role, "settings.edit")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view Settings.
      </p>
    );
  }

  const [settings, paymentMethods, visitModes, customFields] = await Promise.all([
    prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } }),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.visitMode.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.customFieldDef.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const fieldConfig = parseBillingFieldConfig(settings.billingFieldConfig);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-500">Billing Settings</h1>
        <p className="mt-1 text-sm text-navy-300">
          Invoice numbering, tax, discounts, payment methods, and custom fields.
        </p>
      </div>

      <SettingsNav active="billing" />

      <Card>
        <CardHeader>
          <CardTitle>Invoicing, Tax & Discounts</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateBillingSettings} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Invoice Prefix">
              <Input name="invoicePrefix" defaultValue={settings.invoicePrefix} />
            </Field>
            <Field label="Invoice Number Padding" hint="e.g. 4 → DL0001">
              <Input
                type="number"
                name="invoiceNumberPadding"
                min={1}
                max={8}
                defaultValue={settings.invoiceNumberPadding}
              />
            </Field>
            <Field label="Default Discount Type">
              <Select name="discountDefaultType" defaultValue={settings.discountDefaultType}>
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENT">Percent (%)</option>
              </Select>
            </Field>
            <Field label="Default Discount Value">
              <Input
                type="number"
                name="discountDefaultValue"
                min={0}
                step="0.01"
                defaultValue={settings.discountDefaultValue}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-navy-400 sm:col-span-2">
              <input type="checkbox" name="taxEnabled" defaultChecked={settings.taxEnabled} />
              Enable tax on invoices
            </label>
            <Field label="Tax Label">
              <Input name="taxLabel" defaultValue={settings.taxLabel} />
            </Field>
            <Field label="Tax Rate (%)">
              <Input
                type="number"
                name="taxRatePercent"
                min={0}
                step="0.01"
                defaultValue={settings.taxRatePercent}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Form Fields</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={updateBillingFieldConfig} className="space-y-3">
            {CORE_BILLING_FIELDS.map((field) => {
              const cfg = fieldConfig[field.key];
              return (
                <div key={field.key} className="flex items-center justify-between border-b border-navy-50 pb-2">
                  <span className="text-sm text-navy-500">{field.label}</span>
                  <div className="flex gap-4 text-xs text-navy-400">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        name={`visible_${field.key}`}
                        defaultChecked={cfg.visible}
                        disabled={field.alwaysRequired}
                      />
                      Visible
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        name={`required_${field.key}`}
                        defaultChecked={cfg.required}
                        disabled={field.alwaysRequired}
                      />
                      Required
                    </label>
                  </div>
                </div>
              );
            })}
            <Button type="submit" variant="secondary">
              Save Field Settings
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((pm) => (
              <form key={pm.id} action={togglePaymentMethodActive.bind(null, pm.id, !pm.active)}>
                <button
                  type="submit"
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    pm.active
                      ? "border-navy-200 bg-navy-50 text-navy-500"
                      : "border-navy-100 bg-white text-navy-300 line-through"
                  }`}
                >
                  {pm.name}
                </button>
              </form>
            ))}
          </div>
          <form action={createPaymentMethod} className="flex max-w-sm gap-2">
            <Input name="name" placeholder="New payment method" required />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visit / Order Modes</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {visitModes.map((vm) => (
              <form key={vm.id} action={toggleVisitModeActive.bind(null, vm.id, !vm.active)}>
                <button
                  type="submit"
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    vm.active
                      ? "border-navy-200 bg-navy-50 text-navy-500"
                      : "border-navy-100 bg-white text-navy-300 line-through"
                  }`}
                >
                  {vm.name}
                </button>
              </form>
            ))}
          </div>
          <form action={createVisitMode} className="flex max-w-sm gap-2">
            <Input name="name" placeholder="New visit mode" required />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Billing Fields</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            {customFields.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <span className="text-navy-500">
                  {f.label} <span className="text-navy-300">({f.type.toLowerCase()})</span>
                </span>
                <form action={toggleCustomFieldActive.bind(null, f.id, !f.active)}>
                  <button
                    type="submit"
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      f.active ? "bg-green-50 text-green-700" : "bg-navy-50 text-navy-300"
                    }`}
                  >
                    {f.active ? "Active" : "Inactive"}
                  </button>
                </form>
              </div>
            ))}
            {customFields.length === 0 && (
              <p className="text-sm text-navy-300">No custom fields yet.</p>
            )}
          </div>
          <form action={createCustomField} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Input name="label" placeholder="Field label" required />
            <Select name="type" defaultValue="TEXT">
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="SELECT">Select</option>
            </Select>
            <Input name="options" placeholder="Options (comma separated, for Select)" />
            <label className="flex items-center gap-1.5 text-xs text-navy-400">
              <input type="checkbox" name="required" /> Required
            </label>
            <div className="sm:col-span-4">
              <Button type="submit" variant="secondary">
                Add Custom Field
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
