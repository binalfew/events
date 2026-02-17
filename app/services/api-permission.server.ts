// ─── API Permission Checking ──────────────────────────────

/**
 * Check if the given API key permissions include the required permission.
 * Supports exact match and wildcard (e.g., "events:*" matches "events:read").
 */
export function checkApiPermission(apiKeyPermissions: string[], required: string): boolean {
  for (const perm of apiKeyPermissions) {
    if (perm === required) return true;

    // Wildcard: "events:*" matches any "events:<action>"
    if (perm.endsWith(":*")) {
      const resource = perm.slice(0, -2);
      if (required.startsWith(resource + ":")) return true;
    }

    // Full wildcard
    if (perm === "*") return true;
  }

  return false;
}

/**
 * Require a specific permission. Throws 403 if not allowed.
 */
export function requireApiPermission(
  permissions: string[],
  resource: string,
  action: string,
): void {
  const required = `${resource}:${action}`;
  if (!checkApiPermission(permissions, required)) {
    const error = new Error(`API key lacks required permission: ${required}`);
    (error as any).status = 403;
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

/**
 * Map HTTP method to CRUD action.
 */
export function methodToAction(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
    case "HEAD":
      return "read";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "read";
  }
}
