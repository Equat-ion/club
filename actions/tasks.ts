"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import {
  issues,
  issueComments,
  issueActivity,
} from "@/lib/db/schema/tasks";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { member, user, organization } from "@/lib/db/schema/auth";
import { eq, and, asc, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type {
  IssueStatus,
  IssuePriority,
  IssueWithAssignee,
  IssueComment,
  IssueActivityEntry,
  OrgMember,
} from "@/lib/plugins/tasks-types";
import { initHooks, hooksRegistry } from "@/lib/hooks";

// Register all plugin hook handlers once at module load.
initHooks();

// ============================================================
// Helpers
// ============================================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Not authenticated");
  return session;
}

async function verifyMembership(orgId: string, userId: string) {
  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, orgId), eq(member.userId, userId)),
  });
  if (!membership) throw new Error("Not a member of this organization");
  return membership;
}

/**
 * Atomically increment the org's issue counter and return the new identifier.
 * Format: ORG_SLUG_UPPER-COUNTER (e.g. "ACM-42")
 */
async function generateIssueIdentifier(orgId: string): Promise<string> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });
  if (!org) throw new Error("Organization not found");

  const result = await db
    .update(orgProfiles)
    .set({
      issueCounter: sql`${orgProfiles.issueCounter} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(orgProfiles.id, orgId))
    .returning({ issueCounter: orgProfiles.issueCounter });

  const counter = result[0]?.issueCounter;
  if (counter === undefined)
    throw new Error("Failed to generate issue identifier");

  const prefix = org.slug.toUpperCase().replace(/-/g, "");
  return `${prefix}-${counter}`;
}

// ============================================================
// Queries
// ============================================================

/**
 * Get all issues for an org, optionally filtered.
 */
export async function getIssues(
  orgId: string,
  filters?: {
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string;
  }
): Promise<IssueWithAssignee[]> {
  const conditions = [eq(issues.orgId, orgId)];
  if (filters?.status) conditions.push(eq(issues.status, filters.status));
  if (filters?.priority)
    conditions.push(eq(issues.priority, filters.priority));
  if (filters?.assigneeId)
    conditions.push(eq(issues.assigneeId, filters.assigneeId));

  const rows = await db
    .select({
      id: issues.id,
      orgId: issues.orgId,
      identifier: issues.identifier,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      creatorId: issues.creatorId,
      dueDate: issues.dueDate,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      creatorName: user.name,
      creatorImage: user.image,
    })
    .from(issues)
    .innerJoin(user, eq(issues.creatorId, user.id))
    .where(and(...conditions))
    .orderBy(asc(issues.createdAt));

  // Fetch assignee info for issues that have one
  const assigneeIds = [
    ...new Set(rows.filter((r) => r.assigneeId).map((r) => r.assigneeId!)),
  ];
  const assigneeMap = new Map<
    string,
    { id: string; name: string; image: string | null }
  >();

  if (assigneeIds.length > 0) {
    const assignees = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(
        sql`${user.id} IN (${sql.join(
          assigneeIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    for (const a of assignees) {
      assigneeMap.set(a.id, a);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    orgId: r.orgId,
    identifier: r.identifier,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    assigneeId: r.assigneeId,
    creatorId: r.creatorId,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignee: r.assigneeId ? assigneeMap.get(r.assigneeId) ?? null : null,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      image: r.creatorImage,
    },
  }));
}

/**
 * Get a single issue by ID with full details.
 */
export async function getIssue(
  issueId: string
): Promise<IssueWithAssignee | null> {
  const rows = await db
    .select({
      id: issues.id,
      orgId: issues.orgId,
      identifier: issues.identifier,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      creatorId: issues.creatorId,
      dueDate: issues.dueDate,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      creatorName: user.name,
      creatorImage: user.image,
    })
    .from(issues)
    .innerJoin(user, eq(issues.creatorId, user.id))
    .where(eq(issues.id, issueId))
    .limit(1);

  if (rows.length === 0) return null;

  const r = rows[0];

  let assignee: { id: string; name: string; image: string | null } | null =
    null;
  if (r.assigneeId) {
    const assigneeRows = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, r.assigneeId))
      .limit(1);
    assignee = assigneeRows[0] ?? null;
  }

  return {
    id: r.id,
    orgId: r.orgId,
    identifier: r.identifier,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    assigneeId: r.assigneeId,
    creatorId: r.creatorId,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignee,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      image: r.creatorImage,
    },
  };
}

