import { describe, expect, it } from "vitest";

import { orgCalendars, orgCalendarEvents } from "@/lib/db/schema/calendar";

describe("calendar schema exports", () => {
  it("exports the org calendar tables", () => {
    expect(orgCalendars).toBeDefined();
    expect(orgCalendarEvents).toBeDefined();
  });
});
