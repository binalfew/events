import { hash } from "bcryptjs";
import type { PrismaClient } from "../../app/generated/prisma/client.js";

let counter = 0;
function unique() {
  return ++counter;
}

export function buildTenant(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    name: `Test Org ${n}`,
    email: `org${n}@test.com`,
    phone: `+1-555-000-${String(n).padStart(4, "0")}`,
    subscriptionPlan: "PROFESSIONAL",
    ...overrides,
  };
}

export function buildUser(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    email: `user${n}@test.com`,
    username: `testuser${n}`,
    name: `Test User ${n}`,
    status: "ACTIVE" as const,
    ...overrides,
  };
}

export function buildEvent(overrides?: Record<string, unknown>) {
  const n = unique();
  const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  return {
    name: `Test Event ${n}`,
    description: `Description for test event ${n}`,
    status: "DRAFT" as const,
    startDate,
    endDate,
    ...overrides,
  };
}

export async function seedFullScenario(prisma: PrismaClient) {
  const tenant = await prisma.tenant.create({ data: buildTenant() });
  const passwordHash = await hash("TestPassword123!", 10);
  const user = await prisma.user.create({
    data: {
      ...buildUser(),
      tenantId: tenant.id,
      password: { create: { hash: passwordHash } },
    },
  });
  const event = await prisma.event.create({
    data: {
      ...buildEvent(),
      tenantId: tenant.id,
    },
  });
  return { tenant, user, event };
}
