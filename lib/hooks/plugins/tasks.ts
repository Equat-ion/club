/**
 * lib/hooks/plugins/tasks.ts
 *
 * Hook handlers registered by the Tasks plugin.
 */

import { hooksRegistry } from "../registry";

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
}
