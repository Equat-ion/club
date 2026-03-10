/**
 * lib/hooks/index.ts
 *
 * Central hooks initialiser.
 *
 * Usage (add once, at the top of every server action file):
 *
 *   import { initHooks, hooksRegistry } from "@/lib/hooks";
 *   initHooks();
 *
 * `initHooks()` is idempotent — multiple calls are safe (the guard inside
 * means handlers are only registered on the first call, even if the same
 * module is imported by several action files).
 *
 * To emit a hook from an action:
 *
 *   await hooksRegistry.emit("task:created", { orgId, issueId, ... });
 *
 * To add a new plugin's hooks:
 *   1. Create `lib/hooks/plugins/<your-plugin>.ts` and export a register fn.
 *   2. Import and call it inside `initHooks()` below.
 */

import { registerTaskHooks } from "./plugins/tasks";
import { registerPluginLifecycleHooks } from "./plugins/plugins";

export { hooksRegistry } from "./registry";
export type { HookEvent, HookEventMap, HookPayload, HookHandler } from "./registry";

let initialized = false;

/**
 * Registers all plugin hook handlers.
 * Call once at the top of every Next.js server action file (module-level).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initHooks(): void {
    if (initialized) return;
    initialized = true;

    registerTaskHooks();
    registerPluginLifecycleHooks();
}
