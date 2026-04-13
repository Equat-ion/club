import {
  pgTable,
  text,
  timestamp,
  date,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { organization, user, member } from "./auth";
import { teams } from "./teams";

// ============================================================
// issues — Linear-inspired issue tracker, scoped per org
// ============================================================

export const issues = pgTable(
  "issues",
  {
    id: text("id").primaryKey(), // cuid2
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(), // e.g. "ACM-42"
    title: text("title").notNull(),
    description: text("description"), // markdown
    status: text("status").notNull().default("backlog"),
    // 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
    priority: text("priority").notNull().default("no_priority"),
    // 'no_priority' | 'urgent' | 'high' | 'medium' | 'low'
    assigneeId: text("assignee_id").references(() => member.id, {
      onDelete: "set null",
    }),
    teamId: text("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("issues_org_identifier_idx").on(table.orgId, table.identifier),
    index("idx_issues_org_id").on(table.orgId),
    index("idx_issues_org_status").on(table.orgId, table.status),
    index("idx_issues_assignee").on(table.assigneeId),
    index("idx_issues_team_id").on(table.teamId),
  ]
);

// ============================================================
// labels — Org-scoped labels
// ============================================================

export const labels = pgTable(
  "labels",
  {
    id: text("id").primaryKey(), // cuid2
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(), // hex string e.g. "#e2e8f0"
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_labels_org_name").on(table.orgId, table.name),
    index("idx_labels_org_id").on(table.orgId),
  ]
);

// ============================================================
// issue_labels — Junction table for many-to-many labels
// ============================================================

export const issueLabels = pgTable(
  "issue_labels",
  {
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.issueId, table.labelId] }),
    index("idx_issue_labels_issue_id").on(table.issueId),
    index("idx_issue_labels_label_id").on(table.labelId),
  ]
);

// ============================================================
// issue_comments
// ============================================================

export const issueComments = pgTable(
  "issue_comments",
  {
    id: text("id").primaryKey(), // cuid2
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(), // markdown
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_comments_issue_id").on(table.issueId)]
);

// ============================================================
// issue_activity — Audit log for issue changes
// ============================================================

export const issueActivity = pgTable(
  "issue_activity",
  {
    id: text("id").primaryKey(), // cuid2
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    type: text("type").notNull(),
    // 'created' | 'status_change' | 'priority_change' | 'assignment' | 'team_assignment' | 'comment' | 'system'
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_activity_issue_id").on(table.issueId)]
);
