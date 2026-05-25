import { pgTable, text, boolean, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organization, member } from "./auth";

export const permissionDefinitions = pgTable("permission_definitions", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  pluginId: text("plugin_id"),
  label: text("label").notNull(),
  description: text("description").notNull(),
  dependsOn: jsonb("depends_on").notNull().default({}),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orgRoles = pgTable("org_roles", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("org_roles_org_key_idx").on(table.orgId, table.key),
]);

export const orgRolePermissions = pgTable("org_role_permissions", {
  id: text("id").primaryKey(),
  roleId: text("role_id").notNull().references(() => orgRoles.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(),
});

export const memberRoleAssignments = pgTable("member_role_assignments", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => orgRoles.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberPermissionGrants = pgTable("member_permission_grants", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => member.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
