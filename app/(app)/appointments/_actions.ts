"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

async function requireAppointmentsEnabled() {
  const settings = await prisma.businessSettings.findUniqueOrThrow({ where: { id: "singleton" } });
  if (!settings.appointmentsEnabled) throw new Error("Appointments module is disabled.");
}

export async function createAppointment(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "appointments.view")) {
    return { ok: false, error: "Not authorized." };
  }
  await requireAppointmentsEnabled();

  const customerName = String(formData.get("customerName") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const serviceProductId = String(formData.get("serviceProductId") ?? "") || null;
  const serviceName = String(formData.get("serviceName") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const staffId = String(formData.get("staffId") ?? "") || null;
  const visitModeId = String(formData.get("visitModeId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!customerName || !whatsapp || !serviceName || !date || !time) {
    return { ok: false, error: "Customer name, WhatsApp, service, date, and time are required." };
  }

  const customer = await prisma.customer.findUnique({ where: { whatsapp } });

  await prisma.appointment.create({
    data: {
      customerId: customer?.id,
      customerName,
      whatsapp,
      serviceProductId,
      serviceName,
      date: new Date(date),
      time,
      staffId,
      visitModeId,
      notes,
    },
  });

  revalidatePath("/appointments");
  return { ok: true };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "BOOKED" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "appointments.view")) {
    throw new Error("Not authorized.");
  }
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  revalidatePath("/appointments");
}

export async function deleteAppointment(appointmentId: string) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "appointments.delete")) {
    throw new Error("Not authorized.");
  }
  await prisma.appointment.delete({ where: { id: appointmentId } });
  revalidatePath("/appointments");
}
