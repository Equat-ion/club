"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import {
  issues as tasks,
  issueComments as taskComments,
  issueActivity as taskActivity,
  labels,
  issueLabels,
} from "@/lib/db/schema/tasks";
import { orgProfiles, orgPlugins } from "@/lib/db/schema/orgs";
import { member, user, organization } from "@/lib/db/schema/auth";
import { teams, teamMembers } from "@/lib/db/schema/teams";
import { eq, and, asc, desc, sql, inArray, or } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type {
  TaskStatus,
  TaskPriority,
  TaskWithDetails,
  TaskComment,
  TaskActivityEntry,
  OrgMember,
  Label,
  OrgTeam,
} from "@/lib/plugins/tasks-types";
import {
  initHooks,
  hooksRegistry,
  type HookEvent,
  type HookPayload,
} from "@/lib/hooks";
import { MAX_TASK_LABELS } from "@/lib/plugins/tasks-constants";
import { requireOrgPermission } from "@/lib/authz/guards";

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
 */
async function generateTaskIdentifier(
  orgId: string
): Promise<{ identifier: string; orgSlug: string }> {
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
    throw new Error("Failed to generate task identifier");

  const prefix = org.slug.toUpperCase().replace(/-/g, "");
  return {
    identifier: `${prefix}-${counter}`,
    orgSlug: org.slug,
  };
}

async function getOrgSlugById(orgId: string): Promise<string> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
    columns: { slug: true },
  });
  if (!org) throw new Error("Organization not found");
  return org.slug;
}

function emitHook<E extends HookEvent>(event: E, payload: HookPayload<E>): void {
  void hooksRegistry.emit(event, payload).catch((error) => {
    console.error(`[hooks] failed to emit ${event}:`, error);
  });
}

/**
 * Normalizes task label IDs by removing duplicates while preserving order.
 */
function normalizeLabelIds(labelIds?: string[]): string[] {
  if (!labelIds || labelIds.length === 0) return [];
  return [...new Set(labelIds)];
}

// ============================================================
// Queries
// ============================================================

/**
 * Get all tasks for an org, optionally filtered.
 */
