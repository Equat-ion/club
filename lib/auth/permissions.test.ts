import { describe, expect, it } from "vitest";

import { canManageCalendar } from "@/lib/auth/permissions";

describe("canManageCalendar", () => {
  it("allows admins and owners to edit calendar data", () => {
    expect(canManageCalendar("admin")).toBe(true);
    expect(canManageCalendar("owner")).toBe(true);
    expect(canManageCalendar("member")).toBe(false);
  });
});
