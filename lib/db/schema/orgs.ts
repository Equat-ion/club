import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

// ============================================================
// org_profiles — Extended org data (supplements better-auth's organization table)
// 1:1 relation with organization. id = organizationId.
// ============================================================

export const orgProfiles = pgTable("org_profiles", {
  id: text("id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"), // 'free' | 'plus' | 'enterprise'
  issueCounter: integer("issue_counter").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// org_plugins — Per-org plugin state
// ============================================================

export const orgPlugins = pgTable(
  "org_plugins",
  {
    id: text("id").primaryKey(), // cuid2
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pluginId: text("plugin_id").notNull(), // matches Plugin.id in registry
    enabled: boolean("enabled").notNull().default(true),
    settings: jsonb("settings").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("org_plugins_org_plugin_idx").on(table.orgId, table.pluginId)]
);