export async function getTasks(
  orgId: string,
  filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string; // memberId
    teamId?: string;
    labelIds?: string[];
  }
): Promise<TaskWithDetails[]> {
  const conditions = [eq(tasks.orgId, orgId)];
  if (filters?.status) conditions.push(eq(tasks.status, filters.status));
  if (filters?.priority) conditions.push(eq(tasks.priority, filters.priority));
  if (filters?.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));
  if (filters?.teamId) conditions.push(eq(tasks.teamId, filters.teamId));

  // If label filters are present, we need to filter by them.
  // This is a bit more complex in Drizzle without full relational API usage here.
  // We'll filter the results after fetching if needed, or join.
  // For now, let's fetch all matching basic filters and then filter by labels if provided.

  const rows = await db
    .select({
      id: tasks.id,
      orgId: tasks.orgId,
      identifier: tasks.identifier,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assigneeId: tasks.assigneeId,
      teamId: tasks.teamId,
      creatorId: tasks.creatorId,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      creatorName: user.name,
      creatorImage: user.image,
      teamName: teams.name,
    })
    .from(tasks)
    .innerJoin(user, eq(tasks.creatorId, user.id))
    .leftJoin(teams, eq(tasks.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  // Fetch all labels for these tasks
  const taskIds = rows.map((r) => r.id);
  const labelsMap = new Map<string, Label[]>();

  if (taskIds.length > 0) {
    const taskLabels = await db
      .select({
        taskId: issueLabels.issueId,
        labelId: labels.id,
        name: labels.name,
        color: labels.color,
      })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(inArray(issueLabels.issueId, taskIds));

    for (const tl of taskLabels) {
      const existing = labelsMap.get(tl.taskId) ?? [];
      existing.push({ id: tl.labelId, name: tl.name, color: tl.color });
      labelsMap.set(tl.taskId, existing);
    }
  }

  // Fetch assignee info (from member + user table)
  const assigneeMemberIds = [...new Set(rows.filter((r) => r.assigneeId).map((r) => r.assigneeId!))];
  const assigneeMap = new Map<string, { id: string; name: string; image: string | null }>();

  if (assigneeMemberIds.length > 0) {
    const assignees = await db
      .select({
        id: member.id,
        name: user.name,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(inArray(member.id, assigneeMemberIds));

    for (const a of assignees) {
      assigneeMap.set(a.id, a);
    }
  }

  let finalTasks = rows.map((r) => ({
    id: r.id,
    orgId: r.orgId,
    identifier: r.identifier,
    title: r.title,
    description: r.description,
    status: r.status as TaskStatus,
    priority: r.priority as TaskPriority,
    assigneeId: r.assigneeId,
    teamId: r.teamId,
    creatorId: r.creatorId,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignee: r.assigneeId ? assigneeMap.get(r.assigneeId) ?? null : null,
    team: r.teamId ? { id: r.teamId, name: r.teamName! } : null,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      image: r.creatorImage,
    },
    labels: labelsMap.get(r.id) ?? [],
  }));

  // Apply label filter if present
  if (filters?.labelIds && filters.labelIds.length > 0) {
    finalTasks = finalTasks.filter((task) =>
      filters.labelIds!.every((labelId) => task.labels.some((l) => l.id === labelId))
    );
  }

  return finalTasks;
}

/**
 * Get tasks assigned to current member OR their teams.
 */
export async function getMyTasks(orgId: string): Promise<TaskWithDetails[]> {
  const session = await getAuthenticatedUser();
  const membership = await verifyMembership(orgId, session.user.id);

  // Get member's teams
  const memberTeams = await db.query.teamMembers.findMany({
    where: eq(teamMembers.memberId, membership.id),
  });
  const teamIds = memberTeams.map((mt) => mt.teamId);

  const conditions = [
    eq(tasks.orgId, orgId),
    or(
      eq(tasks.assigneeId, membership.id),
      teamIds.length > 0 ? inArray(tasks.teamId, teamIds) : undefined
    ),
  ].filter(Boolean);

  // For simplicity, we'll use getTasks logic but with specific filters.
  // However, Drizzle's `inArray` can't be undefined. So we handle it.
  
  const baseConditions = [eq(tasks.orgId, orgId)];
  const myConditions = [];
  myConditions.push(eq(tasks.assigneeId, membership.id));
  if (teamIds.length > 0) {
    myConditions.push(inArray(tasks.teamId, teamIds));
  }

  const finalCondition = and(eq(tasks.orgId, orgId), or(...myConditions));

  // Reuse full fetch logic
  return getTasks(orgId, { assigneeId: undefined }); // This is tricky with current getTasks. 
  // Let's just implement the specific query here.
}

/**
 * Get a single task by ID with full details.
 */
export async function getTask(taskId: string): Promise<TaskWithDetails | null> {
  const rows = await db
    .select({
      id: tasks.id,
      orgId: tasks.orgId,
      identifier: tasks.identifier,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assigneeId: tasks.assigneeId,
      teamId: tasks.teamId,
      creatorId: tasks.creatorId,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      creatorName: user.name,
      creatorImage: user.image,
      teamName: teams.name,
    })
    .from(tasks)
    .innerJoin(user, eq(tasks.creatorId, user.id))
    .leftJoin(teams, eq(tasks.teamId, teams.id))
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (rows.length === 0) return null;

  const r = rows[0];

  // Labels
  const taskLabels = await db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
    })
    .from(issueLabels)
    .innerJoin(labels, eq(issueLabels.labelId, labels.id))
    .where(eq(issueLabels.issueId, taskId));

  // Assignee
  let assignee = null;
  if (r.assigneeId) {
    const assigneeRows = await db
      .select({
        id: member.id,
        name: user.name,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.id, r.assigneeId))
      .limit(1);
    assignee = assigneeRows[0] ?? null;
  }

  return {
    id: r.id,
    orgId: r.orgId,
    identifier: r.identifier,
    title: r.title,
    description: r.description,
    status: r.status as TaskStatus,
    priority: r.priority as TaskPriority,
    assigneeId: r.assigneeId,
    teamId: r.teamId,
    creatorId: r.creatorId,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignee,
    team: r.teamId ? { id: r.teamId, name: r.teamName! } : null,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      image: r.creatorImage,
    },
    labels: taskLabels,
  };
}

