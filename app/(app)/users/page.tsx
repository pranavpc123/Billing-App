import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreateUserForm } from "./CreateUserForm";
import { RoleSelect } from "./RoleSelect";
import { UserEditForm } from "./UserEditForm";
import { DeleteUserButton } from "./DeleteUserButton";
import { toggleUserActive, updateUserRole } from "./_actions";

export default async function UsersPage() {
  const session = await auth();
  if (!can(session?.user.role, "users.edit")) {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        You don&apos;t have permission to view Users & Staff.
      </p>
    );
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-500">Users & Staff</h1>
        <p className="mt-1 text-sm text-navy-300">
          Admins manage system settings. Managers run day-to-day operations. Billing staff
          handle sales at the counter.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add User</CardTitle>
        </CardHeader>
        <CardBody>
          <CreateUserForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
                <th className="px-4 py-3 font-medium">Delete</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === session?.user.id;
                async function changeRole(formData: FormData) {
                  "use server";
                  await updateUserRole(u.id, formData.get("role") as "ADMIN" | "MANAGER" | "STAFF");
                }
                return (
                  <tr key={u.id} className="border-b border-navy-50">
                    <td className="px-4 py-3 text-navy-500">
                      {u.name} {isSelf && <span className="text-xs text-navy-300">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-navy-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleSelect action={changeRole} defaultValue={u.role} disabled={isSelf} />
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleUserActive.bind(null, u.id, !u.active)}>
                        <button
                          type="submit"
                          disabled={isSelf}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.active ? "bg-green-50 text-green-700" : "bg-navy-50 text-navy-300"
                          }`}
                        >
                          {u.active ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <UserEditForm userId={u.id} name={u.name} email={u.email} />
                    </td>
                    <td className="px-4 py-3">
                      <DeleteUserButton userId={u.id} disabled={isSelf} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
