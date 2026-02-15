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

export function buildRole(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    name: `Role ${n}`,
    description: `Test role ${n}`,
    ...overrides,
  };
}

export function buildParticipantType(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    name: `Type ${n}`,
    code: `T${n}`,
    description: `Test participant type ${n}`,
    ...overrides,
  };
}

export function buildWorkflow(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    name: `Workflow ${n}`,
    description: `Test workflow ${n}`,
    status: "DRAFT" as const,
    ...overrides,
  };
}

export function buildStep(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    name: `Step ${n}`,
    description: `Test step ${n}`,
    order: n,
    stepType: "REVIEW" as const,
    ...overrides,
  };
}

export function buildFieldDefinition(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    entityType: "Participant",
    name: `field_${n}`,
    label: `Field ${n}`,
    description: `Description for field ${n}`,
    dataType: "TEXT" as const,
    sortOrder: n,
    isRequired: false,
    isUnique: false,
    isSearchable: false,
    isFilterable: false,
    config: {},
    validation: [],
    ...overrides,
  };
}

export function buildParticipant(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    registrationCode: `REG-${String(n).padStart(6, "0")}`,
    firstName: `First${n}`,
    lastName: `Last${n}`,
    email: `participant${n}@test.com`,
    status: "PENDING" as const,
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

  const participantType = await prisma.participantType.create({
    data: {
      ...buildParticipantType(),
      tenantId: tenant.id,
      eventId: event.id,
    },
  });

  const workflow = await prisma.workflow.create({
    data: {
      ...buildWorkflow(),
      tenantId: tenant.id,
      eventId: event.id,
    },
  });

  const step = await prisma.step.create({
    data: {
      ...buildStep(),
      workflowId: workflow.id,
      isEntryPoint: true,
      isTerminal: true,
    },
  });

  return { tenant, user, event, participantType, workflow, step };
}
