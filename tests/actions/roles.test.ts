import { describe, expect, it, vi, beforeEach } from "vitest";
import { saveOrgRole } from "@/actions/roles";
import { requireOrgPermission } from "@/lib/authz/guards";
import { getAllPermissionDefinitions } from "@/lib/authz/registry";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    query: {
      orgRoles: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/authz/guards", () => ({
  requireOrgPermission: vi.fn(),
}));

vi.mock("@/lib/authz/registry", () => ({
  getAllPermissionDefinitions: vi.fn(),
}));

describe("saveOrgRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects permission sets that violate dependencies", async () => {
    vi.mocked(requireOrgPermission).mockResolvedValue({} as any);
    vi.mocked(getAllPermissionDefinitions).mockResolvedValue([
      { key: "tasks.view", dependsOn: {} },
      { key: "tasks.edit", dependsOn: { "tasks.view": true } },
      { key: "tasks.delete", dependsOn: { "tasks.view": true, "tasks.edit": true } },
    ] as any);

    const result = await saveOrgRole({
      orgId: "org_123",
      roleId: "role_123",
      permissionKeys: ["tasks.delete"],
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/requires tasks.view/);
  });

  it("accepts valid permission sets", async () => {
    vi.mocked(requireOrgPermission).mockResolvedValue({} as any);
    vi.mocked(getAllPermissionDefinitions).mockResolvedValue([
      { key: "tasks.view", dependsOn: {} },
      { key: "tasks.edit", dependsOn: { "tasks.view": true } },
    ] as any);

    const result = await saveOrgRole({
      orgId: "org_123",
      roleId: "role_123",
      permissionKeys: ["tasks.view", "tasks.edit"],
    });
    expect(result.success).toBe(true);
  });
});
