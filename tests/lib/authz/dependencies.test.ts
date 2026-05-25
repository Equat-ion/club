import { describe, expect, it } from "vitest";
import { validatePermissionDependencyGraph } from "@/lib/authz/dependencies";

describe("validatePermissionDependencyGraph", () => {
  it("accepts a valid acyclic permission graph", () => {
    expect(() =>
      validatePermissionDependencyGraph([
        { key: "tasks.view", dependsOn: {} },
        { key: "tasks.edit", dependsOn: { "tasks.view": true } },
        { key: "tasks.delete", dependsOn: { "tasks.view": true, "tasks.edit": true } },
      ]),
    ).not.toThrow();
  });

  it("rejects missing dependencies", () => {
    expect(() =>
      validatePermissionDependencyGraph([
        { key: "members.manage_roles", dependsOn: { "members.view": true } },
      ]),
    ).toThrow(/missing dependency/i);
  });

  it("rejects cyclic dependencies", () => {
    expect(() =>
      validatePermissionDependencyGraph([
        { key: "a", dependsOn: { b: true } },
        { key: "b", dependsOn: { a: true } },
      ]),
    ).toThrow(/cycle/i);
  });
});
