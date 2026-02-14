import { PrismaClient } from "../../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { beforeEach, afterAll } from "vitest";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });

// Truncate all tables in correct FK order before each test
beforeEach(async () => {
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.password.deleteMany(),
    prisma.event.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
