import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { buildWaLink } from "@/lib/whatsapp";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateAppointmentStatus, deleteAppointment } from "./_actions";

const STATUS_STYLES: Record<string, string> = {
  BOOKED: "bg-navy-50 text-navy-500",
  CONFIRMED: "bg-gold-100 text-gold-800",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default async function AppointmentsPage() {
  const session = await auth();
  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });
  if (!settings.appointmentsEnabled) notFound();

  const canDelete = can(session?.user.role, "appointments.delete");

  const appointments = await prisma.appointment.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: { staff: true },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-500">Appointments</h1>
          <p className="mt-1 text-sm text-navy-300">Bookings, confirmations, and reminders.</p>
        </div>
        <Link href="/appointments/new">
          <Button>+ New Appointment</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const waMessage = `Hi ${a.customerName}, this is a reminder for your ${a.serviceName} appointment at ${settings.businessName} on ${new Date(
                  a.date
                ).toLocaleDateString("en-IN")} at ${a.time}.`;
                return (
                  <tr key={a.id} className="border-b border-navy-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy-500">{a.customerName}</p>
                      <p className="text-xs text-navy-300">{a.whatsapp}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-400">{a.serviceName}</td>
                    <td className="px-4 py-3 text-navy-400">
                      {new Date(a.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-navy-400">{a.time}</td>
                    <td className="px-4 py-3 text-navy-400">{a.staff?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status]}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.status === "BOOKED" && (
                          <StatusButton id={a.id} status="CONFIRMED" label="Confirm" />
                        )}
                        {(a.status === "BOOKED" || a.status === "CONFIRMED") && (
                          <StatusButton id={a.id} status="COMPLETED" label="Complete" />
                        )}
                        {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                          <StatusButton id={a.id} status="CANCELLED" label="Cancel" />
                        )}
                        <a
                          href={buildWaLink(a.whatsapp, waMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-navy-200 px-2 py-1 text-xs font-medium text-navy-500 hover:bg-navy-50"
                        >
                          WhatsApp
                        </a>
                        {canDelete && (
                          <form action={deleteAppointment.bind(null, a.id)}>
                            <button
                              type="submit"
                              className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-navy-300">
                    No appointments yet.
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

function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: "BOOKED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  label: string;
}) {
  return (
    <form action={updateAppointmentStatus.bind(null, id, status)}>
      <button
        type="submit"
        className="rounded-lg border border-navy-200 px-2 py-1 text-xs font-medium text-navy-500 hover:bg-navy-50"
      >
        {label}
      </button>
    </form>
  );
}
