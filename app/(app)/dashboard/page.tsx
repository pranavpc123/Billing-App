import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { resolveDateRange, type RangeKey } from "@/lib/date-range";
import { formatMoney, round2 } from "@/lib/money";
import { getPendingAmount } from "@/lib/payment-status";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentBreakdownChart } from "@/components/dashboard/PaymentBreakdownChart";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const RANGE_TABS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!can(session?.user.role, "dashboard")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view the Dashboard.
      </p>
    );
  }

  const sp = await searchParams;
  const range = (sp.range as RangeKey) ?? "today";
  const { start, end, label } = resolveDateRange(range, sp.from, sp.to);

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      paymentMethod: true,
      items: { include: { serviceProduct: { select: { type: true } } } },
    },
  });

  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalDiscounts = invoices.reduce((sum, i) => sum + i.discountAmount, 0);
  const customerCount = new Set(invoices.map((i) => i.customerId)).size;

  let serviceCount = 0;
  let productSalesAmount = 0;
  for (const inv of invoices) {
    for (const item of inv.items) {
      if (item.serviceProduct?.type === "PRODUCT") {
        productSalesAmount += item.lineTotal;
      } else {
        serviceCount += item.quantity;
      }
    }
  }

  const cashCollection = invoices
    .filter((i) => i.paymentMethod.name === "Cash")
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const onlineCollection = totalRevenue - cashCollection;

  const allTimeRevenue = await prisma.invoice.aggregate({ _sum: { totalAmount: true } });
  const allInvoicesForPending = await prisma.invoice.findMany({
    select: { totalAmount: true, amountPaid: true },
  });
  const totalPending = round2(
    allInvoicesForPending.reduce((sum, i) => sum + getPendingAmount(i.totalAmount, i.amountPaid), 0)
  );

  const byPaymentMethod = new Map<string, number>();
  for (const inv of invoices) {
    byPaymentMethod.set(
      inv.paymentMethod.name,
      (byPaymentMethod.get(inv.paymentMethod.name) ?? 0) + inv.totalAmount
    );
  }
  const chartData = [...byPaymentMethod.entries()].map(([name, amount]) => ({ name, amount }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-500">Dashboard</h1>
          <p className="mt-1 text-sm text-navy-300">Showing {label.toLowerCase()}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_TABS.map((tab) => (
            <Link key={tab.key} href={`/dashboard?range=${tab.key}`}>
              <Button type="button" variant={range === tab.key ? "primary" : "secondary"} size="sm">
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" action="/dashboard">
            <input type="hidden" name="range" value="custom" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-400">From</label>
              <Input type="date" name="from" defaultValue={sp.from} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-400">To</label>
              <Input type="date" name="to" defaultValue={sp.to} />
            </div>
            <Button type="submit" variant="secondary">
              Custom Range
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Sales" value={formatMoney(totalRevenue)} hint={label} />
        <StatCard label="Customers" value={String(customerCount)} hint={label} />
        <StatCard label="Services Performed" value={String(serviceCount)} hint={label} />
        <StatCard label="Product Sales" value={formatMoney(productSalesAmount)} hint={label} />
        <StatCard label="Cash Collection" value={formatMoney(cashCollection)} hint={label} />
        <StatCard label="Online / UPI / Other" value={formatMoney(onlineCollection)} hint={label} />
        <StatCard label="Total Discounts" value={formatMoney(totalDiscounts)} hint={label} />
        <StatCard
          label="Total Revenue"
          value={formatMoney(allTimeRevenue._sum.totalAmount ?? 0)}
          hint="All time"
        />
        <StatCard
          label="Pending Payments"
          value={formatMoney(totalPending)}
          hint="All time — outstanding balances"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection by Payment Method</CardTitle>
        </CardHeader>
        <CardBody>
          <PaymentBreakdownChart data={chartData} />
        </CardBody>
      </Card>
    </div>
  );
}
