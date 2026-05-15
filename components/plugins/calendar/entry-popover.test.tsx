import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EntryPopover } from "./entry-popover";

describe("EntryPopover", () => {
  it("renders an all-day toggle and calendar selector", () => {
    render(
      <EntryPopover
        open
        event={null}
        calendars={[]}
        canManageCalendar
        defaultDate={new Date("2026-04-18T10:00:00Z")}
        defaultEndDate={new Date("2026-04-18T11:00:00Z")}
        onOpenChange={() => {}}
        onSave={async () => {}}
        onDelete={async () => {}}
      />
    );

    expect(screen.getByLabelText("All day")).toBeInTheDocument();
  });
});
