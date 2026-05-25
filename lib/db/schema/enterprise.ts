import { pgTable, text, boolean, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organization, member, user } from "./auth";

export const enterpriseConnections = pgTable("enterprise_connections", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  samlProviderId: text("saml_provider_id"),
  scimProviderId: text("scim_provider_id"),
  scimTokenHash: text("scim_token_hash"),
  scimTokenLastFour: text("scim_token_last_four"),
  scimTokenLastUsedAt: timestamp("scim_token_last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("enterprise_connections_org_idx").on(table.orgId)]);

export const enterpriseGroupMappings = pgTable("enterprise_group_mappings", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  groupKey: text("group_key").notNull(),
  roleId: text("role_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("enterprise_group_mappings_org_group_idx").on(table.orgId, table.groupKey)]);

export const enterpriseMemberState = pgTable("enterprise_member_state", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  provisionSource: text("provision_source").notNull().default("manual"),
  scimGroups: jsonb("scim_groups").notNull().default([]),
  samlGroups: jsonb("saml_groups").notNull().default([]),
  alignmentState: text("alignment_state").notNull().default("unknown"),
  lastScimSyncAt: timestamp("last_scim_sync_at"),
  lastSamlLoginAt: timestamp("last_saml_login_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
