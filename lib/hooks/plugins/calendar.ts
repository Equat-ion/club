import { hooksRegistry } from "../registry";

export function registerCalendarHooks(): void {
  hooksRegistry.on("calendar:created", (payload) => {
    console.log(
      `[calendar] Calendar "${payload.name}" created for org ${payload.orgId}`
    );
  });

  hooksRegistry.on("calendar:event_created", (payload) => {
    console.log(
      `[calendar] Event ${payload.eventId} created in org ${payload.orgId}`
    );
  });
}