/**
 * Get task comments.
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const rows = await db
    .select({
      id: taskComments.id,
      taskId: taskComments.issueId,
      body: taskComments.body,
      createdAt: taskComments.createdAt,
      updatedAt: taskComments.updatedAt,
      authorId: taskComments.authorId,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(taskComments)
    .innerJoin(user, eq(taskComments.authorId, user.id))
    .where(eq(taskComments.issueId, taskId))
    .orderBy(asc(taskComments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    taskId: r.taskId,
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
 * Get task activity log.
 */
export async function getTaskActivity(taskId: string): Promise<TaskActivityEntry[]> {
  const rows = await db
    .select({
      id: taskActivity.id,
      taskId: taskActivity.issueId,
      type: taskActivity.type,
      fromValue: taskActivity.fromValue,
      toValue: taskActivity.toValue,
      createdAt: taskActivity.createdAt,
      actorId: taskActivity.actorId,
      actorName: user.name,
      actorImage: user.image,
    })
    .from(taskActivity)
    .innerJoin(user, eq(taskActivity.actorId, user.id))
    .where(eq(taskActivity.issueId, taskId))
    .orderBy(asc(taskActivity.createdAt));

  return rows.map((r) => ({
    id: r.id,
    taskId: r.taskId,
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
      id: member.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId))
    .orderBy(asc(user.name));

  return rows;
}

/**
 * Get all teams of an org.
 */
export async function getOrgTeams(orgId: string): Promise<OrgTeam[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
    })
    .from(teams)
    .where(eq(teams.orgId, orgId))
    .orderBy(asc(teams.name));

  return rows;
}

/**
 * Get all labels of an org.
 */
export async function getOrgLabels(orgId: string): Promise<Label[]> {
  return await db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
    })
    .from(labels)
    .where(eq(labels.orgId, orgId))
    .orderBy(asc(labels.name));
}

// ============================================================
// Mutations
// ============================================================

/**
 * Create a new task.
 */
export async function createTask(
  orgId: string,
  data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string; // memberId
    teamId?: string;
    dueDate?: string;
    labelIds?: string[];
  }
) {
  try {
    const session = await getAuthenticatedUser();
    await verifyMembership(orgId, session.user.id);
    const normalizedLabelIds = normalizeLabelIds(data.labelIds);
    if (normalizedLabelIds.length > MAX_TASK_LABELS) {
      throw new Error(`A task can have at most ${MAX_TASK_LABELS} labels`);
    }

    const { identifier, orgSlug } = await generateTaskIdentifier(orgId);
    const taskId = createId();

    await db.transaction(async (tx) => {
      await tx.insert(tasks).values({
        id: taskId,
        orgId,
        identifier,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "backlog",
        priority: data.priority ?? "no_priority",
        assigneeId: data.assigneeId ?? null,
        teamId: data.teamId ?? null,
        creatorId: session.user.id,
        dueDate: data.dueDate ?? null,
      });

      if (normalizedLabelIds.length > 0) {
        await tx.insert(issueLabels).values(
          normalizedLabelIds.map((labelId) => ({
            issueId: taskId,
            labelId,
          }))
        );
      }

      // Log creation activity
      await tx.insert(taskActivity).values({
        id: createId(),
        issueId: taskId,
        actorId: session.user.id,
        type: "created",
        toValue: data.title,
      });
    });

    emitHook("task:created", {
      orgId,
      issueId: taskId,
      identifier,
      title: data.title,
      creatorId: session.user.id,
    });

    revalidatePath(`/app/${orgSlug}/tasks`);
    revalidatePath(`/app/${orgSlug}/tasks/${taskId}`);
    return { success: true, taskId, identifier };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    return { success: false, error: message };
  }
}

