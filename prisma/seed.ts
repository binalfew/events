import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { name: "Default Organization" },
    update: {},
    create: {
      name: "Default Organization",
      email: "admin@example.com",
      phone: "+1-000-000-0000",
      subscriptionPlan: "enterprise",
      featureFlags: { customObjects: true, advancedWorkflow: true },
    },
  });

  console.log(`Seeded tenant: ${tenant.name} (${tenant.id})`);

  const passwordHash = await hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      name: "System Admin",
      tenantId: tenant.id,
      password: {
        create: { hash: passwordHash },
      },
    },
  });

  console.log(`Seeded admin user: ${admin.email} (${admin.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
