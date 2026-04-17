import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskMetadataRow } from "./task-metadata-row";
import type { Label, OrgMember, OrgTeam, TaskWithDetails } from "@/lib/plugins/tasks-types";

vi.mock("./status-select", () => ({
  StatusSelect: () => <div>Status</div>,
}));

vi.mock("./priority-select", () => ({
  PrioritySelect: () => <div>Priority</div>,
}));

vi.mock("./assignee-select", () => ({
  AssigneeSelect: () => <div>Assignee</div>,
}));

vi.mock("./team-picker", () => ({
  TeamPicker: () => <div>Team</div>,
}));

vi.mock("./label-picker", () => ({
  LabelPicker: () => <button type="button">Add label</button>,
}));

const labels: Label[] = [
  { id: "label_1", name: "Bug", color: "#ef4444" },
  { id: "label_2", name: "Backend", color: "#3b82f6" },
];

const task: TaskWithDetails = {
  id: "task_1",
  orgId: "org_1",
  identifier: "ACM-1",
  title: "Fix issue",
  description: "Details",
  status: "todo",
  priority: "high",
  assigneeId: null,
  teamId: null,
  creatorId: "user_1",
  dueDate: null,
  createdAt: new Date("2026-04-10T00:00:00.000Z"),
  updatedAt: new Date("2026-04-10T00:00:00.000Z"),
  assignee: null,
  team: null,
  creator: { id: "user_1", name: "Alice", image: null },
  labels,
};

const members: OrgMember[] = [];
const teams: OrgTeam[] = [];

describe("TaskMetadataRow", () => {
  it("does not render selected label badges near the selector controls", () => {
    render(
      <TaskMetadataRow
        task={task}
        members={members}
        labels={labels}
        teams={teams}
        teamsEnabled={false}
        onUpdate={vi.fn(async () => undefined)}
        orgId="org_1"
      />
    );

    expect(screen.getByRole("button", { name: "Add label" })).toBeInTheDocument();
    expect(screen.queryByText("Bug")).not.toBeInTheDocument();
    expect(screen.queryByText("Backend")).not.toBeInTheDocument();
  });
});
