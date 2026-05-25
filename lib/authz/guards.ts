import { getSessionOrgAccess } from "@/lib/auth/session";

export async function requireOrgPermission(orgId: string, permissionKey: string) {
  const access = await getSessionOrgAccess(orgId);
  if (!access.effectivePermissions.includes(permissionKey)) {
    throw new Error(`Missing permission: ${permissionKey}`);
  }
  return access;
}
