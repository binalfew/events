import { PrismaClient } from "../../app/generated/prisma/client.js";
import { beforeEach, afterAll } from "vitest";

export const prisma = new PrismaClient();

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
