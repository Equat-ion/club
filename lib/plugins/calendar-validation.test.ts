import { describe, expect, it } from "vitest";

import { normalizeCalendarRange } from "@/lib/plugins/calendar-validation";

describe("normalizeCalendarRange", () => {
  it("keeps start before end and rejects empty ranges", () => {
    const result = normalizeCalendarRange(
      new Date("2026-04-18T10:00:00Z"),
      new Date("2026-04-18T11:00:00Z")
    );

    expect(result.start.toISOString()).toBe("2026-04-18T10:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-04-18T11:00:00.000Z");
  });
});
