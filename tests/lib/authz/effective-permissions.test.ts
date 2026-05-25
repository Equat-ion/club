import { describe, expect, it } from "vitest";
import { resolveEffectivePermissions } from "@/lib/authz/effective-permissions";

describe("resolveEffectivePermissions", () => {
  it("unions permissions from multiple role assignments", () => {
    const result = resolveEffectivePermissions({
      rolePermissions: [["tasks.view"], ["members.view", "members.invite"]],
      directPermissions: [],
    });
    expect(result.has("tasks.view")).toBe(true);
    expect(result.has("members.invite")).toBe(true);
    expect(result.has("members.view")).toBe(true);
  });

  it("includes direct member grants", () => {
    const result = resolveEffectivePermissions({
      rolePermissions: [["tasks.view"]],
      directPermissions: ["tasks.edit"],
    });
    expect(result.has("tasks.edit")).toBe(true);
    expect(result.has("tasks.view")).toBe(true);
  });
});
