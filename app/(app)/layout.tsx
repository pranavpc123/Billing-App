import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const settings = await prisma.businessSettings.findUnique({ where: { id: "singleton" } });
  const businessName = settings?.businessName ?? "DELSORA";
  const appointmentsEnabled = settings?.appointmentsEnabled ?? true;

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar
        role={session.user.role}
        appointmentsEnabled={appointmentsEnabled}
        businessName={businessName}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          role={session.user.role}
          appointmentsEnabled={appointmentsEnabled}
          userName={session.user.name ?? session.user.email ?? "User"}
          businessName={businessName}
        />
        <main className="flex-1 bg-navy-50/40 px-4 py-6 md:px-6 print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
