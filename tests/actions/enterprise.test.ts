import { describe, expect, it, vi, beforeEach } from "vitest";
import { enableEnterpriseMode } from "@/actions/enterprise";
import { db } from "@/lib/db";
import { requireOrgPermission } from "@/lib/authz/guards";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      orgProfiles: {
        findFirst: vi.fn(),
      },
      enterpriseConnections: {
        findFirst: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/authz/guards", () => ({
  requireOrgPermission: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      generateSCIMToken: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("enableEnterpriseMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables enterprise mode once", async () => {
    vi.mocked(requireOrgPermission).mockResolvedValue({} as any);
    vi.mocked(db.query.orgProfiles.findFirst).mockResolvedValue({
      id: "org_123",
      enterpriseModeEnabled: false,
    } as any);
    vi.mocked(db.query.enterpriseConnections.findFirst).mockResolvedValue(null as any);
    vi.mocked(db.query.organization.findFirst).mockResolvedValue({ id: "org_123", slug: "acme" } as any);

    const result = await enableEnterpriseMode({ orgId: "org_123", confirmationText: "ENABLE ENTERPRISE" });
    expect(result.success).toBe(true);
  });

  it("fails with incorrect confirmation text", async () => {
    const result = await enableEnterpriseMode({ orgId: "org_123", confirmationText: "WRONG" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Confirmation text does not match");
  });
});
