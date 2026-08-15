import Link from "next/link";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listReports } from "@/lib/reports/registry";
import { Card, CardBody } from "@/components/ui/Card";

export default async function ReportsPage() {
  const session = await auth();
  if (!can(session?.user.role, "reports.view")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view Reports.
      </p>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-navy-500">Reports</h1>
      <p className="mt-1 text-sm text-navy-300">Pick a report to view and export.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listReports().map((r) => (
          <Link key={r.key} href={`/reports/${r.key}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardBody>
                <p className="font-serif text-lg font-semibold text-navy-500">{r.label}</p>
                <p className="mt-1 text-sm text-navy-300">{r.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
