/**
 * lib/hooks/plugins/tasks.ts
 *
 * Hook handlers registered by the Tasks plugin.
 */

import { hooksRegistry } from "../registry";
import { db } from "@/lib/db";
import { issues, issueActivity } from "@/lib/db/schema/tasks";
import { eq, and, isNotNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export function registerTaskHooks(): void {
    // -------------------------------------------------------------------------
    // task:created
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:created", (payload) => {
        console.log(
            `[tasks] Task created: ${payload.identifier} ("${payload.title}") ` +
            `in org ${payload.orgId} by user ${payload.creatorId}`
        );
    });

    // -------------------------------------------------------------------------
    // task:updated
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:updated", (payload) => {
        const changedFields = Object.keys(payload.changes).join(", ");
        console.log(
            `[tasks] Task ${payload.issueId} updated (fields: ${changedFields}) ` +
            `in org ${payload.orgId} by user ${payload.actorId}`
        );
    });

    // -------------------------------------------------------------------------
    // task:status_changed
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:status_changed", (payload) => {
        console.log(
            `[tasks] Task ${payload.taskId} status changed from ${payload.fromStatus} to ${payload.toStatus} ` +
            `by member ${payload.memberId}`
        );
    });

    // -------------------------------------------------------------------------
    // task:assigned
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:assigned", (payload) => {
        console.log(
            `[tasks] Task ${payload.taskId} assigned to member ${payload.toMemberId} ` +
            `(previous: ${payload.fromMemberId}) by actor ${payload.actorId}`
        );
    });

    // -------------------------------------------------------------------------
    // task:team_assigned
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:team_assigned", (payload) => {
        console.log(
            `[tasks] Task ${payload.taskId} assigned to team ${payload.toTeamId} ` +
            `(previous: ${payload.fromTeamId}) by actor ${payload.actorId}`
        );
    });

    // -------------------------------------------------------------------------
    // task:deleted
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:deleted", (payload) => {
        console.log(
            `[tasks] Task ${payload.issueId} deleted ` +
            `in org ${payload.orgId} by user ${payload.actorId}`
        );
    });

    // Future consumers:
    // - notifications plugin: listen to task:assigned to alert the assignee
    // - finances plugin: listen to task:status_changed to trigger budget flows
    // - teams plugin: listen to task:team_assigned to update team task counts

    // -------------------------------------------------------------------------
    // plugin:disabled - Clean up team assignments when teams plugin is disabled
    // -------------------------------------------------------------------------
    hooksRegistry.on("plugin:disabled", async (payload) => {
        if (payload.pluginId !== "teams") return;

        console.log(
            `[tasks] Teams plugin disabled for org ${payload.orgId}. ` +
            `Clearing team assignments on tasks...`
        );

        // Get all tasks with team assignments in this org
        const tasksWithTeams = await db
            .select({ id: issues.id })
            .from(issues)
            .where(and(eq(issues.orgId, payload.orgId), isNotNull(issues.teamId)));

        if (tasksWithTeams.length === 0) return;

        // Clear team assignments from tasks
        await db
            .update(issues)
            .set({ teamId: null, updatedAt: new Date() })
            .where(and(eq(issues.orgId, payload.orgId), isNotNull(issues.teamId)));

        // Log the cleanup action for each affected task
        for (const task of tasksWithTeams) {
            await db.insert(issueActivity).values({
                id: createId(),
                issueId: task.id,
                actorId: "system",
                type: "system",
                toValue: "Team assignment removed (Teams plugin disabled)",
            });
        }

        console.log(
            `[tasks] Cleared team assignments from ${tasksWithTeams.length} tasks ` +
            `in org ${payload.orgId}`
        );
    });
}
