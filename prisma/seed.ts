import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Tenant ───────────────────────────────────────────
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

  // ─── Admin User ───────────────────────────────────────
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

  // ─── Permissions ──────────────────────────────────────
  const permissionDefs = [
    { resource: "participant", action: "create" },
    { resource: "participant", action: "read" },
    { resource: "participant", action: "update" },
    { resource: "participant", action: "delete" },
    { resource: "participant", action: "approve" },
    { resource: "participant", action: "reject" },
    { resource: "participant", action: "print" },
    { resource: "participant", action: "collect" },
    { resource: "workflow", action: "create" },
    { resource: "workflow", action: "read" },
    { resource: "workflow", action: "update" },
    { resource: "workflow", action: "delete" },
    { resource: "field", action: "create" },
    { resource: "field", action: "read" },
    { resource: "field", action: "update" },
    { resource: "field", action: "delete" },
    { resource: "form", action: "create" },
    { resource: "form", action: "read" },
    { resource: "form", action: "update" },
    { resource: "form", action: "delete" },
    { resource: "event", action: "create" },
    { resource: "event", action: "read" },
    { resource: "event", action: "update" },
    { resource: "settings", action: "manage" },
    { resource: "feature-flag", action: "manage" },
  ];

  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: p.resource, action: p.action } },
        update: {},
        create: p,
      }),
    ),
  );
  console.log(`Seeded ${permissions.length} permissions`);

  // ─── Roles ────────────────────────────────────────────
  const roleDefs = [
    { name: "ADMIN", description: "Full access to all resources" },
    { name: "VALIDATOR", description: "Can review and approve participants" },
    { name: "PRINTER", description: "Can print badges" },
    { name: "DISPATCHER", description: "Can collect and dispatch badges" },
    { name: "VIEWER", description: "Read-only access" },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: r.name } },
      update: {},
      create: { tenantId: tenant.id, ...r },
    });
    roles[r.name] = role;
  }
  console.log(`Seeded ${Object.keys(roles).length} roles`);

  // ─── Role Permissions ─────────────────────────────────
  // Build permission lookup by resource:action
  const permMap = new Map(permissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  const rolePermissionAssignments: Record<string, string[]> = {
    ADMIN: permissionDefs.map((p) => `${p.resource}:${p.action}`),
    VALIDATOR: [
      "participant:read",
      "participant:update",
      "participant:approve",
      "participant:reject",
    ],
    PRINTER: ["participant:read", "participant:print"],
    DISPATCHER: ["participant:read", "participant:collect"],
    VIEWER: ["participant:read", "workflow:read", "field:read", "form:read", "event:read"],
  };

  for (const [roleName, permKeys] of Object.entries(rolePermissionAssignments)) {
    const roleId = roles[roleName].id;
    for (const key of permKeys) {
      const permissionId = permMap.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
  console.log("Seeded role-permission assignments");

  // ─── User Role (admin gets ADMIN role, global) ────────
  await prisma.userRole.createMany({
    data: [{ userId: admin.id, roleId: roles.ADMIN.id, eventId: null }],
    skipDuplicates: true,
  });
  console.log("Seeded admin user-role assignment");

  // ─── Event ────────────────────────────────────────────
  const event = await prisma.event.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "AU Summit 2026" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "AU Summit 2026",
      description: "African Union Summit 2026 — flagship accreditation event",
      status: "DRAFT",
      startDate: new Date("2026-07-01T08:00:00Z"),
      endDate: new Date("2026-07-05T18:00:00Z"),
    },
  });
  console.log(`Seeded event: ${event.name} (${event.id})`);

  // ─── Participant Type ─────────────────────────────────
  const participantType = await prisma.participantType.upsert({
    where: {
      tenantId_eventId_code: { tenantId: tenant.id, eventId: event.id, code: "DEL" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      eventId: event.id,
      name: "Delegate",
      code: "DEL",
      description: "Official delegate attending the summit",
    },
  });
  console.log(`Seeded participant type: ${participantType.name} (${participantType.code})`);

  // ─── Workflow with Steps ──────────────────────────────
  const workflow = await prisma.workflow.upsert({
    where: {
      tenantId_eventId_name: {
        tenantId: tenant.id,
        eventId: event.id,
        name: "Standard Accreditation",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      eventId: event.id,
      name: "Standard Accreditation",
      description: "Default 3-step accreditation workflow: Review → Approval → Badge Printing",
      status: "PUBLISHED",
    },
  });
  console.log(`Seeded workflow: ${workflow.name} (${workflow.id})`);

  // Upsert steps by unique (workflowId, order)
  const reviewStep = await prisma.step.upsert({
    where: { workflowId_order: { workflowId: workflow.id, order: 1 } },
    update: {},
    create: {
      workflowId: workflow.id,
      name: "Review",
      description: "Initial document and data review",
      order: 1,
      stepType: "REVIEW",
      isEntryPoint: true,
    },
  });

  const approvalStep = await prisma.step.upsert({
    where: { workflowId_order: { workflowId: workflow.id, order: 2 } },
    update: {},
    create: {
      workflowId: workflow.id,
      name: "Approval",
      description: "Approve or reject the participant",
      order: 2,
      stepType: "APPROVAL",
    },
  });

  const printStep = await prisma.step.upsert({
    where: { workflowId_order: { workflowId: workflow.id, order: 3 } },
    update: {},
    create: {
      workflowId: workflow.id,
      name: "Badge Printing",
      description: "Print the participant badge",
      order: 3,
      stepType: "PRINT",
      isTerminal: true,
    },
  });

  // Set routing: Review → Approval → Printing, Approval rejection → Review
  await prisma.step.update({
    where: { id: reviewStep.id },
    data: { nextStepId: approvalStep.id },
  });
  await prisma.step.update({
    where: { id: approvalStep.id },
    data: { nextStepId: printStep.id, rejectionTargetId: reviewStep.id },
  });

  console.log(
    `Seeded 3 workflow steps: ${reviewStep.name} → ${approvalStep.name} → ${printStep.name}`,
  );

  // ─── Field Definitions (for dynamic form testing) ───
  const fieldDefs = [
    {
      name: "passport_number",
      label: "Passport Number",
      dataType: "TEXT" as const,
      isRequired: true,
      sortOrder: 1,
      config: { placeholder: "e.g. AB1234567", maxLength: 20 },
    },
    {
      name: "date_of_birth",
      label: "Date of Birth",
      dataType: "DATE" as const,
      isRequired: true,
      sortOrder: 2,
    },
    {
      name: "dietary_requirements",
      label: "Dietary Requirements",
      dataType: "ENUM" as const,
      isRequired: false,
      sortOrder: 3,
      config: {
        options: [
          { value: "none", label: "None" },
          { value: "vegetarian", label: "Vegetarian" },
          { value: "vegan", label: "Vegan" },
          { value: "halal", label: "Halal" },
          { value: "kosher", label: "Kosher" },
          { value: "gluten_free", label: "Gluten Free" },
        ],
      },
    },
    {
      name: "bio",
      label: "Short Biography",
      dataType: "LONG_TEXT" as const,
      isRequired: false,
      sortOrder: 4,
      config: { maxLength: 500, rows: 4 },
    },
    {
      name: "vip",
      label: "VIP Access Required",
      dataType: "BOOLEAN" as const,
      isRequired: false,
      sortOrder: 5,
    },
    {
      name: "delegation_size",
      label: "Delegation Size",
      dataType: "NUMBER" as const,
      isRequired: false,
      sortOrder: 6,
      config: { min: 1, max: 100, placeholder: "Number of delegates" },
    },
    {
      name: "contact_email",
      label: "Contact Email",
      dataType: "EMAIL" as const,
      isRequired: true,
      sortOrder: 7,
      config: { placeholder: "delegate@example.org" },
    },
    {
      name: "languages_spoken",
      label: "Languages Spoken",
      dataType: "MULTI_ENUM" as const,
      isRequired: false,
      sortOrder: 8,
      config: {
        options: [
          { value: "en", label: "English" },
          { value: "fr", label: "French" },
          { value: "ar", label: "Arabic" },
          { value: "pt", label: "Portuguese" },
          { value: "sw", label: "Swahili" },
        ],
      },
    },
  ];

  for (const fd of fieldDefs) {
    await prisma.fieldDefinition.upsert({
      where: {
        tenantId_eventId_participantTypeId_entityType_name: {
          tenantId: tenant.id,
          eventId: event.id,
          participantTypeId: participantType.id,
          entityType: "Participant",
          name: fd.name,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        eventId: event.id,
        participantTypeId: participantType.id,
        entityType: "Participant",
        name: fd.name,
        label: fd.label,
        dataType: fd.dataType,
        isRequired: fd.isRequired,
        sortOrder: fd.sortOrder,
        config: fd.config ?? {},
      },
    });
  }
  console.log(`Seeded ${fieldDefs.length} field definitions`);

  // ─── Feature Flags ──────────────────────────────────────
  const defaultFlags = [
    { key: "FF_VISUAL_FORM_DESIGNER", description: "Enable visual form designer UI" },
    { key: "FF_SSE_UPDATES", description: "Real-time SSE updates to queues" },
    { key: "FF_KEYBOARD_SHORTCUTS", description: "Keyboard shortcut support" },
    { key: "FF_NOTIFICATIONS", description: "Notification system" },
    { key: "FF_GLOBAL_SEARCH", description: "Cross-event participant search" },
  ];

  for (const flag of defaultFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: {
        key: flag.key,
        description: flag.description,
        enabled: false,
      },
    });
  }
  console.log(`Seeded ${defaultFlags.length} feature flags`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
