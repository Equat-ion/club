import { describe, expect, it } from "vitest";
import { pickActiveSectionId } from "./section-nav-state";

describe("pickActiveSectionId", () => {
  it("returns the first visible section by layout order", () => {
    const next = pickActiveSectionId(
      [
        { id: "sso", isIntersecting: true },
        { id: "org-name", isIntersecting: false },
      ],
      "org-name",
      ["org-name", "logo", "sso", "danger"],
    );

    expect(next).toBe("sso");
  });

  it("keeps current section when no section intersects", () => {
    const next = pickActiveSectionId([], "logo", [
      "org-name",
      "logo",
      "sso",
      "danger",
    ]);
    expect(next).toBe("logo");
  });
});
