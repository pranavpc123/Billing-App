import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = "Delsora@123";

async function main() {
  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "DELSORA",
      tagline: "Designer Boutique & Makeover Studio",
      whatsappNumber: "+918921549258",
      phoneNumber: "+91 89215 49258",
      email: "delsora2017boutique@gamil.com",
      address: "Edavanna, Wandoor Road, 676541",
      logoUrl: "/logo-mark.png",
      logoMarkUrl: "/logo-mark.png",
      invoicePrefix: "DL",
      invoiceNextNumber: 1,
      invoiceNumberPadding: 4,
      invoiceFooterText: "Thank you for shopping with DELSORA!",
    },
  });

  const users = [
    { email: "admin@delsora.local", name: "Admin", role: "ADMIN" as const },
    { email: "manager@delsora.local", name: "Manager", role: "MANAGER" as const },
    { email: "staff@delsora.local", name: "Billing Staff", role: "STAFF" as const },
  ];
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  const paymentMethods = ["Cash", "UPI", "Card", "Other"];
  for (const [i, name] of paymentMethods.entries()) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
  }

  const visitModes = ["Walk-in", "Online"];
  for (const [i, name] of visitModes.entries()) {
    await prisma.visitMode.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
  }

  const catalog: Record<string, { name: string; type: "SERVICE" | "PRODUCT"; price: number }[]> = {
    Boutique: [
      { name: "Ready-made Dress", type: "PRODUCT", price: 1500 },
      { name: "Customized Dress", type: "SERVICE", price: 2500 },
    ],
    Makeup: [
      { name: "Bridal Makeup", type: "SERVICE", price: 8000 },
      { name: "Party Makeup", type: "SERVICE", price: 3000 },
    ],
    Hair: [{ name: "Hair Treatment", type: "SERVICE", price: 1200 }],
    Beauty: [{ name: "Beauty Treatment", type: "SERVICE", price: 1500 }],
    Nails: [
      { name: "Nail Art", type: "SERVICE", price: 500 },
      { name: "Pedicure", type: "SERVICE", price: 600 },
      { name: "Manicure", type: "SERVICE", price: 400 },
    ],
    Other: [{ name: "Other", type: "SERVICE", price: 0 }],
  };

  let categorySort = 0;
  for (const [categoryName, items] of Object.entries(catalog)) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName, sortOrder: categorySort++ },
    });
    for (const item of items) {
      const existing = await prisma.serviceProduct.findFirst({
        where: { name: item.name, categoryId: category.id },
      });
      if (!existing) {
        await prisma.serviceProduct.create({
          data: {
            name: item.name,
            type: item.type,
            categoryId: category.id,
            defaultPrice: item.price,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Login with:");
  for (const u of users) {
    console.log(`  ${u.role.padEnd(7)} ${u.email}  password: ${SEED_PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
