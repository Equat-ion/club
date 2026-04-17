import { describe, expect, it } from "vitest";
import { formatDisplayPath, splitDomainList } from "./sso-provider-list-utils";

describe("sso provider list utils", () => {
  it("returns path + query for absolute urls", () => {
    expect(
      formatDisplayPath("https://clubhq.com/api/auth/sso?provider=acme"),
    ).toBe("/api/auth/sso?provider=acme");
  });

  it("normalizes comma-delimited domains", () => {
    expect(splitDomainList("acme.org, staff.acme.org")).toEqual([
      "acme.org",
      "staff.acme.org",
    ]);
  });
});