/**
 * Get issue comments.
 */
export async function getIssueComments(
  issueId: string
): Promise<IssueComment[]> {
  const rows = await db
    .select({
      id: issueComments.id,
      issueId: issueComments.issueId,
      body: issueComments.body,
      createdAt: issueComments.createdAt,
      updatedAt: issueComments.updatedAt,
      authorId: issueComments.authorId,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(issueComments)
    .innerJoin(user, eq(issueComments.authorId, user.id))
    .where(eq(issueComments.issueId, issueId))
    .orderBy(asc(issueComments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    issueId: r.issueId,
    body: r.body,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    author: {
      id: r.authorId,
      name: r.authorName,
      image: r.authorImage,
    },
  }));
}

/**
 * Get issue activity log.
 */
export async function getIssueActivity(
  issueId: string
): Promise<IssueActivityEntry[]> {
  const rows = await db
    .select({
      id: issueActivity.id,
      issueId: issueActivity.issueId,
      type: issueActivity.type,
      fromValue: issueActivity.fromValue,
      toValue: issueActivity.toValue,
      createdAt: issueActivity.createdAt,
      actorId: issueActivity.actorId,
      actorName: user.name,
      actorImage: user.image,
    })
    .from(issueActivity)
    .innerJoin(user, eq(issueActivity.actorId, user.id))
    .where(eq(issueActivity.issueId, issueId))
    .orderBy(asc(issueActivity.createdAt));

  return rows.map((r) => ({
    id: r.id,
    issueId: r.issueId,
    type: r.type,
    fromValue: r.fromValue,
    toValue: r.toValue,
    createdAt: r.createdAt,
    actor: {
      id: r.actorId,
      name: r.actorName,
      image: r.actorImage,
    },
  }));
}

/**
 * Get all members of an org (for assignee picker).
 */
export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const rows = await db
    .select({
      userId: member.userId,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId))
    .orderBy(asc(user.name));

  return rows.map((r) => ({
    id: r.userId,
    name: r.name,
    email: r.email,
    image: r.image,
  }));
}

// ============================================================
// Mutations
// ============================================================

/**
 * Create a new issue.
 */
export async function createIssue(
  orgId: string,
  data: {
    title: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string;
    dueDate?: string;
  }
) {
  try {
    const session = await getAuthenticatedUser();
    await verifyMembership(orgId, session.user.id);

    const identifier = await generateIssueIdentifier(orgId);
    const issueId = createId();

    await db.insert(issues).values({
      id: issueId,
      orgId,
      identifier,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "backlog",
      priority: data.priority ?? "no_priority",
      assigneeId: data.assigneeId ?? null,
      creatorId: session.user.id,
      dueDate: data.dueDate ?? null,
    });

    // Log creation activity
    await db.insert(issueActivity).values({
      id: createId(),
      issueId,
      actorId: session.user.id,
      type: "created",
      toValue: data.title,
    });

    await hooksRegistry.emit("task:created", {
      orgId,
      issueId,
      identifier,
      title: data.title,
      creatorId: session.user.id,
    });

    revalidatePath("/app");
    return { success: true, issueId, identifier };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create issue";
    return { success: false, error: message };
  }
}

/**
 * Update an issue's fields.
 */
