/**
 * lib/hooks/plugins/tasks.ts
 *
 * Hook handlers registered by the Tasks plugin.
 *
 * This file is the single place to add side-effect logic that should run
 * after task lifecycle events. Other plugins can also register listeners
 * for task events — they should do so in their own plugin hook file.
 *
 * Called once at module load via `initHooks()` in lib/hooks/index.ts.
 */

import { hooksRegistry } from "../registry";

export function registerTaskHooks(): void {
    // -------------------------------------------------------------------------
    // task:created
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:created", (payload) => {
        console.log(
            `[tasks] Issue created: ${payload.identifier} ("${payload.title}") ` +
            `in org ${payload.orgId} by user ${payload.creatorId}`
        );
        // TODO: send notifications, update analytics, trigger automations, etc.
    });

    // -------------------------------------------------------------------------
    // task:updated
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:updated", (payload) => {
        const changedFields = Object.keys(payload.changes).join(", ");
        console.log(
            `[tasks] Issue ${payload.issueId} updated (fields: ${changedFields}) ` +
            `in org ${payload.orgId} by user ${payload.actorId}`
        );
        // TODO: send "issue updated" notifications to watchers, etc.
    });

    // -------------------------------------------------------------------------
    // task:deleted
    // -------------------------------------------------------------------------
    hooksRegistry.on("task:deleted", (payload) => {
        console.log(
            `[tasks] Issue ${payload.issueId} deleted ` +
            `in org ${payload.orgId} by user ${payload.actorId}`
        );
        // TODO: clean up related data, notify assignee, etc.
    });
}
