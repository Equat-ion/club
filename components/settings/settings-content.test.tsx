import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsContent } from "./settings-content";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("@/actions/settings", () => ({
  updateOrgName: vi.fn(),
  updateOrgLogo: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./delete-org-dialog", () => ({
  DeleteOrgDialog: () => <button type="button">Delete</button>,
}));

vi.mock("./sso-settings-panel", () => ({
  SSOSettingsPanel: () => <div data-testid="sso-panel">SSO panel</div>,
}));

describe("SettingsContent", () => {
  it("renders anchored sections and desktop index labels", () => {
    const { container } = render(
      <SettingsContent
        orgId="org_1"
        orgSlug="acm-club"
        orgName="ACM Club"
        orgLogo={null}
        initialSSOProviders={[]}
        enterpriseModeEnabled={false}
        roles={[]}
        initialMappings={[]}
        initialReviewQueue={[]}
      />,
    );

    expect(container.querySelector("#org-name")).not.toBeNull();
    expect(container.querySelector("#logo")).not.toBeNull();
    expect(container.querySelector("#enterprise")).not.toBeNull();
    expect(container.querySelector("#danger")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Enterprise" }),
    ).toBeInTheDocument();
  });
});
