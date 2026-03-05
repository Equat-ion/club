// ============================================================
// Shared types and constants for the Task Management plugin
// ============================================================

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled";

export type IssuePriority =
  | "no_priority"
  | "urgent"
  | "high"
  | "medium"
  | "low";

export const ISSUE_STATUSES: {
  value: IssueStatus;
  label: string;
  order: number;
}[] = [
  { value: "backlog", label: "Backlog", order: 0 },
  { value: "todo", label: "Todo", order: 1 },
  { value: "in_progress", label: "In Progress", order: 2 },
  { value: "done", label: "Done", order: 3 },
  { value: "cancelled", label: "Cancelled", order: 4 },
];

export const ISSUE_PRIORITIES: {
  value: IssuePriority;
  label: string;
  order: number;
}[] = [
  { value: "urgent", label: "Urgent", order: 0 },
  { value: "high", label: "High", order: 1 },
  { value: "medium", label: "Medium", order: 2 },
  { value: "low", label: "Low", order: 3 },
  { value: "no_priority", label: "No Priority", order: 4 },
];

export type IssueWithAssignee = {
  id: string;
  orgId: string;
  identifier: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type IssueComment = {
  id: string;
  issueId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type IssueActivityEntry = {
  id: string;
  issueId: string;
  type: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type OrgMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};
