import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-navy-50 text-navy-500",
  SENT: "bg-gold-100 text-gold-800",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-navy-50 text-navy-300",
  CONVERTED: "bg-green-100 text-green-800",
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const canViewAll = can(session?.user.role, "quotes.viewAll");

  const where: NonNullable<Parameters<typeof prisma.quote.findMany>[0]>["where"] = {};
  if (!canViewAll && session?.user.id) where.staffId = session.user.id;
  if (sp.q) {
    where.OR = [
      { quoteNumber: { contains: sp.q } },
      { customerName: { contains: sp.q } },
      { whatsapp: { contains: sp.q } },
    ];
  }
  if (sp.status) where.status = sp.status as never;

  const quotes = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { staff: true, items: true },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-500">Quotes</h1>
          <p className="mt-1 text-sm text-navy-300">
            {canViewAll ? "All quotes." : "Your quotes."}
          </p>
        </div>
        <Link href="/quotes/new">
          <Button>+ New Quote</Button>
        </Link>
      </div>

      <Card className="mt-4">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" action="/quotes">
            <Input name="q" defaultValue={sp.q} placeholder="Customer, WhatsApp, Quote #" />
            <Select name="status" defaultValue={sp.status ?? ""}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CONVERTED">Converted</option>
            </Select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <Link href="/quotes" className="text-sm text-navy-300 hover:text-navy-500">
              Clear
            </Link>
          </form>
        </CardBody>
      </Card>

      {/* Mobile: compact card list */}
      <div className="mt-6 divide-y divide-navy-50 rounded-2xl border border-navy-100 bg-white md:hidden">
        {quotes.map((q) => (
          <Link key={q.id} href={`/quotes/${q.id}`} className="block px-4 py-3 active:bg-navy-50/60">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-navy-500">{q.quoteNumber}</span>
              <span className="font-medium text-navy-500">{formatMoney(q.totalAmount)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-sm text-navy-400">
              <span className="truncate">{q.customerName}</span>
              <span className="shrink-0">{new Date(q.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            <div className="mt-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[q.status]}`}
              >
                {q.status}
              </span>
            </div>
          </Link>
        ))}
        {quotes.length === 0 && (
          <p className="px-4 py-10 text-center text-navy-300">No quotes found.</p>
        )}
      </div>

      {/* Desktop/tablet: full table */}
      <Card className="mt-6 hidden md:block">
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Quote</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Staff</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className="border-b border-navy-50 hover:bg-navy-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/quotes/${q.id}`} className="font-medium text-navy-500 hover:underline">
                      {q.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-400">
                    {new Date(q.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-navy-500">{q.customerName}</td>
                  <td className="px-4 py-3 text-navy-400">
                    {q.items.map((it) => it.nameSnapshot).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-500">{formatMoney(q.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[q.status]}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{q.staff.name}</td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-navy-300">
                    No quotes found.
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
