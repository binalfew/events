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

  // ─── Second Tenant (for testing) ───────────────────────
  const tenant2 = await prisma.tenant.upsert({
    where: { name: "Test Organization" },
    update: {},
    create: {
      name: "Test Organization",
      email: "info@testorg.example.com",
      phone: "+1-555-123-4567",
      website: "https://testorg.example.com",
      subscriptionPlan: "starter",
    },
  });
  console.log(`Seeded tenant: ${tenant2.name} (${tenant2.id})`);

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

  // ─── Validator User ─────────────────────────────────
  const validator = await prisma.user.upsert({
    where: { email: "validator@example.com" },
    update: {},
    create: {
      email: "validator@example.com",
      username: "validator",
      name: "Validator User",
      tenantId: tenant.id,
      password: {
        create: { hash: passwordHash },
      },
    },
  });
  console.log(`Seeded validator user: ${validator.email} (${validator.id})`);

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
    { resource: "section-template", action: "create" },
    { resource: "section-template", action: "read" },
    { resource: "section-template", action: "update" },
    { resource: "section-template", action: "delete" },
    { resource: "settings", action: "manage" },
    { resource: "feature-flag", action: "manage" },
    { resource: "delegation", action: "manage" },
    { resource: "views", action: "create" },
    { resource: "custom-objects", action: "manage" },
    { resource: "analytics", action: "view" },
    { resource: "api-keys", action: "manage" },
    { resource: "webhooks", action: "manage" },
    { resource: "check-in", action: "scan" },
    { resource: "kiosk", action: "manage" },
    { resource: "bulk-operations", action: "execute" },
    { resource: "duplicates", action: "review" },
    { resource: "blacklist", action: "manage" },
    { resource: "waitlist", action: "manage" },
    { resource: "communication", action: "broadcast" },
    { resource: "event-clone", action: "execute" },

    // Phase 5 permissions
    { resource: "accommodation", action: "manage" },
    { resource: "transport", action: "manage" },
    { resource: "catering", action: "manage" },
    { resource: "parking", action: "manage" },
    { resource: "venue", action: "manage" },
    { resource: "protocol", action: "manage" },
    { resource: "bilateral", action: "manage" },
    { resource: "incident", action: "manage" },
    { resource: "incident", action: "report" },
    { resource: "staff", action: "manage" },
    { resource: "compliance", action: "manage" },
    { resource: "survey", action: "manage" },
    { resource: "certificate", action: "manage" },
    { resource: "command-center", action: "view" },
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
    { name: "ADMIN", description: "Full access to all resources", scope: "GLOBAL" as const },
    {
      name: "TENANT_ADMIN",
      description: "Full access within own tenant",
      scope: "TENANT" as const,
    },
    {
      name: "VALIDATOR",
      description: "Can review and approve participants",
      scope: "EVENT" as const,
    },
    { name: "PRINTER", description: "Can print badges", scope: "EVENT" as const },
    { name: "DISPATCHER", description: "Can collect and dispatch badges", scope: "EVENT" as const },
    { name: "VIEWER", description: "Read-only access", scope: "EVENT" as const },
    {
      name: "USER",
      description: "Default role for self-registered users",
      scope: "EVENT" as const,
    },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: r.name } },
      update: { scope: r.scope },
      create: { tenantId: tenant.id, name: r.name, description: r.description, scope: r.scope },
    });
    roles[r.name] = role;
  }
  console.log(`Seeded ${Object.keys(roles).length} roles`);

  // ─── Role Permissions ─────────────────────────────────
  // Build permission lookup by resource:action
  const permMap = new Map(permissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  // Role permission assignments with access scope ("any" = all records, "own" = own records only)
  const rolePermissionAssignments: Record<string, Array<{ key: string; access: string }>> = {
    ADMIN: permissionDefs.map((p) => ({ key: `${p.resource}:${p.action}`, access: "any" })),
    TENANT_ADMIN: permissionDefs.map((p) => ({ key: `${p.resource}:${p.action}`, access: "any" })),
    VALIDATOR: [
      { key: "participant:read", access: "any" },
      { key: "participant:update", access: "any" },
      { key: "participant:approve", access: "any" },
      { key: "participant:reject", access: "any" },
    ],
    PRINTER: [
      { key: "participant:read", access: "any" },
      { key: "participant:print", access: "any" },
    ],
    DISPATCHER: [
      { key: "participant:read", access: "any" },
      { key: "participant:collect", access: "any" },
    ],
    VIEWER: [
      { key: "participant:read", access: "own" },
      { key: "workflow:read", access: "any" },
      { key: "field:read", access: "any" },
      { key: "form:read", access: "any" },
      { key: "event:read", access: "any" },
    ],
    USER: [
      { key: "participant:read", access: "own" },
      { key: "event:read", access: "any" },
    ],
  };

  for (const [roleName, permEntries] of Object.entries(rolePermissionAssignments)) {
    const roleId = roles[roleName]?.id;
    if (!roleId) continue;
    for (const { key, access } of permEntries) {
      const permissionId = permMap.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: { access },
        create: { roleId, permissionId, access },
      });
    }
  }
  console.log("Seeded role-permission assignments");

  // ─── User Roles ──────────────────────────────────────
  // Use findFirst + create to avoid duplicates (NULL eventId defeats unique constraint)
  const userRoleAssignments = [
    { userId: admin.id, roleId: roles.ADMIN.id },
    { userId: validator.id, roleId: roles.VALIDATOR.id },
  ];
  for (const { userId, roleId } of userRoleAssignments) {
    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId, eventId: null },
    });
    if (!existing) {
      await prisma.userRole.create({
        data: { userId, roleId, eventId: null },
      });
    }
  }
  console.log("Seeded user-role assignments");

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
        tenantId_eventId_entityType_name: {
          tenantId: tenant.id,
          eventId: event.id,
          entityType: "Participant",
          name: fd.name,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        eventId: event.id,
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

  // ─── Global Field Definitions (shared across all events) ──
  const globalFieldDefs = [
    {
      name: "badge_name",
      label: "Badge Name",
      dataType: "TEXT" as const,
      isRequired: false,
      sortOrder: 0,
      config: { placeholder: "Name to display on badge", maxLength: 100 },
    },
    {
      name: "dietary_requirements",
      label: "Dietary Requirements",
      dataType: "ENUM" as const,
      isRequired: false,
      sortOrder: 1,
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
  ];

  for (const gfd of globalFieldDefs) {
    // Prisma upsert can't use partial unique index, so use findFirst + create
    const existing = await prisma.fieldDefinition.findFirst({
      where: {
        tenantId: tenant.id,
        eventId: null,
        entityType: "Participant",
        name: gfd.name,
      },
    });
    if (!existing) {
      await prisma.fieldDefinition.create({
        data: {
          tenantId: tenant.id,
          eventId: null,
          entityType: "Participant",
          name: gfd.name,
          label: gfd.label,
          dataType: gfd.dataType,
          isRequired: gfd.isRequired,
          sortOrder: gfd.sortOrder,
          config: gfd.config ?? {},
        },
      });
    }
  }
  console.log(`Seeded ${globalFieldDefs.length} global field definitions`);

  // ─── Feature Flags ──────────────────────────────────────
  const defaultFlags = [
    { key: "FF_VISUAL_FORM_DESIGNER", description: "Enable visual form designer UI" },
    { key: "FF_SSE_UPDATES", description: "Real-time SSE updates to queues" },
    { key: "FF_KEYBOARD_SHORTCUTS", description: "Keyboard shortcut support" },
    { key: "FF_NOTIFICATIONS", description: "Notification system" },
    { key: "FF_GLOBAL_SEARCH", description: "Cross-event participant search" },
    { key: "FF_I18N", description: "Internationalization and multi-language support" },
    {
      key: "FF_CONDITIONAL_ROUTING",
      description: "Conditional workflow routing based on participant data",
    },
    { key: "FF_STEP_ASSIGNMENT", description: "Step assignment and reassignment with strategies" },
    { key: "FF_AUTO_ACTIONS", description: "Automatic action rules engine for workflow steps" },
    { key: "FF_DELEGATION_PORTAL", description: "Delegation quota management and invite portal" },
    {
      key: "FF_SAVED_VIEWS",
      description: "Saved views with table, kanban, calendar, and gallery layouts",
    },
    { key: "FF_CUSTOM_OBJECTS", description: "Tenant-defined custom entity types" },
    { key: "FF_ANALYTICS_DASHBOARD", description: "Analytics dashboard with charts and metrics" },
    { key: "FF_PWA", description: "Progressive Web App shell and service worker" },
    { key: "FF_OFFLINE_MODE", description: "Offline mode with IndexedDB mutation queue and sync" },
    { key: "FF_REST_API", description: "REST API with API key authentication" },
    { key: "FF_WEBHOOKS", description: "Webhook subscriptions and event delivery" },
    { key: "FF_BULK_OPERATIONS", description: "Bulk import/export and batch status changes" },
    { key: "FF_EVENT_CLONE", description: "Event cloning with selective element copy" },
    { key: "FF_WAITLIST", description: "Waitlist management with auto-promotion" },
    { key: "FF_COMMUNICATION_HUB", description: "Broadcast messaging via email/SMS/push" },
    { key: "FF_KIOSK_MODE", description: "Self-service kiosk terminals for events" },
    { key: "FF_PARALLEL_WORKFLOWS", description: "Parallel workflow branches with fork/join" },

    // Phase 5 feature flags
    {
      key: "FF_ACCOMMODATION",
      description: "Hotel and room block management with auto-assignment",
    },
    { key: "FF_TRANSPORT", description: "Transport routes, vehicles, and transfer scheduling" },
    { key: "FF_CATERING", description: "Meal planning, dietary tracking, and voucher scanning" },
    { key: "FF_PROTOCOL_SEATING", description: "Protocol-aware seating plans and assignments" },
    {
      key: "FF_BILATERAL_SCHEDULER",
      description: "Bilateral meeting request and scheduling system",
    },
    { key: "FF_INCIDENT_MANAGEMENT", description: "Incident reporting, tracking, and escalation" },
    { key: "FF_STAFF_MANAGEMENT", description: "Staff roster and shift scheduling" },
    {
      key: "FF_COMPLIANCE_DASHBOARD",
      description: "Document compliance tracking and data retention policies",
    },
    { key: "FF_SURVEYS", description: "Post-event surveys and feedback collection" },
    { key: "FF_CERTIFICATES", description: "Certificate generation and verification" },
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
