import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateCustomer } from "../_actions";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });
  if (!customer) notFound();

  const totalSpent = customer.invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const visitCount = customer.invoices.length;
  const lastVisit = customer.invoices[0]?.createdAt ?? null;
  const canEdit = can(session?.user.role, "customers.edit");

  async function editAction(formData: FormData) {
    "use server";
    await updateCustomer(customer!.id, formData);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-500">{customer.name}</h1>
        <p className="mt-1 text-sm text-navy-300">
          {customer.whatsapp} {customer.phone && `· ${customer.phone}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-navy-300">Visits</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-500">{visitCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-navy-300">Total Spent</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-500">
              {formatMoney(totalSpent)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-navy-300">Last Visit</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-500">
              {lastVisit ? new Date(lastVisit).toLocaleDateString("en-IN") : "—"}
            </p>
          </CardBody>
        </Card>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Customer</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={editAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input name="name" defaultValue={customer.name} />
              </Field>
              <Field label="Phone">
                <Input name="phone" defaultValue={customer.phone ?? ""} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea name="notes" rows={3} defaultValue={customer.notes ?? ""} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {customer.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-navy-50 hover:bg-navy-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-navy-500 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-400">
                    {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-navy-400">
                    {inv.items.map((it) => it.nameSnapshot).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-500">
                    {formatMoney(inv.totalAmount)}
                  </td>
                </tr>
              ))}
              {customer.invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-navy-300">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
