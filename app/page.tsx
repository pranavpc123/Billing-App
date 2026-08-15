import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function Home() {
  const session = await auth();
  redirect(can(session?.user.role, "dashboard") ? "/dashboard" : "/billing/new");
}
