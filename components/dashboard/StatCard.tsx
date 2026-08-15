import { Card, CardBody } from "@/components/ui/Card";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-300">{label}</p>
        <p className="mt-1.5 font-serif text-2xl font-semibold text-navy-500">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-navy-300">{hint}</p>}
      </CardBody>
    </Card>
  );
}
