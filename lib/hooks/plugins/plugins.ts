/**
 * lib/hooks/plugins/plugins.ts
 *
 * Hook handlers that respond to plugin lifecycle events (enable / disable).
 *
 * These run after a plugin's enabled state changes in the DB.
 * Useful for bootstrapping/teardown logic, audit logging, notifications, etc.
 *
 * Called once at module load via `initHooks()` in lib/hooks/index.ts.
 */

import { hooksRegistry } from "../registry";

export function registerPluginLifecycleHooks(): void {
    // -------------------------------------------------------------------------
    // plugin:enabled
    // -------------------------------------------------------------------------
    hooksRegistry.on("plugin:enabled", (payload) => {
        const cascadeNote =
            payload.cascaded.length > 0
                ? ` (also enabled: ${payload.cascaded.join(", ")})`
                : "";
        console.log(
            `[plugins] Plugin "${payload.pluginId}" enabled for org ${payload.orgId}${cascadeNote}`
        );
        // TODO: run plugin bootstrap logic, provision default data, etc.
    });

    // -------------------------------------------------------------------------
    // plugin:disabled
    // -------------------------------------------------------------------------
    hooksRegistry.on("plugin:disabled", (payload) => {
        console.log(
            `[plugins] Plugin "${payload.pluginId}" disabled for org ${payload.orgId}`
        );
        // TODO: run plugin cleanup/teardown logic, archive data, etc.
    });
}
