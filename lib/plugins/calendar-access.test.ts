import { describe, expect, it } from "vitest";

import { canManageCalendar } from "@/lib/auth/permissions";

describe("calendar access", () => {
  it("treats members as read-only", () => {
    expect(canManageCalendar("member")).toBe(false);
  });
});
