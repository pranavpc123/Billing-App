import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getReportDef, isMoneyColumn } from "@/lib/reports/registry";
import { formatMoney } from "@/lib/money";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { startOfDay, endOfDay, subDays } from "date-fns";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!can(session?.user.role, "reports.view")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view Reports.
      </p>
    );
  }

  const { type } = await params;
  const def = getReportDef(type);
  if (!def) notFound();

  const sp = await searchParams;
  const defaultFrom = subDays(new Date(), 30);
  const start = sp.from ? startOfDay(new Date(sp.from)) : startOfDay(defaultFrom);
  const end = sp.to ? endOfDay(new Date(sp.to)) : endOfDay(new Date());

  const rows = await def.getRows(start, end);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-navy-500">{def.label}</h1>
      <p className="mt-1 text-sm text-navy-300">{def.description}</p>

      <Card className="mt-4">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" action={`/reports/${type}`}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-400">From</label>
              <Input type="date" name="from" defaultValue={sp.from} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-400">To</label>
              <Input type="date" name="to" defaultValue={sp.to} />
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <div className="ml-auto flex gap-2">
              <a href={`/reports/${type}/export?format=csv&from=${sp.from ?? ""}&to=${sp.to ?? ""}`}>
                <Button type="button" variant="secondary" size="sm">
                  Export CSV
                </Button>
              </a>
              <a href={`/reports/${type}/export?format=xlsx&from=${sp.from ?? ""}&to=${sp.to ?? ""}`}>
                <Button type="button" variant="secondary" size="sm">
                  Export Excel
                </Button>
              </a>
              <a href={`/reports/${type}/export?format=pdf&from=${sp.from ?? ""}&to=${sp.to ?? ""}`}>
                <Button type="button" variant="secondary" size="sm">
                  Export PDF
                </Button>
              </a>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                {def.columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-3 font-medium ${c.align === "right" ? "text-right" : ""}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-navy-50">
                  {def.columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 text-navy-500 ${c.align === "right" ? "text-right" : ""}`}
                    >
                      {isMoneyColumn(c.key) ? formatMoney(Number(row[c.key] ?? 0)) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={def.columns.length} className="px-4 py-10 text-center text-navy-300">
                    No data for this period.
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
