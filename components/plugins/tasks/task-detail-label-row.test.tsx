import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskDetail } from "./task-detail";
import type {
  Label,
  OrgMember,
  OrgTeam,
  TaskActivityEntry,
  TaskComment,
  TaskWithDetails,
} from "@/lib/plugins/tasks-types";

vi.mock("@/actions/tasks", () => ({
  updateTask: vi.fn(async () => ({ success: true })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("./task-metadata-row", () => ({
  TaskMetadataRow: () => <div data-testid="task-metadata-row">metadata row</div>,
}));

vi.mock("./task-discussion", () => ({
  TaskDiscussion: () => <div>Discussion content</div>,
}));

vi.mock("./task-activity", () => ({
  TaskActivity: () => <div>Activity content</div>,
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
const comments: TaskComment[] = [];
const activity: TaskActivityEntry[] = [];

describe("TaskDetail", () => {
  it("renders task labels under the title next to date info", () => {
    render(
      <TaskDetail
        task={task}
        comments={comments}
        activity={activity}
        members={members}
        labels={labels}
        teams={teams}
        teamsEnabled={false}
        currentUser={{ id: "user_1", name: "Alice", image: null }}
      />
    );

    expect(screen.getByText("Created by")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
  });
});
