import { describe, expect, it } from "vitest";

import { calculateOverlappingColumns } from "./calendar-utils";

describe("calculateOverlappingColumns", () => {
  it("places overlapping events in separate columns", () => {
    const events = [
      {
        id: "a",
        start: new Date("2026-04-18T10:00:00Z"),
        end: new Date("2026-04-18T11:00:00Z"),
      },
      {
        id: "b",
        start: new Date("2026-04-18T10:30:00Z"),
        end: new Date("2026-04-18T11:30:00Z"),
      },
    ];

    expect(calculateOverlappingColumns(events)).toHaveLength(2);
  });
});
