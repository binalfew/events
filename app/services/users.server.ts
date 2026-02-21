import { prisma } from "~/lib/db.server";
import { hashPassword } from "~/lib/auth.server";

interface ServiceContext {
  userId: string;
  tenantId: string;
  isSuperAdmin?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export class UserError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export async function listUsers(tenantId?: string) {
  return prisma.user.findMany({
    where: { ...(tenantId ? { tenantId } : {}), deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      tenant: { select: { name: true, slug: true } },
      userRoles: { where: { eventId: null }, include: { role: true } },
      _count: { select: { sessions: true } },
    },
  });
}

export async function getUser(id: string, tenantId?: string) {
  const user = await prisma.user.findFirst({
    where: { id, ...(tenantId ? { tenantId } : {}), deletedAt: null },
    include: {
      userRoles: { where: { eventId: null }, include: { role: true } },
    },
  });
  if (!user) {
    throw new UserError("User not found", 404);
  }
  return user;
}

export async function getUserWithCounts(id: string, tenantId?: string) {
  const user = await prisma.user.findFirst({
    where: { id, ...(tenantId ? { tenantId } : {}), deletedAt: null },
    include: {
      userRoles: { where: { eventId: null }, include: { role: true } },
      _count: { select: { sessions: true, userRoles: true } },
    },
  });
  if (!user) {
    throw new UserError("User not found", 404);
  }
  return user;
}

interface CreateUserInput {
  email: string;
  username: string;
  name?: string;
  status?: string;
  password: string;
  tenantId?: string;
}

export async function createUser(input: CreateUserInput, ctx: ServiceContext) {
  const passwordHash = await hashPassword(input.password);
  const targetTenantId = input.tenantId || ctx.tenantId;

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        name: input.name || null,
        status: (input.status as any) ?? "ACTIVE",
        tenantId: targetTenantId,
        password: {
          create: { hash: passwordHash },
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new UserError("A user with this email or username already exists", 409);
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      description: `Created user "${user.email}" (${user.username})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { email: user.email, username: user.username },
    },
  });

  return user;
}

interface UpdateUserInput {
  email: string;
  username: string;
  name?: string;
  status?: string;
}

export async function updateUser(id: string, input: UpdateUserInput, ctx: ServiceContext) {
  const existing = await prisma.user.findFirst({
    where: { id, ...(ctx.isSuperAdmin ? {} : { tenantId: ctx.tenantId }), deletedAt: null },
  });
  if (!existing) {
    throw new UserError("User not found", 404);
  }

  let user;
  try {
    user = await prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        username: input.username,
        name: input.name || null,
        status: (input.status as any) ?? existing.status,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new UserError("A user with this email or username already exists", 409);
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      description: `Updated user "${user.email}" (${user.username})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        before: { email: existing.email, username: existing.username, status: existing.status },
        after: { email: user.email, username: user.username, status: user.status },
      },
    },
  });

  return user;
}

export async function deleteUser(id: string, ctx: ServiceContext) {
  const existing = await prisma.user.findFirst({
    where: { id, ...(ctx.isSuperAdmin ? {} : { tenantId: ctx.tenantId }), deletedAt: null },
    include: { _count: { select: { sessions: true, userRoles: true } } },
  });
  if (!existing) {
    throw new UserError("User not found", 404);
  }

  if (existing.id === ctx.userId) {
    throw new UserError("You cannot delete your own account", 409);
  }

  // Prevent deletion of system admin accounts (users with GLOBAL-scope roles)
  const globalRole = await prisma.userRole.findFirst({
    where: {
      userId: id,
      role: { scope: "GLOBAL" },
    },
    select: { role: { select: { name: true } } },
  });
  if (globalRole) {
    throw new UserError(
      `Cannot delete a system administrator. Remove the "${globalRole.role.name}" role first.`,
      403,
    );
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "User",
      entityId: id,
      description: `Soft-deleted user "${existing.email}" (${existing.username})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { email: existing.email, username: existing.username },
    },
  });
}

export async function changePassword(id: string, password: string, ctx: ServiceContext) {
  const existing = await prisma.user.findFirst({
    where: { id, ...(ctx.isSuperAdmin ? {} : { tenantId: ctx.tenantId }), deletedAt: null },
  });
  if (!existing) {
    throw new UserError("User not found", 404);
  }

  const passwordHash = await hashPassword(password);

  await prisma.password.upsert({
    where: { userId: id },
    update: { hash: passwordHash },
    create: { userId: id, hash: passwordHash },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      description: `Changed password for user "${existing.email}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { email: existing.email },
    },
  });
}

export async function assignRoles(userId: string, roleIds: string[], ctx: ServiceContext) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...(ctx.isSuperAdmin ? {} : { tenantId: ctx.tenantId }), deletedAt: null },
  });
  if (!existing) {
    throw new UserError("User not found", 404);
  }

  await prisma.userRole.deleteMany({
    where: { userId, eventId: null },
  });

  if (roleIds.length > 0) {
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
        eventId: null,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      description: `Updated role assignments for user "${existing.email}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { roleIds },
    },
  });
}

export async function getUserRoles(userId: string) {
  return prisma.userRole.findMany({
    where: { userId, eventId: null },
    include: { role: true },
  });
}
