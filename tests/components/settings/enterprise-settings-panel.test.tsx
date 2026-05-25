import { render, screen } from "@testing-library/react";
import { EnterpriseSettingsPanel } from "@/components/settings/enterprise-settings-panel";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      refresh: vi.fn(),
    };
  },
}));

describe("EnterpriseSettingsPanel", () => {
  it("renders enterprise mode, saml, scim, mappings, and review queue sections", () => {
    render(
      <EnterpriseSettingsPanel
        orgId="org_123"
        orgSlug="acme"
        enterpriseModeEnabled={true}
        initialSSOProviders={[]}
        roles={[{ id: "role_1", name: "Admin", key: "admin" }]}
        initialMappings={[]}
        initialReviewQueue={[]}
      />
    );
    expect(screen.getByText("Enterprise mode")).toBeInTheDocument();
    expect(screen.getByText("Enterprise SSO")).toBeInTheDocument();
    expect(screen.getByText("SCIM Directory Provisioning")).toBeInTheDocument();
    expect(screen.getByText("Group Mappings")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Review Queue")).toBeInTheDocument();
  });
});
