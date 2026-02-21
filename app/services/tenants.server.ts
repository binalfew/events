import { prisma } from "~/lib/db.server";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class TenantError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "TenantError";
  }
}

export async function listTenants() {
  return prisma.tenant.findMany({
    where: { slug: { not: "admin" } },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, events: true } },
    },
  });
}

export async function getTenant(id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id },
  });
  if (!tenant) {
    throw new TenantError("Tenant not found", 404);
  }
  return tenant;
}

export async function getTenantBySlug(slug: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { slug },
  });
  if (!tenant) {
    throw new TenantError("Tenant not found", 404);
  }
  return tenant;
}

export async function getTenantWithCounts(id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id },
    include: {
      _count: { select: { users: true, events: true } },
    },
  });
  if (!tenant) {
    throw new TenantError("Tenant not found", 404);
  }
  return tenant;
}

interface CreateTenantInput {
  name: string;
  slug: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  subscriptionPlan?: string;
  logoUrl?: string;
  brandTheme?: string;
}

export async function createTenant(input: CreateTenantInput, ctx: ServiceContext) {
  let tenant;
  try {
    tenant = await prisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        email: input.email,
        phone: input.phone,
        website: input.website || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        country: input.country || null,
        subscriptionPlan: input.subscriptionPlan ?? "free",
        logoUrl: input.logoUrl || null,
        brandTheme: input.brandTheme || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new TenantError("A tenant with this name or email already exists", 409);
    }
    throw error;
  }

  // Seed default roles for the new tenant
  const defaultRoles = [
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

  for (const r of defaultRoles) {
    await prisma.role.create({
      data: { tenantId: tenant.id, name: r.name, description: r.description, scope: r.scope },
    });
  }

  // Grant all permissions to the TENANT_ADMIN role
  const tenantAdminRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: "TENANT_ADMIN" },
  });
  if (tenantAdminRole) {
    const allPermissions = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: tenantAdminRole.id,
        permissionId: p.id,
        access: "any",
      })),
      skipDuplicates: true,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Tenant",
      entityId: tenant.id,
      description: `Created tenant "${tenant.name}"`,
      metadata: { name: tenant.name, subscriptionPlan: tenant.subscriptionPlan },
    },
  });

  return tenant;
}

interface UpdateTenantInput {
  name: string;
  slug: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  subscriptionPlan: string;
  logoUrl?: string;
  brandTheme?: string;
}

export async function updateTenant(id: string, input: UpdateTenantInput, ctx: ServiceContext) {
  const existing = await prisma.tenant.findFirst({ where: { id } });
  if (!existing) {
    throw new TenantError("Tenant not found", 404);
  }

  let tenant;
  try {
    tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        email: input.email,
        phone: input.phone,
        website: input.website || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        country: input.country || null,
        subscriptionPlan: input.subscriptionPlan,
        logoUrl: input.logoUrl || null,
        brandTheme: input.brandTheme || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new TenantError("A tenant with this name or email already exists", 409);
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Tenant",
      entityId: tenant.id,
      description: `Updated tenant "${tenant.name}"`,
      metadata: { name: tenant.name, subscriptionPlan: tenant.subscriptionPlan },
    },
  });

  return tenant;
}

export async function deleteTenant(id: string, ctx: ServiceContext) {
  const existing = await prisma.tenant.findFirst({
    where: { id },
    include: { _count: { select: { users: true, events: true } } },
  });
  if (!existing) {
    throw new TenantError("Tenant not found", 404);
  }

  if (existing._count.users > 0) {
    throw new TenantError(
      `Cannot delete tenant with ${existing._count.users} user(s). Remove all users first.`,
      409,
    );
  }

  if (existing._count.events > 0) {
    throw new TenantError(
      `Cannot delete tenant with ${existing._count.events} event(s). Remove all events first.`,
      409,
    );
  }

  await prisma.tenant.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: "DELETE",
      entityType: "Tenant",
      entityId: id,
      description: `Deleted tenant "${existing.name}"`,
      metadata: { name: existing.name },
    },
  });
}
