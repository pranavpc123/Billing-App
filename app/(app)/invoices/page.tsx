import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import {
  getPaymentStatus,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABEL,
  type PaymentStatus,
} from "@/lib/payment-status";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    paymentMethodId?: string;
    visitModeId?: string;
    service?: string;
    status?: string;
  }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const canViewAll = can(session?.user.role, "invoices.viewAll");

  const [paymentMethods, visitModes] = await Promise.all([
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.visitMode.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const where: NonNullable<Parameters<typeof prisma.invoice.findMany>[0]>["where"] = {};
  if (!canViewAll && session?.user.id) where.staffId = session.user.id;
  if (sp.q) {
    where.OR = [
      { invoiceNumber: { contains: sp.q } },
      { customer: { name: { contains: sp.q } } },
      { customer: { whatsapp: { contains: sp.q } } },
    ];
  }
  if (sp.from || sp.to) {
    where.createdAt = {
      ...(sp.from ? { gte: new Date(sp.from) } : {}),
      ...(sp.to ? { lte: new Date(sp.to + "T23:59:59") } : {}),
    };
  }
  if (sp.paymentMethodId) where.paymentMethodId = sp.paymentMethodId;
  if (sp.visitModeId) where.visitModeId = sp.visitModeId;
  if (sp.service) where.items = { some: { nameSnapshot: { contains: sp.service } } };

  const allInvoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true, staff: true, paymentMethod: true, visitMode: true, items: true },
    take: 500,
  });

  const invoices = sp.status
    ? allInvoices.filter(
        (inv) => getPaymentStatus(inv.totalAmount, inv.amountPaid) === sp.status
      )
    : allInvoices.slice(0, 200);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-navy-500">Invoices</h1>
      <p className="mt-1 text-sm text-navy-300">
        {canViewAll ? "All billing history." : "Your billing history."}
      </p>

      <Card className="mt-4">
        <CardBody>
          <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" action="/invoices">
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <Input name="q" defaultValue={sp.q} placeholder="Customer, WhatsApp, Invoice #" />
            </div>
            <Input name="service" defaultValue={sp.service} placeholder="Service / product" />
            <Input type="date" name="from" defaultValue={sp.from} />
            <Input type="date" name="to" defaultValue={sp.to} />
            <Select name="paymentMethodId" defaultValue={sp.paymentMethodId ?? ""}>
              <option value="">All payment methods</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </Select>
            <Select name="visitModeId" defaultValue={sp.visitModeId ?? ""}>
              <option value="">All modes</option>
              {visitModes.map((vm) => (
                <option key={vm.id} value={vm.id}>
                  {vm.name}
                </option>
              ))}
            </Select>
            <Select name="status" defaultValue={sp.status ?? ""}>
              <option value="">All payment statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
            </Select>
            <div className="col-span-2 sm:col-span-3 lg:col-span-6">
              <Button type="submit" variant="secondary">
                Apply Filters
              </Button>
              <Link href="/invoices" className="ml-2 text-sm text-navy-300 hover:text-navy-500">
                Clear
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Staff</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-navy-50 hover:bg-navy-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-navy-500 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-400">
                    {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-navy-500">{inv.customer.name}</td>
                  <td className="px-4 py-3 text-navy-400">{inv.customer.whatsapp}</td>
                  <td className="px-4 py-3 text-navy-400">
                    {inv.items.map((it) => it.nameSnapshot).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-500">
                    {formatMoney(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const status: PaymentStatus = getPaymentStatus(inv.totalAmount, inv.amountPaid);
                      return (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_CLASSES[status]}`}
                        >
                          {PAYMENT_STATUS_LABEL[status]}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-navy-400">{inv.paymentMethod.name}</td>
                  <td className="px-4 py-3 text-navy-400">{inv.visitMode.name}</td>
                  <td className="px-4 py-3 text-navy-400">{inv.staff.name}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-navy-300">
                    No invoices found.
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
