"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(app)/actions";
import { NAV_ITEMS, can, type Resource } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/enums";

export function AppHeader({
  role,
  appointmentsEnabled,
  userName,
  businessName,
}: {
  role: Role;
  appointmentsEnabled: boolean;
  userName: string;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => {
    if (!can(role, item.resource as Resource)) return false;
    if (item.featureFlag === "appointmentsEnabled" && !appointmentsEnabled) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur print:hidden">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          className="flex items-center gap-2.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-500">
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <Image src="/logo-mark.png" alt="" width={28} height={28} className="rounded-lg" />
          <span className="font-serif text-base font-semibold text-navy-500">
            {businessName}
          </span>
        </button>
        <div className="hidden md:block" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-navy-400 sm:inline">
            {userName} · <span className="text-navy-300">{role}</span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-500 hover:bg-navy-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      {open && (
        <nav className="space-y-1 border-t border-navy-100 px-3 py-3 md:hidden">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  active ? "bg-navy-500 text-gold-50" : "text-navy-400 hover:bg-navy-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
