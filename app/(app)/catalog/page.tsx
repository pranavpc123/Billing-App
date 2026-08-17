import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import {
  createCategory,
  createServiceProduct,
  deleteServiceProduct,
  toggleCategoryActive,
  updateServiceProduct,
} from "./_actions";

export default async function CatalogPage() {
  const session = await auth();
  const canEdit = can(session?.user.role, "catalog.edit");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { servicesOrProducts: { orderBy: { name: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy-500">Services & Products</h1>
        <p className="mt-1 text-sm text-navy-300">
          Manage your catalog — services, products, categories, and prices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <form key={c.id} action={toggleCategoryActive.bind(null, c.id, !c.active)}>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    c.active
                      ? "border-navy-200 bg-navy-50 text-navy-500"
                      : "border-navy-100 bg-white text-navy-300 line-through"
                  }`}
                >
                  {c.name}
                </button>
              </form>
            ))}
          </div>
          {canEdit && (
            <form action={createCategory} className="flex max-w-sm gap-2 pt-2">
              <Input name="name" placeholder="New category name" required />
              <Button type="submit" variant="secondary">
                Add
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Add Service / Product</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={createServiceProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Field label="Name" required>
                <Input name="name" required />
              </Field>
              <Field label="Category" required>
                <Select name="categoryId" required>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Type">
                <Select name="type" defaultValue="SERVICE">
                  <option value="SERVICE">Service</option>
                  <option value="PRODUCT">Product</option>
                </Select>
              </Field>
              <Field label="Default Price">
                <Input type="number" name="defaultPrice" min={0} step="0.01" defaultValue={0} />
              </Field>
              <div className="sm:col-span-4">
                <Button type="submit">Add to Catalog</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-navy-300">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canEdit && <th className="px-4 py-3 font-medium">Update</th>}
              </tr>
            </thead>
            <tbody>
              {categories.flatMap((c) =>
                c.servicesOrProducts.map((sp) => (
                  <tr key={sp.id} className="border-b border-navy-50">
                    <td className="px-4 py-3 text-navy-500">{sp.name}</td>
                    <td className="px-4 py-3 text-navy-400">{c.name}</td>
                    <td className="px-4 py-3 text-navy-400">{sp.type}</td>
                    <td className="px-4 py-3 text-navy-400">{formatMoney(sp.defaultPrice)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          sp.active ? "bg-green-50 text-green-700" : "bg-navy-50 text-navy-300"
                        }`}
                      >
                        {sp.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <ServiceProductEditForm
                          serviceProduct={sp}
                          categories={categories}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function ServiceProductEditForm({
  serviceProduct,
  categories,
}: {
  serviceProduct: { id: string; name: string; categoryId: string; type: string; defaultPrice: number; active: boolean };
  categories: { id: string; name: string }[];
}) {
  async function action(formData: FormData) {
    "use server";
    await updateServiceProduct(serviceProduct.id, formData);
  }

  async function removeAction() {
    "use server";
    await deleteServiceProduct(serviceProduct.id);
  }

  return (
    <details>
      <summary className="cursor-pointer text-navy-400 hover:text-navy-500">Edit</summary>
      <form action={action} className="mt-2 flex flex-wrap items-end gap-2">
        <Input name="name" defaultValue={serviceProduct.name} className="w-40" />
        <Select name="categoryId" defaultValue={serviceProduct.categoryId} className="w-32">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="type" defaultValue={serviceProduct.type} className="w-28">
          <option value="SERVICE">Service</option>
          <option value="PRODUCT">Product</option>
        </Select>
        <Input
          type="number"
          name="defaultPrice"
          defaultValue={serviceProduct.defaultPrice}
          min={0}
          step="0.01"
          className="w-24"
        />
        <label className="flex items-center gap-1.5 text-xs text-navy-400">
          <input type="checkbox" name="active" defaultChecked={serviceProduct.active} />
          Active
        </label>
        <Button type="submit" size="sm" variant="secondary">
          Save
        </Button>
      </form>
      <form action={removeAction} className="mt-2">
        <ConfirmSubmitButton
          confirmMessage={`Delete "${serviceProduct.name}" from the catalog? This cannot be undone.`}
          size="sm"
          variant="danger"
        >
          Delete
        </ConfirmSubmitButton>
      </form>
    </details>
  );
}
