import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, member } from "./auth";

// ============================================================
// teams — Org-scoped teams
// ============================================================

export const teams = pgTable(
  "teams",
  {
    id: text("id").primaryKey(), // cuid2
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"), // hex code for avatar/badge accent
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_teams_org_id").on(table.orgId),
  ]
);

// ============================================================
// team_members — Junction table for team membership
// ============================================================

export const teamMembers = pgTable(
  "team_members",
  {
    id: text("id").primaryKey(), // cuid2
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // 'leader' | 'member'
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_members_unique_idx").on(table.teamId, table.memberId),
    index("idx_team_members_team_id").on(table.teamId),
    index("idx_team_members_member_id").on(table.memberId),
  ]
);
