import { describe, expect, it } from "vitest";

import { getPluginBySlug } from "@/lib/plugins/registry";

describe("calendar plugin registry", () => {
  it("registers calendar as an opt-in plugin", () => {
    const plugin = getPluginBySlug("calendar");
    expect(plugin?.id).toBe("calendar");
    expect(plugin?.defaultEnabled).toBe(false);
  });
});
