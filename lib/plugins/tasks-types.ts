// ============================================================
// Shared types and constants for the Task Management plugin
// ============================================================

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled";

export type TaskPriority =
  | "no_priority"
  | "urgent"
  | "high"
  | "medium"
  | "low";

// For backward compatibility while refactoring
export type IssueStatus = TaskStatus;
export type IssuePriority = TaskPriority;

export interface TaskFilterState {
  status: TaskStatus | null;
  priority: TaskPriority | null;
  assignee: string | null;
  team: string | null;
  label: string | null;
}

export const TASK_STATUSES: {
  value: TaskStatus;
  label: string;
  order: number;
}[] = [
  { value: "backlog", label: "Backlog", order: 0 },
  { value: "todo", label: "Todo", order: 1 },
  { value: "in_progress", label: "In Progress", order: 2 },
  { value: "done", label: "Done", order: 3 },
  { value: "cancelled", label: "Cancelled", order: 4 },
];

export const TASK_PRIORITIES: {
  value: TaskPriority;
  label: string;
  order: number;
}[] = [
  { value: "urgent", label: "Urgent", order: 0 },
  { value: "high", label: "High", order: 1 },
  { value: "medium", label: "Medium", order: 2 },
  { value: "low", label: "Low", order: 3 },
  { value: "no_priority", label: "No Priority", order: 4 },
];

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type TaskWithDetails = {
  id: string;
  orgId: string;
  identifier: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  teamId: string | null;
  creatorId: string;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: {
    id: string; // memberId
    name: string;
    image: string | null;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
  creator: {
    id: string; // userId
    name: string;
    image: string | null;
  };
  labels: Label[];
};

// For backward compatibility
export type IssueWithAssignee = TaskWithDetails;

export type TaskComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string; // userId
    name: string;
    image: string | null;
  };
};

export type IssueComment = TaskComment;

export type TaskActivityEntry = {
  id: string;
  taskId: string;
  type: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
  actor: {
    id: string; // userId
    name: string;
    image: string | null;
  };
};

export type IssueActivityEntry = TaskActivityEntry;

export type OrgMember = {
  id: string; // memberId
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export type OrgTeam = {
  id: string;
  name: string;
};
