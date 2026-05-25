"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import {
  orgProfiles,
  enterpriseConnections,
  enterpriseMemberState,
  memberRoleAssignments,
  member,
  organization,
  enterpriseGroupMappings,
  user,
} from "@/lib/db/schema";
import { requireOrgPermission } from "@/lib/authz/guards";
import { createId } from "@paralleldrive/cuid2";

/**
 * Enable enterprise mode permanently for an organization.
 */
export async function enableEnterpriseMode(input: {
  orgId: string;
  confirmationText: string;
}): Promise<{ success: boolean; error?: string }> {
  if (input.confirmationText !== "ENABLE ENTERPRISE") {
    return { success: false, error: "Confirmation text does not match" };
  }

  try {
    // Check permission: enterprise.manage
    await requireOrgPermission(input.orgId, "enterprise.manage");
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }

  const profile = await db.query.orgProfiles.findFirst({
    where: eq(orgProfiles.id, input.orgId),
  });

  if (!profile) {
    return { success: false, error: "Organization profile not found" };
  }

  if (profile.enterpriseModeEnabled) {
    return { success: false, error: "Enterprise mode is already enabled" };
  }

  await db.update(orgProfiles)
    .set({
      enterpriseModeEnabled: true,
      enterpriseModeEnabledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orgProfiles.id, input.orgId));

  // Initialize enterprise connection record if it doesn't exist
  const existingConn = await db.query.enterpriseConnections.findFirst({
    where: eq(enterpriseConnections.orgId, input.orgId),
  });

  if (!existingConn) {
    await db.insert(enterpriseConnections).values({
      id: createId(),
      orgId: input.orgId,
      enabled: true,
    });
  } else {
    await db.update(enterpriseConnections)
      .set({ enabled: true, updatedAt: new Date() })
      .where(eq(enterpriseConnections.orgId, input.orgId));
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, input.orgId),
  });

  if (org) {
    revalidatePath(`/app/${org.slug}/settings`);
  }

  return { success: true };
}

/**
 * Generate SCIM Bearer token.
 */
export async function generateScimToken(input: {
  orgId: string;
  providerId: string;
}): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    await requireOrgPermission(input.orgId, "enterprise.manage");
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }

  try {
    // Generate SCIM token using Better Auth API
    // Note: The generateSCIMToken API can be invoked as auth.api.generateSCIMToken or similar
    const response = await auth.api.generateSCIMToken({
      headers: await headers(),
      body: {
        providerId: input.providerId,
        organizationId: input.orgId,
      },
    });

    if (!response || !response.scimToken) {
      return { success: false, error: "Failed to generate SCIM token" };
    }

    // Mask and update the SCIM connection token metadata
    const token = response.scimToken;
    const lastFour = token.slice(-4);
    
    // In a real environment, we'd hash the token to verify SCIM requests if needed,
    // but better-auth handles token verification. We just track metadata.
    await db.update(enterpriseConnections)
      .set({
        scimTokenLastFour: lastFour,
        scimProviderId: input.providerId,
        updatedAt: new Date(),
      })
      .where(eq(enterpriseConnections.orgId, input.orgId));

    return {
      success: true,
      token,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate SCIM token" };
  }
}

/**
 * Get the list of enterprise members awaiting review or suspended.
 */
export async function getEnterpriseReviewQueue(orgId: string) {
  try {
    await requireOrgPermission(orgId, "members.manage_roles");
  } catch {
    return [];
  }

  return db.select({
    id: enterpriseMemberState.id,
    memberId: enterpriseMemberState.memberId,
    userId: enterpriseMemberState.userId,
    status: enterpriseMemberState.status,
    scimGroups: enterpriseMemberState.scimGroups,
    samlGroups: enterpriseMemberState.samlGroups,
    alignmentState: enterpriseMemberState.alignmentState,
    userName: user.name,
    userEmail: user.email,
    userImage: user.image,
  })
  .from(enterpriseMemberState)
  .innerJoin(user, eq(enterpriseMemberState.userId, user.id))
  .where(
    and(
      eq(enterpriseMemberState.orgId, orgId),
      inArray(enterpriseMemberState.status, ["pending_review", "suspended"]),
    ),
  );
}

/**
 * Manually activate an enterprise member and assign roles.
 */
export async function activateEnterpriseMember(input: {
  orgId: string;
  memberId: string;
  roleIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrgPermission(input.orgId, "members.manage_roles");
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }

  try {
    // Remove existing role assignments
    await db.delete(memberRoleAssignments)
      .where(eq(memberRoleAssignments.memberId, input.memberId));

    // Assign new roles
    if (input.roleIds.length > 0) {
      await db.insert(memberRoleAssignments).values(
        input.roleIds.map((roleId) => ({
          id: createId(),
          memberId: input.memberId,
          roleId,
          source: "enterprise_review",
        })),
      );
    }

    // Update status to active
    await db.update(enterpriseMemberState)
      .set({
        status: "active",
        alignmentState: "aligned",
        updatedAt: new Date(),
      })
      .where(eq(enterpriseMemberState.memberId, input.memberId));

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, input.orgId),
    });

    if (org) {
      revalidatePath(`/app/${org.slug}/members`);
      revalidatePath(`/app/${org.slug}/settings`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to activate member" };
  }
}

/**
 * Save a SCIM/SAML group to role mapping.
 */
export async function saveGroupMapping(input: {
  orgId: string;
  groupKey: string;
  roleId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrgPermission(input.orgId, "enterprise.manage");
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }

  try {
    const groupKey = input.groupKey.trim();
    if (!groupKey) {
      return { success: false, error: "Group key is required" };
    }

    await db.insert(enterpriseGroupMappings).values({
      id: createId(),
      orgId: input.orgId,
      groupKey,
      roleId: input.roleId,
    }).onConflictDoUpdate({
      target: [enterpriseGroupMappings.orgId, enterpriseGroupMappings.groupKey],
      set: {
        roleId: input.roleId,
      },
    });

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, input.orgId),
    });

    if (org) {
      revalidatePath(`/app/${org.slug}/settings`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save group mapping" };
  }
}

/**
 * Delete a group mapping.
 */
export async function deleteGroupMapping(input: {
  orgId: string;
  mappingId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrgPermission(input.orgId, "enterprise.manage");
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }

  try {
    await db.delete(enterpriseGroupMappings)
      .where(
        and(
          eq(enterpriseGroupMappings.id, input.mappingId),
          eq(enterpriseGroupMappings.orgId, input.orgId),
        ),
      );

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, input.orgId),
    });

    if (org) {
      revalidatePath(`/app/${org.slug}/settings`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete group mapping" };
  }
}
