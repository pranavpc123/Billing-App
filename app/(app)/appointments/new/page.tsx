import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AppointmentForm } from "./AppointmentForm";

export default async function NewAppointmentPage() {
  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });
  if (!settings.appointmentsEnabled) notFound();

  const [services, staff, visitModes] = await Promise.all([
    prisma.serviceProduct.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.visitMode.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-2xl font-semibold text-navy-500">New Appointment</h1>
      <p className="mt-1 text-sm text-navy-300">Book a service appointment for a customer.</p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardBody>
          <AppointmentForm services={services} staff={staff} visitModes={visitModes} />
        </CardBody>
      </Card>
    </div>
  );
}
