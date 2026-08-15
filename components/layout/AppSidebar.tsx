"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, can, type Resource } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/enums";

export function AppSidebar({
  role,
  appointmentsEnabled,
  businessName,
}: {
  role: Role;
  appointmentsEnabled: boolean;
  businessName: string;
}) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => {
    if (!can(role, item.resource as Resource)) return false;
    if (item.featureFlag === "appointmentsEnabled" && !appointmentsEnabled) return false;
    return true;
  });

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-navy-100 bg-white md:flex print:hidden">
      <div className="flex items-center gap-2.5 border-b border-navy-100 px-5 py-4">
        <Image src="/logo-mark.png" alt="" width={36} height={36} className="rounded-lg" />
        <div>
          <p className="font-serif text-base font-semibold leading-tight text-navy-500">
            {businessName}
          </p>
          <p className="text-xs text-navy-300">Billing Counter</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-navy-500 text-gold-50"
                  : "text-navy-400 hover:bg-navy-50 hover:text-navy-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
