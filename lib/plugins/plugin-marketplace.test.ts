import { describe, expect, it } from "vitest";

import { getPluginBySlug } from "@/lib/plugins/registry";

describe("plugin marketplace visibility", () => {
  it("exposes calendar as an installable plugin", () => {
    const plugin = getPluginBySlug("calendar");
    expect(plugin?.defaultEnabled).toBe(false);
  });
});
