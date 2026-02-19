import { prisma } from "~/lib/db.server";

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RoleError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "RoleError";
  }
}

export async function listRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { userRoles: true, rolePermissions: true } },
    },
  });
}

export async function getRole(id: string, tenantId: string) {
  const role = await prisma.role.findFirst({
    where: { id, tenantId },
    include: {
      rolePermissions: { include: { permission: true } },
    },
  });
  if (!role) {
    throw new RoleError("Role not found", 404);
  }
  return role;
}

export async function getRoleWithCounts(id: string, tenantId: string) {
  const role = await prisma.role.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { userRoles: true, rolePermissions: true } },
    },
  });
  if (!role) {
    throw new RoleError("Role not found", 404);
  }
  return role;
}

interface CreateRoleInput {
  name: string;
  description?: string;
}

export async function createRole(input: CreateRoleInput, ctx: ServiceContext) {
  let role;
  try {
    role = await prisma.role.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new RoleError("A role with this name already exists", 409);
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Role",
      entityId: role.id,
      description: `Created role "${role.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: role.name },
    },
  });

  return role;
}

interface UpdateRoleInput {
  name: string;
  description?: string;
}

export async function updateRole(id: string, input: UpdateRoleInput, ctx: ServiceContext) {
  const existing = await prisma.role.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!existing) {
    throw new RoleError("Role not found", 404);
  }

  let role;
  try {
    role = await prisma.role.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      throw new RoleError("A role with this name already exists", 409);
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Role",
      entityId: id,
      description: `Updated role "${role.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        before: { name: existing.name, description: existing.description },
        after: { name: role.name, description: role.description },
      },
    },
  });

  return role;
}

export async function deleteRole(id: string, ctx: ServiceContext) {
  const existing = await prisma.role.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { _count: { select: { userRoles: true, rolePermissions: true } } },
  });
  if (!existing) {
    throw new RoleError("Role not found", 404);
  }

  if (existing._count.userRoles > 0) {
    throw new RoleError(
      `Cannot delete role with ${existing._count.userRoles} assigned user(s). Unassign all users first.`,
      409,
    );
  }

  await prisma.role.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "Role",
      entityId: id,
      description: `Deleted role "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name },
    },
  });
}

export async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
}

export async function assignPermissions(
  roleId: string,
  permissionIds: string[],
  ctx: ServiceContext,
) {
  const existing = await prisma.role.findFirst({
    where: { id: roleId, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new RoleError("Role not found", 404);
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Role",
      entityId: roleId,
      description: `Updated permission assignments for role "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { permissionCount: permissionIds.length },
    },
  });
}