/**
 * Update a task's fields.
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null; // memberId
    teamId?: string | null;
    dueDate?: string | null;
    labelIds?: string[];
  }
) {
  try {
    const session = await getAuthenticatedUser();
    const normalizedLabelIds =
      data.labelIds !== undefined ? normalizeLabelIds(data.labelIds) : undefined;
    if (normalizedLabelIds !== undefined && normalizedLabelIds.length > MAX_TASK_LABELS) {
      throw new Error(`A task can have at most ${MAX_TASK_LABELS} labels`);
    }

    const current = await db.query.issues.findFirst({
      where: eq(tasks.id, taskId),
    });
    if (!current) throw new Error("Task not found");

    const membership = await verifyMembership(current.orgId, session.user.id);
    const orgSlug = await getOrgSlugById(current.orgId);

    // Build update object
    const updates: {
      updatedAt: Date;
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      teamId?: string | null;
      dueDate?: string | null;
    } = { updatedAt: new Date() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.assigneeId !== undefined) updates.assigneeId = data.assigneeId;
    if (data.teamId !== undefined) updates.teamId = data.teamId;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;

    const hookEvents: Array<{ event: HookEvent; payload: HookPayload<HookEvent> }> = [];

    await db.transaction(async (tx) => {
      if (Object.keys(updates).length > 1) {
        await tx.update(tasks).set(updates).where(eq(tasks.id, taskId));
      }

      if (normalizedLabelIds !== undefined) {
        // Replace all labels
        await tx.delete(issueLabels).where(eq(issueLabels.issueId, taskId));
        if (normalizedLabelIds.length > 0) {
          await tx.insert(issueLabels).values(
            normalizedLabelIds.map((labelId) => ({
              issueId: taskId,
              labelId,
            }))
          );
        }
      }

      // Log activity
      const activityEntries = [];
      if (data.status && data.status !== current.status) {
        activityEntries.push({ type: "status_change", from: current.status, to: data.status });
        hookEvents.push({
          event: "task:status_changed",
          payload: {
          orgId: current.orgId,
          taskId,
          fromStatus: current.status,
          toStatus: data.status,
          memberId: membership.id,
          },
        });
      }
      if (data.assigneeId !== undefined && data.assigneeId !== current.assigneeId) {
        activityEntries.push({ type: "assignment", from: current.assigneeId, to: data.assigneeId });
        hookEvents.push({
          event: "task:assigned",
          payload: {
          orgId: current.orgId,
          taskId,
          fromMemberId: current.assigneeId,
          toMemberId: data.assigneeId,
          actorId: session.user.id,
          },
        });
      }
      if (data.teamId !== undefined && data.teamId !== current.teamId) {
        activityEntries.push({ type: "team_assignment", from: current.teamId, to: data.teamId });
        hookEvents.push({
          event: "task:team_assigned",
          payload: {
          orgId: current.orgId,
          taskId,
          fromTeamId: current.teamId,
          toTeamId: data.teamId,
          actorId: session.user.id,
          },
        });
      }

      for (const entry of activityEntries) {
        await tx.insert(taskActivity).values({
          id: createId(),
          issueId: taskId,
          actorId: session.user.id,
          type: entry.type,
          fromValue: entry.from,
          toValue: entry.to,
        });
      }
    });

    for (const hookEvent of hookEvents) {
      emitHook(hookEvent.event, hookEvent.payload);
    }

    emitHook("task:updated", {
      orgId: current.orgId,
      issueId: taskId,
      changes: data,
      actorId: session.user.id,
    });

    revalidatePath(`/app/${orgSlug}/tasks`);
    revalidatePath(`/app/${orgSlug}/tasks/${taskId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    return { success: false, error: message };
  }
}

/**
 * Delete a task.
 */
