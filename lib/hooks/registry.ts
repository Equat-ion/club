/**
 * lib/hooks/registry.ts
 *
 * Typed, in-memory hooks registry.
 *
 * - All hooks are "after" hooks — they fire after the action succeeds.
 * - Handlers are observe-only; they cannot mutate data or abort actions.
 * - Errors in handlers are caught and logged; they never propagate to callers.
 * - Cross-plugin listeners are allowed — any plugin can listen to any event.
 */

// ---------------------------------------------------------------------------
// Typed event payload map
// ---------------------------------------------------------------------------

export type HookEventMap = {
    /** Fired after a task (issue) is successfully created. */
    "task:created": {
        orgId: string;
        issueId: string;
        identifier: string;
        title: string;
        creatorId: string;
    };

    /** Fired after a task is successfully updated. */
    "task:updated": {
        orgId: string;
        issueId: string;
        /** Partial map of the fields that were changed (new values). */
        changes: {
            title?: string;
            description?: string;
            status?: string;
            priority?: string;
            assigneeId?: string | null;
            dueDate?: string | null;
        };
        actorId: string;
    };

    /** Fired after a task is successfully deleted. */
    "task:deleted": {
        orgId: string;
        issueId: string;
        actorId: string;
    };

    /** Fired after a plugin is successfully enabled for an org. */
    "plugin:enabled": {
        orgId: string;
        pluginId: string;
        /** Plugin IDs that were also enabled as cascaded dependencies. */
        cascaded: string[];
    };

    /** Fired after a plugin is successfully disabled for an org. */
    "plugin:disabled": {
        orgId: string;
        pluginId: string;
    };
};

export type HookEvent = keyof HookEventMap;
export type HookPayload<E extends HookEvent> = HookEventMap[E];
export type HookHandler<E extends HookEvent> = (
    payload: HookPayload<E>
) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

class HooksRegistry {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly handlers = new Map<HookEvent, HookHandler<any>[]>();

    /**
     * Register a handler for the given event.
     * Multiple handlers per event are allowed and called in registration order.
     */
    on<E extends HookEvent>(event: E, handler: HookHandler<E>): void {
        const existing = this.handlers.get(event) ?? [];
        existing.push(handler);
        this.handlers.set(event, existing);
    }

    /**
     * Fire all registered handlers for the given event.
     * Handlers run concurrently (Promise.allSettled) so one slow handler
     * doesn't block the others.
     * Errors are caught and logged to the console — they never propagate.
     */
    async emit<E extends HookEvent>(
        event: E,
        payload: HookPayload<E>
    ): Promise<void> {
        const eventHandlers = this.handlers.get(event);
        if (!eventHandlers?.length) return;

        const results = await Promise.allSettled(
            eventHandlers.map((handler) => handler(payload))
        );

        for (const result of results) {
            if (result.status === "rejected") {
                console.error(
                    `[Hooks] Error in handler for "${event}":`,
                    result.reason
                );
            }
        }
    }

    /** Returns the number of handlers registered for a given event. Useful for testing. */
    handlerCount(event: HookEvent): number {
        return this.handlers.get(event)?.length ?? 0;
    }
}

// Singleton export — the same instance is used across the entire server process.
export const hooksRegistry = new HooksRegistry();
