import {
  pgTable,
  text,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

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
    assigneeId: text("assignee_id").references(() => user.id, {
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
    // 'created' | 'status_change' | 'priority_change' | 'assignment' | 'comment'
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_activity_issue_id").on(table.issueId)]
);