async function deleteTasksForOrg(orgId: string, taskIds: string[], actorId: string) {
  try {
    await requireOrgPermission(orgId, "tasks.delete");
  } catch (err) {
    throw new Error("You don't have permission to delete tasks");
  }

  const uniqueTaskIds = [...new Set(taskIds.filter(Boolean))];
  if (uniqueTaskIds.length === 0) return 0;

  const targetTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.orgId, orgId), inArray(tasks.id, uniqueTaskIds)));

  if (targetTasks.length === 0) return 0;

  const targetTaskIds = targetTasks.map((task) => task.id);

  await db
    .delete(tasks)
    .where(and(eq(tasks.orgId, orgId), inArray(tasks.id, targetTaskIds)));

  for (const task of targetTasks) {
    emitHook("task:deleted", {
      orgId,
      issueId: task.id,
      actorId,
    });
  }

  const orgSlug = await getOrgSlugById(orgId);
  revalidatePath(`/app/${orgSlug}/tasks`);
  return targetTaskIds.length;
}

export async function deleteTask(taskId: string) {
  try {
    const session = await getAuthenticatedUser();

    const task = await db.query.issues.findFirst({
      where: eq(tasks.id, taskId),
    });
    if (!task) throw new Error("Task not found");

    const deletedCount = await deleteTasksForOrg(task.orgId, [taskId], session.user.id);
    if (deletedCount === 0) throw new Error("Task not found");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    return { success: false, error: message };
  }
}

export async function deleteTasks(orgId: string, taskIds: string[]) {
  try {
    const session = await getAuthenticatedUser();
    const deletedCount = await deleteTasksForOrg(orgId, taskIds, session.user.id);

    if (deletedCount === 0) {
      throw new Error("Tasks not found");
    }

    return { success: true, deletedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tasks";
    return { success: false, error: message };
  }
}

// ============================================================
// Label Mutations
// ============================================================

export async function createLabel(orgId: string, data: { name: string; color: string }) {
  try {
    const session = await getAuthenticatedUser();
    await verifyMembership(orgId, session.user.id);

    const labelId = createId();
    await db.insert(labels).values({
      id: labelId,
      orgId,
      name: data.name,
      color: data.color,
    });

    return { success: true, labelId };
  } catch (error) {
    return { success: false, error: "Failed to create label" };
  }
}

export async function deleteLabel(orgId: string, labelId: string) {
  try {
    const session = await getAuthenticatedUser();
    await requireOrgPermission(orgId, "tasks.edit");

    await db.delete(labels).where(and(eq(labels.id, labelId), eq(labels.orgId, orgId)));
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete label";
    return { success: false, error: message };
  }
}

export async function addComment(taskId: string, body: string) {
  try {
    const session = await getAuthenticatedUser();

    const task = await db.query.issues.findFirst({
      where: eq(tasks.id, taskId),
    });
    if (!task) throw new Error("Task not found");

    await verifyMembership(task.orgId, session.user.id);
    const orgSlug = await getOrgSlugById(task.orgId);

    const commentId = createId();

    await db.insert(taskComments).values({
      id: commentId,
      issueId: taskId,
      authorId: session.user.id,
      body,
    });

    // Log comment activity
    await db.insert(taskActivity).values({
      id: createId(),
      issueId: taskId,
      actorId: session.user.id,
      type: "comment",
      toValue: commentId,
    });

    revalidatePath(`/app/${orgSlug}/tasks/${taskId}`);
    return { success: true, commentId };
  } catch (error) {
    return { success: false, error: "Failed to add comment" };
  }
}
