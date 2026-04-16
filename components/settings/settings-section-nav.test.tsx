import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsSectionNav } from "./settings-section-nav";
import { SETTINGS_SECTIONS } from "./settings-sections";

describe("SettingsSectionNav", () => {
  it("renders all section labels and marks active item", () => {
    const onNavigate = vi.fn();

    render(
      <SettingsSectionNav
        sections={SETTINGS_SECTIONS}
        activeSectionId="sso"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("Organization Name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enterprise SSO" }),
    ).toHaveAttribute("data-active", "true");
  });
});
