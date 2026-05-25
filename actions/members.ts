"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import {
  member,
  user,
  invitation,
  organization,
  orgProfiles,
  memberRoleAssignments,
  orgRoles,
  enterpriseMemberState,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { requireOrgPermission } from "@/lib/authz/guards";

// ============================================================
// Types
// ============================================================

export type MemberWithUser = {
  id: string;
  role: string;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  enterpriseStatus?: "active" | "pending_review" | "deprovisioned" | "suspended" | null;
  provisionSource?: "scim" | "saml" | "manual" | null;
  assignedRoles?: Array<{ id: string; key: string; name: string }>;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
};

// ============================================================
// Queries
// ============================================================

/**
 * Get all members of an organization with their user data.
 */
export async function getMembers(orgId: string): Promise<MemberWithUser[]> {
  const memberships = await db
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId))
    .orderBy(desc(member.createdAt));

  if (memberships.length === 0) return [];

  const memberIds = memberships.map((m) => m.id);

  // Fetch enterprise states
  const states = await db
    .select()
    .from(enterpriseMemberState)
    .where(eq(enterpriseMemberState.orgId, orgId));

  // Fetch role assignments
  const assignments = await db
    .select({
      id: orgRoles.id,
      memberId: memberRoleAssignments.memberId,
      key: orgRoles.key,
      name: orgRoles.name,
    })
    .from(memberRoleAssignments)
    .innerJoin(orgRoles, eq(memberRoleAssignments.roleId, orgRoles.id))
    .where(inArray(memberRoleAssignments.memberId, memberIds));

  return memberships.map((m) => {
    const state = states.find((s) => s.memberId === m.id);
    const memberAssignments = assignments.filter((a) => a.memberId === m.id);

    return {
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      userId: m.userId,
      user: {
        id: m.userId,
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
      },
      enterpriseStatus: state ? (state.status as any) : null,
      provisionSource: state ? (state.provisionSource as any) : null,
      assignedRoles: memberAssignments.map((a) => ({ id: a.id, key: a.key, name: a.name })),
    };
  });
}

/**
 * Get all pending invitations for an organization.
 */
export async function getPendingInvitations(
  orgId: string
): Promise<PendingInvitation[]> {
  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      inviterId: invitation.inviterId,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(
      and(
        eq(invitation.organizationId, orgId),
        eq(invitation.status, "pending")
      )
    )
    .orderBy(desc(invitation.createdAt));

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    inviterName: inv.inviterName,
  }));
}

/**
 * Get member count for the org.
 */
export async function getOrgMemberInfo(orgId: string) {
  const members = await db
    .select({ id: member.id })
    .from(member)
    .where(eq(member.organizationId, orgId));

  return {
    memberCount: members.length,
  };
}

// ============================================================
// Mutations
// ============================================================

/**
 * Invite a member to the organization.
 * Uses better-auth's createInvitation API which handles:
 * - Permission checks (caller must be admin/owner or admin role)
 * - Sending invitation email
 * - Plan limit enforcement (via beforeCreateInvitation hook)
 */
export type OrgRole = "member" | "admin" | "owner";

export async function inviteMember(
  orgId: string,
  email: string,
  role: OrgRole
) {
  try {
    const orgProfile = await db.query.orgProfiles.findFirst({
      where: eq(orgProfiles.id, orgId),
    });

    if (!orgProfile) {
      throw new Error("Organization profile not found");
    }

    if (!orgProfile.enterpriseModeEnabled) {
      await auth.api.createInvitation({
        headers: await headers(),
        body: {
          email,
          role,
          organizationId: orgId,
        },
      });
    } else {
      await auth.api.createInvitation({
        headers: await headers(),
        body: {
          email,
          role: "member",
          organizationId: orgId,
        },
      });
    }

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invitation";
    return { success: false, error: message };
  }
}

/**
 * Cancel a pending invitation.
 */
export async function cancelInvitation(invitationId: string) {
  try {
    await auth.api.cancelInvitation({
      headers: await headers(),
      body: {
        invitationId,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel invitation";
    return { success: false, error: message };
  }
}

/**
 * Remove a member from the organization.
 * Only Admins (owner role) can remove members.
 */
export async function removeMember(orgId: string, memberIdOrEmail: string) {
  try {
    await auth.api.removeMember({
      headers: await headers(),
      body: {
        memberIdOrEmail,
        organizationId: orgId,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove member";
    return { success: false, error: message };
  }
}

/**
 * Update a member's role.
 * Only Admins (owner role) can change roles.
 */
export async function updateMemberRole(
  orgId: string,
  memberId: string,
  role: OrgRole
) {
  try {
    await auth.api.updateMemberRole({
      headers: await headers(),
      body: {
        memberId,
        role,
        organizationId: orgId,
      },
    });

    const systemRoleKey = role === "owner" ? "enterprise_admin" : role === "admin" ? "lead" : "member";
    const targetRole = await db.query.orgRoles.findFirst({
      where: and(eq(orgRoles.orgId, orgId), eq(orgRoles.key, systemRoleKey)),
    });
    if (targetRole) {
      await db.delete(memberRoleAssignments).where(eq(memberRoleAssignments.memberId, memberId));
      await db.insert(memberRoleAssignments).values({
        id: createId(),
        memberId,
        roleId: targetRole.id,
        source: "manual",
      });
    }

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update role";
    return { success: false, error: message };
  }
}

/**
 * Update assignments for multiple custom/system roles.
 */
export async function updateMemberAssignedRoles(
  orgId: string,
  memberId: string,
  roleIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrgPermission(orgId, "members.manage_roles");
    
    await db.delete(memberRoleAssignments)
      .where(eq(memberRoleAssignments.memberId, memberId));
    
    if (roleIds.length > 0) {
      await db.insert(memberRoleAssignments).values(
        roleIds.map((roleId) => ({
          id: createId(),
          memberId,
          roleId,
          source: "manual",
        }))
      );
    }

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update assigned roles";
    return { success: false, error: message };
  }
}
