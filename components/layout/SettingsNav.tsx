import Link from "next/link";

export function SettingsNav({ active }: { active: "business" | "billing" }) {
  const tabs = [
    { key: "business", href: "/settings", label: "Business Details" },
    { key: "billing", href: "/settings/billing", label: "Billing Settings" },
  ] as const;

  return (
    <div className="flex gap-2 border-b border-navy-100 pb-3">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            active === tab.key ? "bg-navy-500 text-gold-50" : "text-navy-400 hover:bg-navy-50"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
