import { describe, expect, it } from "vitest";

describe("settings test harness", () => {
  it("runs in jsdom", () => {
    document.body.innerHTML = "<main data-testid='root'></main>";
    expect(document.querySelector("[data-testid='root']")).not.toBeNull();
  });
});
