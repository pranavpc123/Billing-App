import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { whatsapp: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { invoices: { select: { totalAmount: true, createdAt: true } } },
    take: 200,
  });

  const rows = customers.map((c) => {
    const visitCount = c.invoices.length;
    const totalSpent = c.invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const lastVisit = c.invoices.reduce<Date | null>(
      (latest, i) => (!latest || i.createdAt > latest ? i.createdAt : latest),
      null
    );
    return { ...c, visitCount, totalSpent, lastVisit };
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-navy-500">Customers</h1>
      <p className="mt-1 text-sm text-navy-300">Search by name, WhatsApp number, or phone.</p>

      <form className="mt-4 flex max-w-md gap-2" action="/customers">
        <Input name="q" defaultValue={query} placeholder="Search customers…" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Card className="mt-6">
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 text-right font-medium">Visits</th>
                <th className="px-4 py-3 text-right font-medium">Total Spent</th>
                <th className="px-4 py-3 font-medium">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-navy-50 hover:bg-navy-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`} className="font-medium text-navy-500 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{c.whatsapp}</td>
                  <td className="px-4 py-3 text-navy-400">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-navy-400">{c.visitCount}</td>
                  <td className="px-4 py-3 text-right text-navy-500">{formatMoney(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-navy-400">
                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-navy-300">
                    No customers found.
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
