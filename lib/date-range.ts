import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";

export type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

export function resolveDateRange(
  range: RangeKey,
  from?: string,
  to?: string
): { start: Date; end: Date; label: string } {
  const now = new Date();

  switch (range) {
    case "yesterday": {
      const y = subDays(now, 1);
      return { start: startOfDay(y), end: endOfDay(y), label: "Yesterday" };
    }
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        label: "This Week",
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now), label: "This Month" };
    case "custom": {
      const start = from ? startOfDay(new Date(from)) : startOfDay(now);
      const end = to ? endOfDay(new Date(to)) : endOfDay(now);
      return { start, end, label: "Custom Range" };
    }
    case "today":
    default:
      return { start: startOfDay(now), end: endOfDay(now), label: "Today" };
  }
}
