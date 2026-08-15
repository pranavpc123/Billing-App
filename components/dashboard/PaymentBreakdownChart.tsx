"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";

export function PaymentBreakdownChart({ data }: { data: { name: string; amount: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-navy-300">
        No sales in this period yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#738199" }} axisLine={{ stroke: "#d4d8df" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#738199" }}
          axisLine={false}
          tickLine={false}
          width={70}
          tickFormatter={(v) => formatMoney(Number(v))}
        />
        <Tooltip
          formatter={(value) => formatMoney(Number(value ?? 0))}
          contentStyle={{ borderRadius: 12, borderColor: "#d4d8df", fontSize: 13 }}
        />
        <Bar dataKey="amount" fill="#16234a" radius={[4, 4, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}
