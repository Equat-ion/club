import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeleteOrgDialog } from "./delete-org-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/actions/settings", () => ({
  deleteOrg: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DeleteOrgDialog", () => {
  it("shows org slug in destructive confirmation copy", () => {
    render(<DeleteOrgDialog orgId="org_1" orgName="ACM Club" orgSlug="acm-club" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText(/This action is permanent\./i)).toBeInTheDocument();
    expect(screen.getByText("acm-club")).toBeInTheDocument();
  });
});