export async function updateIssue(
  issueId: string,
  data: {
    title?: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string | null;
    dueDate?: string | null;
  }
) {
  try {
    const session = await getAuthenticatedUser();

    const current = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });
    if (!current) throw new Error("Issue not found");

    const membership = await verifyMembership(current.orgId, session.user.id);

    // Permission check: members can only update own issues
    const isOwnerOrAdmin =
      membership.role === "owner" || membership.role === "admin";
    if (!isOwnerOrAdmin && current.creatorId !== session.user.id) {
      throw new Error("You don't have permission to edit this issue");
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.assigneeId !== undefined) updates.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;

    await db.update(issues).set(updates).where(eq(issues.id, issueId));

    // Log activity for trackable field changes
    const activityEntries: {
      type: string;
      fromValue: string | null;
      toValue: string | null;
    }[] = [];

    if (data.status !== undefined && data.status !== current.status) {
      activityEntries.push({
        type: "status_change",
        fromValue: current.status,
        toValue: data.status,
      });
    }
    if (data.priority !== undefined && data.priority !== current.priority) {
      activityEntries.push({
        type: "priority_change",
        fromValue: current.priority,
        toValue: data.priority,
      });
    }
    if (
      data.assigneeId !== undefined &&
      data.assigneeId !== current.assigneeId
    ) {
      activityEntries.push({
        type: "assignment",
        fromValue: current.assigneeId,
        toValue: data.assigneeId,
      });
    }

    if (activityEntries.length > 0) {
      await db.insert(issueActivity).values(
        activityEntries.map((entry) => ({
          id: createId(),
          issueId,
          actorId: session.user.id,
          type: entry.type,
          fromValue: entry.fromValue,
          toValue: entry.toValue,
        }))
      );
    }

    await hooksRegistry.emit("task:updated", {
      orgId: current.orgId,
      issueId,
      changes: data,
      actorId: session.user.id,
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update issue";
    return { success: false, error: message };
  }
}

/**
 * Delete an issue.
 * Only Admin (owner) and Lead (admin) can delete.
 */
export async function deleteIssue(issueId: string) {
  try {
    const session = await getAuthenticatedUser();

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });
    if (!issue) throw new Error("Issue not found");

    const membership = await verifyMembership(issue.orgId, session.user.id);

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("You don't have permission to delete issues");
    }

    await db.delete(issues).where(eq(issues.id, issueId));

    await hooksRegistry.emit("task:deleted", {
      orgId: issue.orgId,
      issueId,
      actorId: session.user.id,
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete issue";
    return { success: false, error: message };
  }
}

/**
 * Add a comment to an issue.
 */
export async function addComment(issueId: string, body: string) {
  try {
    const session = await getAuthenticatedUser();

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });
    if (!issue) throw new Error("Issue not found");

    await verifyMembership(issue.orgId, session.user.id);

    const commentId = createId();

    await db.insert(issueComments).values({
      id: commentId,
      issueId,
      authorId: session.user.id,
      body,
    });

    // Log comment activity
    await db.insert(issueActivity).values({
      id: createId(),
      issueId,
      actorId: session.user.id,
      type: "comment",
      toValue: commentId,
    });

    revalidatePath("/app");
    return { success: true, commentId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add comment";
    return { success: false, error: message };
  }
}

/**
 * Delete a comment.
 * Admin/Lead can delete any comment. Members can only delete own.
 */
export async function deleteComment(commentId: string) {
  try {
    const session = await getAuthenticatedUser();

    const comment = await db.query.issueComments.findFirst({
      where: eq(issueComments.id, commentId),
    });
    if (!comment) throw new Error("Comment not found");

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, comment.issueId),
    });
    if (!issue) throw new Error("Issue not found");

    const membership = await verifyMembership(issue.orgId, session.user.id);

    const isOwnerOrAdmin =
      membership.role === "owner" || membership.role === "admin";
    if (!isOwnerOrAdmin && comment.authorId !== session.user.id) {
      throw new Error("You don't have permission to delete this comment");
    }

    await db.delete(issueComments).where(eq(issueComments.id, commentId));

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete comment";
    return { success: false, error: message };
  }
}
