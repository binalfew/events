import { data } from "react-router";
import { requireUser } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";

export async function requireAuth(request: Request) {
  const user = await requireUser(request);
  const roles = user.userRoles.map((ur) => ur.role.name);
  return { user, roles };
}

export async function requireRole(request: Request, roleName: string) {
  const { user, roles } = await requireAuth(request);
  if (!roles.includes(roleName)) {
    throw data({ error: "Forbidden" }, { status: 403 });
  }
  return { user, roles };
}

export async function requireAnyRole(request: Request, roleNames: string[]) {
  const { user, roles } = await requireAuth(request);
  if (!roleNames.some((name) => roles.includes(name))) {
    throw data({ error: "Forbidden" }, { status: 403 });
  }
  return { user, roles };
}

export async function requirePermission(request: Request, resource: string, action: string) {
  const { user, roles } = await requireAuth(request);
  const permitted = await hasPermission(user.id, resource, action);
  if (!permitted) {
    throw data({ error: "Forbidden" }, { status: 403 });
  }
  return { user, roles };
}

export async function hasPermission(
  userId: string,
  resource: string,
  action: string,
): Promise<boolean> {
  try {
    const count = await prisma.userRole.count({
      where: {
        userId,
        role: {
          rolePermissions: {
            some: {
              permission: { resource, action },
            },
          },
        },
      },
    });
    return count > 0;
  } catch {
    return false;
  }
}
