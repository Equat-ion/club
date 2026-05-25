import { describe, expect, it } from "vitest";
import { evaluateEnterpriseGroupAlignment } from "@/lib/enterprise/group-alignment";

describe("evaluateEnterpriseGroupAlignment", () => {
  it("is aligned when saml groups are contained in the mapped scim groups", () => {
    expect(
      evaluateEnterpriseGroupAlignment({
        mappedGroups: ["club-admins", "club-leads"],
        scimGroups: ["club-admins", "club-leads"],
        samlGroups: ["club-admins"],
      }).state,
    ).toBe("aligned");
  });

  it("is mismatched when saml claims an unmapped group absent from scim", () => {
    expect(
      evaluateEnterpriseGroupAlignment({
        mappedGroups: ["club-admins"],
        scimGroups: ["club-admins"],
        samlGroups: ["club-admins", "rogue-group"],
      }).state,
    ).toBe("mismatch");
  });
});
