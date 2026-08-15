import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/money";

export type ReportRow = Record<string, string | number>;

export type ReportColumn = { key: string; label: string; align?: "left" | "right" };

export type ReportDef = {
  key: string;
  label: string;
  description: string;
  columns: ReportColumn[];
  getRows: (start: Date, end: Date) => Promise<ReportRow[]>;
};

const MONEY_KEYS = new Set(["revenue", "discount", "discountAmount", "discountValue"]);

export function isMoneyColumn(key: string): boolean {
  return MONEY_KEYS.has(key);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

const REPORTS: ReportDef[] = [
  {
    key: "daily-sales",
    label: "Daily Sales Report",
    description: "Revenue and invoice count grouped by day.",
    columns: [
      { key: "date", label: "Date" },
      { key: "invoices", label: "Invoices", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
      { key: "discount", label: "Discount", align: "right" },
    ],
    async getRows(start, end) {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end } },
      });
      const map = new Map<string, { invoices: number; revenue: number; discount: number }>();
      for (const inv of invoices) {
        const k = dayKey(inv.createdAt);
        const cur = map.get(k) ?? { invoices: 0, revenue: 0, discount: 0 };
        cur.invoices += 1;
        cur.revenue += inv.totalAmount;
        cur.discount += inv.discountAmount;
        map.set(k, cur);
      }
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date,
          invoices: v.invoices,
          revenue: round2(v.revenue),
          discount: round2(v.discount),
        }));
    },
  },
  {
    key: "monthly-sales",
    label: "Monthly Sales Report",
    description: "Revenue and invoice count grouped by month.",
    columns: [
      { key: "month", label: "Month" },
      { key: "invoices", label: "Invoices", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
      { key: "discount", label: "Discount", align: "right" },
    ],
    async getRows(start, end) {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end } },
      });
      const map = new Map<string, { invoices: number; revenue: number; discount: number }>();
      for (const inv of invoices) {
        const k = monthKey(inv.createdAt);
        const cur = map.get(k) ?? { invoices: 0, revenue: 0, discount: 0 };
        cur.invoices += 1;
        cur.revenue += inv.totalAmount;
        cur.discount += inv.discountAmount;
        map.set(k, cur);
      }
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({
          month,
          invoices: v.invoices,
          revenue: round2(v.revenue),
          discount: round2(v.discount),
        }));
    },
  },
  {
    key: "service-wise",
    label: "Service-wise Sales",
    description: "Quantity and revenue for each service performed.",
    columns: [
      { key: "service", label: "Service" },
      { key: "quantity", label: "Quantity", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
    ],
    async getRows(start, end) {
      return itemWiseSales(start, end, "SERVICE", "service");
    },
  },
  {
    key: "product-wise",
    label: "Product-wise Sales",
    description: "Quantity and revenue for each product sold.",
    columns: [
      { key: "product", label: "Product" },
      { key: "quantity", label: "Quantity", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
    ],
    async getRows(start, end) {
      return itemWiseSales(start, end, "PRODUCT", "product");
    },
  },
  {
    key: "customer-wise",
    label: "Customer-wise Sales",
    description: "Revenue and visit count for each customer.",
    columns: [
      { key: "customer", label: "Customer" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "visits", label: "Visits", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
    ],
    async getRows(start, end) {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { customer: true },
      });
      const map = new Map<string, { name: string; whatsapp: string; visits: number; revenue: number }>();
      for (const inv of invoices) {
        const cur = map.get(inv.customerId) ?? {
          name: inv.customer.name,
          whatsapp: inv.customer.whatsapp,
          visits: 0,
          revenue: 0,
        };
        cur.visits += 1;
        cur.revenue += inv.totalAmount;
        map.set(inv.customerId, cur);
      }
      return [...map.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .map((v) => ({
          customer: v.name,
          whatsapp: v.whatsapp,
          visits: v.visits,
          revenue: round2(v.revenue),
        }));
    },
  },
  {
    key: "payment-method",
    label: "Payment Method Report",
    description: "Revenue collected per payment method.",
    columns: [
      { key: "method", label: "Payment Method" },
      { key: "invoices", label: "Invoices", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
    ],
    async getRows(start, end) {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { paymentMethod: true },
      });
      const map = new Map<string, { invoices: number; revenue: number }>();
      for (const inv of invoices) {
        const k = inv.paymentMethod.name;
        const cur = map.get(k) ?? { invoices: 0, revenue: 0 };
        cur.invoices += 1;
        cur.revenue += inv.totalAmount;
        map.set(k, cur);
      }
      return [...map.entries()].map(([method, v]) => ({
        method,
        invoices: v.invoices,
        revenue: round2(v.revenue),
      }));
    },
  },
  {
    key: "walkin-vs-online",
    label: "Walk-in vs Online Sales",
    description: "Revenue split by visit / order mode.",
    columns: [
      { key: "mode", label: "Mode" },
      { key: "invoices", label: "Invoices", align: "right" },
      { key: "revenue", label: "Revenue", align: "right" },
    ],
    async getRows(start, end) {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { visitMode: true },
      });
      const map = new Map<string, { invoices: number; revenue: number }>();
      for (const inv of invoices) {
        const k = inv.visitMode.name;
        const cur = map.get(k) ?? { invoices: 0, revenue: 0 };
        cur.invoices += 1;
        cur.revenue += inv.totalAmount;
        map.set(k, cur);
      }
      return [...map.entries()].map(([mode, v]) => ({
        mode,
        invoices: v.invoices,
        revenue: round2(v.revenue),
      }));
    },
  },
  {
    key: "discount",
    label: "Discount Report",
    description: "Every invoice that had a discount applied.",
    columns: [
      { key: "invoice", label: "Invoice" },
      { key: "date", label: "Date" },
      { key: "customer", label: "Customer" },
      { key: "discountType", label: "Type" },
      { key: "discountValue", label: "Value", align: "right" },
      { key: "discountAmount", label: "Amount", align: "right" },
    ],
    async getRows(start, end) {
      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end }, discountAmount: { gt: 0 } },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      });
      return invoices.map((inv) => ({
        invoice: inv.invoiceNumber,
        date: dayKey(inv.createdAt),
        customer: inv.customer.name,
        discountType: inv.discountType,
        discountValue: inv.discountValue,
        discountAmount: round2(inv.discountAmount),
      }));
    },
  },
];

async function itemWiseSales(start: Date, end: Date, type: "SERVICE" | "PRODUCT", labelKey: string) {
  // Orphaned items (catalog entry since deleted) default to "service" so they aren't lost from reports.
  const where =
    type === "SERVICE"
      ? { OR: [{ serviceProduct: { type: "SERVICE" } }, { serviceProductId: null }] }
      : { serviceProduct: { type: "PRODUCT" } };

  const items = await prisma.invoiceItem.findMany({
    where: { invoice: { createdAt: { gte: start, lte: end } }, ...where },
  });
  const map = new Map<string, { quantity: number; revenue: number }>();
  for (const item of items) {
    const cur = map.get(item.nameSnapshot) ?? { quantity: 0, revenue: 0 };
    cur.quantity += item.quantity;
    cur.revenue += item.lineTotal;
    map.set(item.nameSnapshot, cur);
  }
  return [...map.entries()]
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, v]) => ({
      [labelKey]: name,
      quantity: v.quantity,
      revenue: round2(v.revenue),
    }));
}

export function getReportDef(key: string): ReportDef | undefined {
  return REPORTS.find((r) => r.key === key);
}

export function listReports(): ReportDef[] {
  return REPORTS;
}
