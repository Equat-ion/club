import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "@/lib/db";
import {
  member,
  memberRoleAssignments,
  orgRolePermissions,
  memberPermissionGrants,
  enterpriseMemberState,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { resolveEffectivePermissions } from "@/lib/authz/effective-permissions";
import { SYSTEM_PERMISSIONS } from "@/lib/authz/definitions";

/**
 * Get the current session in a Server Component or Server Action.
 * Redirects to /sign-in if no session is found.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

/**
 * Get the current session without redirecting.
 * Returns null if no session.
 */
export async function getOptionalSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export type SessionOrgAccess = {
  orgId: string;
  memberId: string;
  legacyRole: string;
  effectivePermissions: string[];
  enterpriseStatus: "active" | "pending_review" | "deprovisioned" | "suspended";
  orgSwitchingLocked: boolean;
};

/**
 * Resolves enterprise membership status and effective permissions for the current user in an organization.
 */
export async function getSessionOrgAccess(orgId: string): Promise<SessionOrgAccess> {
  const session = await getSession();
  const userId = session.user.id;

  const mem = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, userId),
    ),
  });

  if (!mem) {
    throw new Error("User is not a member of this organization");
  }

  const assignments = await db.select()
    .from(memberRoleAssignments)
    .where(eq(memberRoleAssignments.memberId, mem.id));
  const roleIds = assignments.map((a) => a.roleId);

  let rolePermissions: string[][] = [];
  if (roleIds.length > 0) {
    const perms = await db.select()
      .from(orgRolePermissions)
      .where(inArray(orgRolePermissions.roleId, roleIds));

    const grouped = new Map<string, string[]>();
    for (const p of perms) {
      if (!grouped.has(p.roleId)) {
        grouped.set(p.roleId, []);
      }
      grouped.get(p.roleId)!.push(p.permissionKey);
    }
    rolePermissions = Array.from(grouped.values());
  } else {
    // Fallback: assign default system permission sets based on legacy member role
    if (mem.role === "owner") {
      rolePermissions = [SYSTEM_PERMISSIONS.map((p) => p.key)];
    } else if (mem.role === "admin") {
      rolePermissions = [
        [
          "org.view",
          "members.view",
          "members.invite",
          "settings.view",
          "plugins.view",
          "tasks.view",
          "tasks.create",
          "tasks.edit",
        ],
      ];
    } else {
      rolePermissions = [
        [
          "org.view",
          "members.view",
          "tasks.view",
          "tasks.create",
        ],
      ];
    }
  }

  // Safety net: Organization creators/owners must never be locked out
  if (mem.role === "owner") {
    rolePermissions.push(SYSTEM_PERMISSIONS.map((p) => p.key));
  }

  const direct = await db.select()
    .from(memberPermissionGrants)
    .where(eq(memberPermissionGrants.memberId, mem.id));
  const directPermissions = direct.map((d) => d.permissionKey);

  const effectiveSet = resolveEffectivePermissions({
    rolePermissions,
    directPermissions,
  });

  const effectivePermissions = Array.from(effectiveSet);

  const entState = await db.query.enterpriseMemberState.findFirst({
    where: eq(enterpriseMemberState.memberId, mem.id),
  });

  const enterpriseStatus = (entState?.status ?? "active") as SessionOrgAccess["enterpriseStatus"];
  const orgSwitchingLocked = entState?.provisionSource === "scim" && !effectiveSet.has("enterprise.manage");

  return {
    orgId,
    memberId: mem.id,
    legacyRole: mem.role,
    effectivePermissions,
    enterpriseStatus,
    orgSwitchingLocked: !!orgSwitchingLocked,
  };
}
