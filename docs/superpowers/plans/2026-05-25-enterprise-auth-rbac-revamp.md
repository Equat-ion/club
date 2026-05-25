# Enterprise Auth and RBAC Revamp Implementation Plan



**Goal:** Build a one-way enterprise mode with one SAML/SCIM connection per org, replace fixed org-role authorization with a capability-based permission system, derive enterprise access from SCIM + SAML groups, and lock enterprise-managed non-admin users to their provisioned org.

**Architecture:** Keep Better Auth for sessions, base org membership, SSO, and SCIM endpoints, but move product authorization into Club-owned permission tables and evaluators. Enterprise access becomes a policy layer on top of memberships: SCIM manages lifecycle and synced groups, SAML asserts groups at login, Club grants effective permissions only when the two sources align and the mapped role set resolves cleanly.

**Tech Stack:** Next.js App Router, Better Auth, `@better-auth/sso`, `@better-auth/scim`, Drizzle ORM, PostgreSQL, Server Actions, Vitest, React Testing Library.

---

## File Structure

### Existing files to modify
- `package.json`
- `lib/auth/auth.ts`
- `lib/auth/permissions.ts`
- `lib/auth/session.ts`
- `lib/db/schema/auth.ts`
- `lib/db/schema/orgs.ts`
- `lib/db/schema/index.ts`
- `app/api/auth/[...all]/route.ts`
- `app/app/[slug]/layout.tsx`
- `app/app/[slug]/settings/page.tsx`
- `app/app/page.tsx`
- `components/layout/app-sidebar.tsx`
- `components/layout/org-switcher.tsx`
- `components/layout/create-org-dialog.tsx`
- `components/settings/settings-content.tsx`
- `components/settings/settings-sections.ts`
- `components/settings/sso-settings-panel.tsx`
- `components/settings/sso-provider-list.tsx`
- `actions/members.ts`
- `actions/settings.ts`
- `actions/sso.ts`
- `actions/orgs.ts`
- `components/members/change-role-dialog.tsx`
- `components/members/members-table.tsx`
- `components/members/invite-member-dialog.tsx`
- `app/app/[slug]/members/page.tsx`
- `app/app/[slug]/plugins/page.tsx`
- `actions/plugins.ts`
- `actions/tasks.ts`
- `actions/teams.ts`

### New files to create
- `lib/db/schema/rbac.ts`
- `lib/db/schema/enterprise.ts`
- `lib/authz/definitions.ts`
- `lib/authz/registry.ts`
- `lib/authz/dependencies.ts`
- `lib/authz/effective-permissions.ts`
- `lib/authz/guards.ts`
- `lib/enterprise/constants.ts`
- `lib/enterprise/group-alignment.ts`
- `lib/enterprise/sso-groups.ts`
- `lib/enterprise/scim.ts`
- `actions/enterprise.ts`
- `actions/roles.ts`
- `components/settings/enterprise-settings-panel.tsx`
- `components/settings/enterprise-mode-card.tsx`
- `components/settings/scim-settings-card.tsx`
- `components/settings/group-mapping-card.tsx`
- `components/settings/enterprise-review-queue.tsx`
- `components/settings/copyable-value.tsx`
- `components/members/member-permission-badges.tsx`
- `tests/lib/authz/dependencies.test.ts`
- `tests/lib/authz/effective-permissions.test.ts`
- `tests/lib/enterprise/group-alignment.test.ts`
- `tests/actions/enterprise.test.ts`
- `tests/actions/roles.test.ts`
- `tests/components/settings/enterprise-settings-panel.test.tsx`

### Database migration artifacts
- `drizzle/*.sql` for new RBAC and enterprise tables/columns

---

### Task 1: Install SCIM dependency and define the target schema

**Files:**
- Modify: `package.json`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/db/schema/rbac.ts`
- Create: `lib/db/schema/enterprise.ts`

- [ ] **Step 1: Add the missing Better Auth SCIM dependency**

```json
{
  "dependencies": {
    "-auth/scim": "^1.5.3"
  }
}
```

- [ ] **Step 2: Define RBAC tables in `lib/db/schema/rbac.ts`**

```ts
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
```

- [ ] **Step 3: Define enterprise tables in `lib/db/schema/enterprise.ts`**

```ts
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
```

- [ ] **Step 4: Extend `org_profiles` for the irreversible enterprise flag**

```ts
export const orgProfiles = pgTable("org_profiles", {
  id: text("id").primaryKey().references(() => organization.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  issueCounter: integer("issue_counter").notNull().default(0),
  enterpriseModeEnabled: boolean("enterprise_mode_enabled").notNull().default(false),
  enterpriseModeEnabledAt: timestamp("enterprise_mode_enabled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

- [ ] **Step 5: Export the new schema from `lib/db/schema/index.ts`**

```ts
export * from "./rbac";
export * from "./enterprise";
```

- [ ] **Step 6: Run migration generation**

Run: `bunx drizzle-kit generate`
Expected: new SQL migration files for RBAC and enterprise schema

- [ ] **Step 7: Commit**

```bash
git add package.json lib/db/schema/index.ts lib/db/schema/orgs.ts lib/db/schema/rbac.ts lib/db/schema/enterprise.ts drizzle
git commit -m "feat: add enterprise and rbac schema"
```

### Task 2: Seed system permissions and build dependency validation

**Files:**
- Create: `lib/authz/definitions.ts`
- Create: `lib/authz/registry.ts`
- Create: `lib/authz/dependencies.ts`
- Test: `tests/lib/authz/dependencies.test.ts`

- [ ] **Step 1: Write the failing dependency validation tests**

```ts
import { describe, expect, it } from "vitest";
import { validatePermissionDependencyGraph } from "@/lib/authz/dependencies";

describe("validatePermissionDependencyGraph", () => {
  it("accepts a valid acyclic permission graph", () => {
    expect(() =>
      validatePermissionDependencyGraph([
        { key: "tasks.view", dependsOn: {} },
        { key: "tasks.edit", dependsOn: { "tasks.view": true } },
        { key: "tasks.delete", dependsOn: { "tasks.view": true, "tasks.edit": true } },
      ]),
    ).not.toThrow();
  });

  it("rejects missing dependencies", () => {
    expect(() =>
      validatePermissionDependencyGraph([
        { key: "members.manage_roles", dependsOn: { "members.view": true } },
      ]),
    ).toThrow(/missing dependency/i);
  });

  it("rejects cyclic dependencies", () => {
    expect(() =>
      validatePermissionDependencyGraph([
        { key: "a", dependsOn: { b: true } },
        { key: "b", dependsOn: { a: true } },
      ]),
    ).toThrow(/cycle/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- tests/lib/authz/dependencies.test.ts`
Expected: FAIL because `validatePermissionDependencyGraph` does not exist yet

- [ ] **Step 3: Create the system permission catalog**

```ts
export const SYSTEM_PERMISSIONS = [
  { key: "org.view", label: "View organization", dependsOn: {} },
  { key: "org.manage", label: "Manage organization", dependsOn: { "org.view": true } },
  { key: "members.view", label: "View members", dependsOn: {} },
  { key: "members.invite", label: "Invite members", dependsOn: { "members.view": true } },
  { key: "members.manage_roles", label: "Manage member roles", dependsOn: { "members.view": true } },
  { key: "settings.view", label: "View settings", dependsOn: { "org.view": true } },
  { key: "settings.manage", label: "Manage settings", dependsOn: { "settings.view": true } },
  { key: "enterprise.manage", label: "Manage enterprise settings", dependsOn: { "settings.manage": true } },
  { key: "billing.view", label: "View billing", dependsOn: { "org.view": true } },
  { key: "billing.manage", label: "Manage billing", dependsOn: { "billing.view": true } },
  { key: "plugins.view", label: "View plugins", dependsOn: { "org.view": true } },
  { key: "plugins.manage", label: "Manage plugins", dependsOn: { "plugins.view": true } },
  { key: "tasks.view", label: "View tasks", dependsOn: {} },
  { key: "tasks.create", label: "Create tasks", dependsOn: { "tasks.view": true } },
  { key: "tasks.edit", label: "Edit tasks", dependsOn: { "tasks.view": true } },
  { key: "tasks.delete", label: "Delete tasks", dependsOn: { "tasks.view": true, "tasks.edit": true } },
] as const;
```

- [ ] **Step 4: Implement the validation and registry helpers**

```ts
export function validatePermissionDependencyGraph(
  definitions: Array<{ key: string; dependsOn: Record<string, true> }>,
) {
  const keys = new Set(definitions.map((definition) => definition.key));
  for (const definition of definitions) {
    for (const dependency of Object.keys(definition.dependsOn)) {
      if (!keys.has(dependency)) {
        throw new Error(`Permission ${definition.key} has missing dependency ${dependency}`);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byKey = new Map(definitions.map((definition) => [definition.key, definition]));

  function visit(key: string) {
    if (visited.has(key)) return;
    if (visiting.has(key)) throw new Error(`Dependency cycle detected at ${key}`);
    visiting.add(key);
    for (const dependency of Object.keys(byKey.get(key)?.dependsOn ?? {})) {
      visit(dependency);
    }
    visiting.delete(key);
    visited.add(key);
  }

  for (const definition of definitions) visit(definition.key);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun run test -- tests/lib/authz/dependencies.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/authz/definitions.ts lib/authz/registry.ts lib/authz/dependencies.ts tests/lib/authz/dependencies.test.ts
git commit -m "feat: add permission definitions and dependency validation"
```

### Task 3: Build effective permission resolution and authorization guards

**Files:**
- Create: `lib/authz/effective-permissions.ts`
- Create: `lib/authz/guards.ts`
- Modify: `lib/auth/permissions.ts`
- Test: `tests/lib/authz/effective-permissions.test.ts`

- [ ] **Step 1: Write the failing effective-permissions tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveEffectivePermissions } from "@/lib/authz/effective-permissions";

describe("resolveEffectivePermissions", () => {
  it("unions permissions from multiple role assignments", () => {
    const result = resolveEffectivePermissions({
      rolePermissions: [["tasks.view"], ["members.view", "members.invite"]],
      directPermissions: [],
    });
    expect(result.has("tasks.view")).toBe(true);
    expect(result.has("members.invite")).toBe(true);
  });

  it("includes direct member grants", () => {
    const result = resolveEffectivePermissions({
      rolePermissions: [["tasks.view"]],
      directPermissions: ["tasks.edit"],
    });
    expect(result.has("tasks.edit")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- tests/lib/authz/effective-permissions.test.ts`
Expected: FAIL because resolver does not exist yet

- [ ] **Step 3: Implement the resolver and guard helpers**

```ts
export function resolveEffectivePermissions(input: {
  rolePermissions: string[][];
  directPermissions: string[];
}) {
  const effective = new Set<string>();
  for (const bundle of input.rolePermissions) {
    for (const permission of bundle) effective.add(permission);
  }
  for (const permission of input.directPermissions) effective.add(permission);
  return effective;
}

export function hasPermission(
  effectivePermissions: Set<string>,
  permissionKey: string,
) {
  return effectivePermissions.has(permissionKey);
}
```

- [ ] **Step 4: Replace `lib/auth/permissions.ts` role-label-only responsibilities**

```ts
export const LEGACY_ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: "Admin",
  admin: "Lead",
  member: "Member",
};

export const SYSTEM_ROLE_KEYS = {
  enterpriseAdmin: "enterprise_admin",
  lead: "lead",
  member: "member",
} as const;
```

- [ ] **Step 5: Run the tests**

Run: `bun run test -- tests/lib/authz/effective-permissions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/authz/effective-permissions.ts lib/authz/guards.ts lib/auth/permissions.ts tests/lib/authz/effective-permissions.test.ts
git commit -m "feat: add effective permission resolution"
```

### Task 4: Configure Better Auth for SCIM and enterprise hooks

**Files:**
- Modify: `lib/auth/auth.ts`
- Modify: `lib/db/schema/auth.ts`
- Modify: `lib/auth/session.ts`
- Modify: `app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Add SCIM plugin setup next to SSO**

```ts
import { scim } from "@better-auth/scim";

plugins: [
  organization({ /* existing config */ }),
  sso({
    modelName: "sso_provider",
    organizationProvisioning: {
      disabled: false,
      defaultRole: "member",
    },
    provisionUserOnEveryLogin: true,
  }),
  scim({
    requiredRole: ["owner"],
  }),
  dash(),
  nextCookies(),
]
```

- [ ] **Step 2: Extend the auth-side member model only where compatibility requires it**

```ts
export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  userId: text("user_id").notNull().references(() => user.id),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 3: Add enterprise-aware helper types in session utilities**

```ts
export type SessionOrgAccess = {
  orgId: string;
  memberId: string;
  legacyRole: string;
  effectivePermissions: string[];
  enterpriseStatus: "active" | "pending_review" | "deprovisioned" | "suspended";
  orgSwitchingLocked: boolean;
};
```

- [ ] **Step 4: Keep the existing SAML ACS patch route intact, but add room for enterprise login-state enrichment**

```ts
// After the SAML ACS patch logic, route handling remains delegated to Better Auth.
// Enterprise login-time group ingestion should happen in auth hooks, not by forking the full route.
```

- [ ] **Step 5: Run typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS or targeted errors only in still-unmigrated call sites

- [ ] **Step 6: Commit**

```bash
git add lib/auth/auth.ts lib/db/schema/auth.ts lib/auth/session.ts app/api/auth/[...all]/route.ts
git commit -m "feat: enable scim plugin and enterprise auth hooks"
```

### Task 5: Add enterprise actions and irreversible mode enablement

**Files:**
- Create: `actions/enterprise.ts`
- Test: `tests/actions/enterprise.test.ts`
- Modify: `actions/settings.ts`

- [ ] **Step 1: Write failing tests for enterprise mode enablement**

```ts
import { describe, expect, it } from "vitest";
import { enableEnterpriseMode } from "@/actions/enterprise";

describe("enableEnterpriseMode", () => {
  it("enables enterprise mode once", async () => {
    const result = await enableEnterpriseMode({ orgId: "org_123", confirmationText: "ENABLE ENTERPRISE" });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- tests/actions/enterprise.test.ts`
Expected: FAIL because action does not exist yet

- [ ] **Step 3: Implement irreversible enablement**

```ts
export async function enableEnterpriseMode(input: {
  orgId: string;
  confirmationText: string;
}) {
  if (input.confirmationText !== "ENABLE ENTERPRISE") {
    return { success: false, error: "Confirmation text does not match" };
  }

  const adminCheck = await ensureOrgAdmin(input.orgId);
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  if (adminCheck.profile.enterpriseModeEnabled) {
    return { success: false, error: "Enterprise mode is already enabled" };
  }

  await db.update(orgProfiles).set({
    enterpriseModeEnabled: true,
    enterpriseModeEnabledAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(orgProfiles.id, input.orgId));

  return { success: true };
}
```

- [ ] **Step 4: Add SCIM token generation and rotation actions**

```ts
export async function generateScimToken(input: { orgId: string; providerId: string }) {
  const response = await auth.api.generateSCIMToken({
    headers: await headers(),
    body: {
      providerId: input.providerId,
      organizationId: input.orgId,
    },
  });

  return {
    success: true,
    token: response.token,
  };
}
```

- [ ] **Step 5: Run the tests**

Run: `bun run test -- tests/actions/enterprise.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add actions/enterprise.ts actions/settings.ts tests/actions/enterprise.test.ts
git commit -m "feat: add enterprise mode and scim token actions"
```

### Task 6: Persist and validate SCIM and SAML group alignment

**Files:**
- Create: `lib/enterprise/group-alignment.ts`
- Create: `lib/enterprise/scim.ts`
- Create: `lib/enterprise/sso-groups.ts`
- Test: `tests/lib/enterprise/group-alignment.test.ts`
- Modify: `actions/sso.ts`

- [ ] **Step 1: Write failing tests for alignment policy**

```ts
import { describe, expect, it } from "vitest";
import { evaluateEnterpriseGroupAlignment } from "@/lib/enterprise/group-alignment";

describe("evaluateEnterpriseGroupAlignment", () => {
  it("is aligned when saml groups are contained in the mapped scim groups", () => {
    expect(
      evaluateEnterpriseGroupAlignment({
        mappedGroups: ["club-admins", "club-leads"],
        scimGroups: ["club-admins", "club-leads"],
        samlGroups: ["club-admins"],
      }).state,
    ).toBe("aligned");
  });

  it("is mismatched when saml claims an unmapped group absent from scim", () => {
    expect(
      evaluateEnterpriseGroupAlignment({
        mappedGroups: ["club-admins"],
        scimGroups: ["club-admins"],
        samlGroups: ["club-admins", "rogue-group"],
      }).state,
    ).toBe("mismatch");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- tests/lib/enterprise/group-alignment.test.ts`
Expected: FAIL because helper does not exist yet

- [ ] **Step 3: Implement alignment logic**

```ts
export function evaluateEnterpriseGroupAlignment(input: {
  mappedGroups: string[];
  scimGroups: string[];
  samlGroups: string[];
}) {
  const mapped = new Set(input.mappedGroups);
  const scim = new Set(input.scimGroups.filter((group) => mapped.has(group)));
  const saml = new Set(input.samlGroups.filter((group) => mapped.has(group)));

  for (const group of saml) {
    if (!scim.has(group)) {
      return { state: "mismatch" as const };
    }
  }

  if (saml.size === 0 && scim.size === 0) {
    return { state: "unmapped" as const };
  }

  return { state: "aligned" as const };
}
```

- [ ] **Step 4: Add helpers to store SCIM and SAML groups on enterprise member state**

```ts
export async function recordScimGroups(memberId: string, groups: string[]) {
  await db.update(enterpriseMemberState).set({
    scimGroups: groups,
    lastScimSyncAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(enterpriseMemberState.memberId, memberId));
}

export async function recordSamlGroups(memberId: string, groups: string[]) {
  await db.update(enterpriseMemberState).set({
    samlGroups: groups,
    lastSamlLoginAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(enterpriseMemberState.memberId, memberId));
}
```

- [ ] **Step 5: Expand `actions/sso.ts` to enforce one SAML provider per org**

```ts
const existingProviders = await auth.api.listSSOProviders({ headers: adminCheck.headers });
const existingForOrg = existingProviders.providers.filter(
  (provider) => provider.organizationId === input.orgId,
);

if (existingForOrg.length > 0) {
  return { success: false, error: "Only one SAML provider is allowed per organization" };
}
```

- [ ] **Step 6: Run the tests**

Run: `bun run test -- tests/lib/enterprise/group-alignment.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/enterprise/group-alignment.ts lib/enterprise/scim.ts lib/enterprise/sso-groups.ts actions/sso.ts tests/lib/enterprise/group-alignment.test.ts
git commit -m "feat: add enterprise group alignment logic"
```

### Task 7: Add role-management actions and plugin permission registration API

**Files:**
- Create: `actions/roles.ts`
- Create: `lib/authz/registry.ts`
- Test: `tests/actions/roles.test.ts`

- [ ] **Step 1: Write failing tests for role updates**

```ts
import { describe, expect, it } from "vitest";
import { saveOrgRole } from "@/actions/roles";

describe("saveOrgRole", () => {
  it("rejects permission sets that violate dependencies", async () => {
    const result = await saveOrgRole({
      orgId: "org_123",
      roleId: "role_123",
      permissionKeys: ["tasks.delete"],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- tests/actions/roles.test.ts`
Expected: FAIL because action does not exist yet

- [ ] **Step 3: Implement role save and grant validation**

```ts
export async function saveOrgRole(input: {
  orgId: string;
  roleId: string;
  permissionKeys: string[];
}) {
  validatePermissionGrantSet(input.permissionKeys);
  await db.delete(orgRolePermissions).where(eq(orgRolePermissions.roleId, input.roleId));
  await db.insert(orgRolePermissions).values(
    input.permissionKeys.map((permissionKey) => ({
      id: createId(),
      roleId: input.roleId,
      permissionKey,
    })),
  );
  return { success: true };
}
```

- [ ] **Step 4: Implement plugin permission registration API**

```ts
export async function registerPluginPermissions(input: {
  pluginId: string;
  permissions: Array<{
    key: string;
    label: string;
    description: string;
    dependsOn: Record<string, true>;
  }>;
}) {
  validatePermissionDependencyGraph(input.permissions);
  await db.insert(permissionDefinitions).values(
    input.permissions.map((permission) => ({
      id: permission.key,
      key: permission.key,
      pluginId: input.pluginId,
      label: permission.label,
      description: permission.description,
      dependsOn: permission.dependsOn,
      isSystem: false,
    })),
  ).onConflictDoUpdate({
    target: permissionDefinitions.key,
    set: {
      label: sql`excluded.label`,
      description: sql`excluded.description`,
      dependsOn: sql`excluded.depends_on`,
    },
  });
}
```

- [ ] **Step 5: Run the tests**

Run: `bun run test -- tests/actions/roles.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add actions/roles.ts lib/authz/registry.ts tests/actions/roles.test.ts
git commit -m "feat: add role management and permission registration api"
```

### Task 8: Migrate settings UI to a dedicated Enterprise section

**Files:**
- Create: `components/settings/enterprise-settings-panel.tsx`
- Create: `components/settings/enterprise-mode-card.tsx`
- Create: `components/settings/scim-settings-card.tsx`
- Create: `components/settings/group-mapping-card.tsx`
- Create: `components/settings/enterprise-review-queue.tsx`
- Create: `components/settings/copyable-value.tsx`
- Modify: `components/settings/settings-content.tsx`
- Modify: `components/settings/settings-sections.ts`
- Modify: `components/settings/sso-settings-panel.tsx`
- Modify: `components/settings/sso-provider-list.tsx`
- Test: `tests/components/settings/enterprise-settings-panel.test.tsx`

- [ ] **Step 1: Write the failing enterprise settings panel test**

```tsx
import { render, screen } from "@testing-library/react";
import { EnterpriseSettingsPanel } from "@/components/settings/enterprise-settings-panel";

it("renders enterprise mode, saml, scim, mappings, and review queue sections", () => {
  render(<EnterpriseSettingsPanel orgId="org_123" orgSlug="acme" />);
  expect(screen.getByText("Enterprise mode")).toBeInTheDocument();
  expect(screen.getByText("SAML SSO")).toBeInTheDocument();
  expect(screen.getByText("SCIM Provisioning")).toBeInTheDocument();
  expect(screen.getByText("Group mappings")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- tests/components/settings/enterprise-settings-panel.test.tsx`
Expected: FAIL because component does not exist yet

- [ ] **Step 3: Add `enterprise` to the settings nav**

```ts
export const SETTINGS_SECTIONS = [
  { id: "org-name", label: "Organization Name" },
  { id: "logo", label: "Logo" },
  { id: "enterprise", label: "Enterprise" },
  { id: "danger", label: "Danger Zone" },
] as const;
```

- [ ] **Step 4: Replace the old SSO section in settings content**

```tsx
<section id="enterprise" className="scroll-mt-24 space-y-4 border-t pt-8">
  <EnterpriseSettingsPanel
    orgId={orgId}
    orgSlug={orgSlug}
    initialSSOProviders={initialSSOProviders}
  />
</section>
```

- [ ] **Step 5: Add copyable full-value rows for SAML details**

```tsx
<CopyableValue
  label="ACS URL"
  value={provider.samlConfig?.callbackUrl ?? `${appUrl}/api/auth/sso/saml2/sp/acs/${provider.providerId}` }
/>
<CopyableValue
  label="SP Entity ID"
  value={`${appUrl}/api/auth/sso/saml2/sp/metadata?providerId=${provider.providerId}` }
/>
<CopyableValue
  label="Metadata URL"
  value={`${appUrl}/api/auth/sso/saml2/sp/metadata?providerId=${provider.providerId}` }
/>
```

- [ ] **Step 6: Add enterprise mode card confirmation UX**

```tsx
<Button
  variant="destructive"
  disabled={loading || enterpriseModeEnabled}
  onClick={() => enableEnterpriseMode({ orgId, confirmationText })}
>
  {enterpriseModeEnabled ? "Enabled permanently" : "Enable enterprise mode"}
</Button>
```

- [ ] **Step 7: Run the tests**

Run: `bun run test -- tests/components/settings/enterprise-settings-panel.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components/settings/enterprise-settings-panel.tsx components/settings/enterprise-mode-card.tsx components/settings/scim-settings-card.tsx components/settings/group-mapping-card.tsx components/settings/enterprise-review-queue.tsx components/settings/copyable-value.tsx components/settings/settings-content.tsx components/settings/settings-sections.ts components/settings/sso-settings-panel.tsx components/settings/sso-provider-list.tsx tests/components/settings/enterprise-settings-panel.test.tsx
git commit -m "feat: add enterprise settings section"
```

### Task 9: Lock enterprise-managed non-admin users out of org switching and org creation

**Files:**
- Modify: `app/app/[slug]/layout.tsx`
- Modify: `components/layout/app-sidebar.tsx`
- Modify: `components/layout/org-switcher.tsx`
- Modify: `components/layout/create-org-dialog.tsx`
- Modify: `app/app/page.tsx`
- Modify: `actions/orgs.ts`

- [ ] **Step 1: Compute enterprise lock state in org layout**

```ts
return {
  org: {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    plan: profile?.plan ?? "free",
    role: membership.role,
    memberId: membership.id,
    orgSwitchingLocked: enterpriseState?.provisionSource === "scim" && !effectivePermissions.has("enterprise.manage"),
  },
  enabledPluginIds: enabledPlugins.map((p) => p.pluginId),
};
```

- [ ] **Step 2: Hide switch/create affordances in `components/layout/org-switcher.tsx`**

```tsx
const switchingLocked = activeOrg.orgSwitchingLocked;

{!switchingLocked && visibleOrgs.map(/* existing items */)}
{!switchingLocked && (
  <DropdownMenuItem onClick={() => router.push("/app?create=true")}>
    <Plus className="size-4" />
    <span>Create organisation</span>
  </DropdownMenuItem>
)}
```

- [ ] **Step 3: Hide settings/plugins/menu items based on permissions instead of legacy role string**

```tsx
visible: org.permissions.includes("plugins.manage")
visible: org.permissions.includes("settings.manage")
```

- [ ] **Step 4: Enforce the same restriction server-side in org creation actions**

```ts
if (sessionOrgAccess.orgSwitchingLocked) {
  throw new Error("Enterprise-managed members cannot create or switch organizations");
}
```

- [ ] **Step 5: Run targeted UI and type checks**

Run: `bun run test -- components/settings/settings-content.test.tsx components/settings/settings-section-nav.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/app/[slug]/layout.tsx components/layout/app-sidebar.tsx components/layout/org-switcher.tsx components/layout/create-org-dialog.tsx app/app/page.tsx actions/orgs.ts
git commit -m "feat: lock enterprise managed users to a single org"
```

### Task 10: Migrate member management from fixed roles to role assignments and status-aware enterprise flows

**Files:**
- Modify: `actions/members.ts`
- Modify: `components/members/change-role-dialog.tsx`
- Modify: `components/members/members-table.tsx`
- Modify: `components/members/invite-member-dialog.tsx`
- Modify: `app/app/[slug]/members/page.tsx`
- Create: `components/members/member-permission-badges.tsx`

- [ ] **Step 1: Replace direct Better Auth role updates with Club role assignment updates for enterprise members**

```ts
export async function updateMemberAssignedRoles(orgId: string, memberId: string, roleIds: string[]) {
  await requirePermission(orgId, "members.manage_roles");
  await db.delete(memberRoleAssignments).where(eq(memberRoleAssignments.memberId, memberId));
  await db.insert(memberRoleAssignments).values(
    roleIds.map((roleId) => ({
      id: createId(),
      memberId,
      roleId,
      source: "manual",
    })),
  );
  return { success: true };
}
```

- [ ] **Step 2: Keep legacy invitation role only for non-enterprise orgs during migration**

```ts
if (!orgProfile.enterpriseModeEnabled) {
  await auth.api.createInvitation({
    headers: await headers(),
    body: {
      email,
      role,
      organizationId: orgId,
    },
  });
}
```

- [ ] **Step 3: Show enterprise status in the members table**

```tsx
<Badge variant={member.enterpriseStatus === "active" ? "default" : "secondary"}>
  {member.enterpriseStatus}
</Badge>
```

- [ ] **Step 4: Disable manual role editing for SCIM-managed enterprise members unless using the enterprise review/role assignment path**

```tsx
const roleEditingDisabled = member.provisionSource === "scim" && member.enterpriseStatus === "active";
```

- [ ] **Step 5: Run members tests or targeted typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS for members call sites

- [ ] **Step 6: Commit**

```bash
git add actions/members.ts components/members/change-role-dialog.tsx components/members/members-table.tsx components/members/invite-member-dialog.tsx app/app/[slug]/members/page.tsx components/members/member-permission-badges.tsx
git commit -m "feat: migrate member management to org role assignments"
```

### Task 11: Migrate route and action authorization to permission checks

**Files:**
- Modify: `app/app/[slug]/settings/page.tsx`
- Modify: `app/app/[slug]/plugins/page.tsx`
- Modify: `actions/plugins.ts`
- Modify: `actions/tasks.ts`
- Modify: `actions/teams.ts`
- Modify: `actions/settings.ts`
- Modify: `actions/sso.ts`

- [ ] **Step 1: Introduce a reusable permission requirement helper**

```ts
export async function requireOrgPermission(orgId: string, permissionKey: string) {
  const access = await getSessionOrgAccess(orgId);
  if (!access.effectivePermissions.includes(permissionKey)) {
    throw new Error(`Missing permission: ${permissionKey}`);
  }
  return access;
}
```

- [ ] **Step 2: Replace legacy `membership.role === "owner"` settings guard**

```ts
await requireOrgPermission(org.id, "settings.manage");
```

- [ ] **Step 3: Replace plugin management guard**

```ts
await requireOrgPermission(orgId, "plugins.manage");
```

- [ ] **Step 4: Replace tasks and teams role checks with equivalent permission keys**

```ts
await requireOrgPermission(orgId, "tasks.edit");
await requireOrgPermission(orgId, "members.manage_roles");
```

- [ ] **Step 5: Run targeted verification**

Run: `bunx tsc --noEmit`
Expected: PASS with legacy role string checks removed from app-level auth surfaces

- [ ] **Step 6: Commit**

```bash
git add app/app/[slug]/settings/page.tsx app/app/[slug]/plugins/page.tsx actions/plugins.ts actions/tasks.ts actions/teams.ts actions/settings.ts actions/sso.ts
git commit -m "refactor: migrate app auth checks to permission guards"
```

### Task 12: Add review queue behavior for unmapped or mismatched enterprise members

**Files:**
- Create: `components/settings/enterprise-review-queue.tsx`
- Modify: `actions/enterprise.ts`
- Modify: `lib/enterprise/group-alignment.ts`

- [ ] **Step 1: Implement review-queue queries**

```ts
export async function getEnterpriseReviewQueue(orgId: string) {
  return db.query.enterpriseMemberState.findMany({
    where: and(
      eq(enterpriseMemberState.orgId, orgId),
      inArray(enterpriseMemberState.status, ["pending_review", "suspended"]),
    ),
  });
}
```

- [ ] **Step 2: Implement admin activation from review queue**

```ts
export async function activateEnterpriseMember(input: {
  orgId: string;
  memberId: string;
  roleIds: string[];
}) {
  await requireOrgPermission(input.orgId, "members.manage_roles");
  await assignMemberRoles(input.memberId, input.roleIds, "enterprise_review");
  await db.update(enterpriseMemberState).set({
    status: "active",
    updatedAt: new Date(),
  }).where(eq(enterpriseMemberState.memberId, input.memberId));
  return { success: true };
}
```

- [ ] **Step 3: Render the queue in settings**

```tsx
{queue.length === 0 ? (
  <p className="text-sm text-muted-foreground">No members need review.</p>
) : (
  queue.map((entry) => <ReviewQueueRow key={entry.id} entry={entry} />)
)}
```

- [ ] **Step 4: Run targeted tests**

Run: `bun run test -- tests/components/settings/enterprise-settings-panel.test.tsx tests/actions/enterprise.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/settings/enterprise-review-queue.tsx actions/enterprise.ts lib/enterprise/group-alignment.ts
git commit -m "feat: add enterprise review queue"
```

### Task 13: Backfill default roles and permission bundles

**Files:**
- Modify: migration SQL in `drizzle/*.sql`
- Modify: `lib/authz/definitions.ts`
- Modify: `actions/roles.ts`

- [ ] **Step 1: Add migration backfill statements for default org roles**

```sql
INSERT INTO org_roles (id, org_id, key, name, description, is_system, created_at, updated_at)
SELECT
  concat(o.id, ':enterprise_admin'),
  o.id,
  'enterprise_admin',
  'Admin',
  'Full org administration',
  true,
  now(),
  now()
FROM organization o
ON CONFLICT DO NOTHING;

INSERT INTO org_roles (id, org_id, key, name, description, is_system, created_at, updated_at)
SELECT
  concat(o.id, ':lead'),
  o.id,
  'lead',
  'Lead',
  'Operational management permissions',
  true,
  now(),
  now()
FROM organization o
ON CONFLICT DO NOTHING;

INSERT INTO org_roles (id, org_id, key, name, description, is_system, created_at, updated_at)
SELECT
  concat(o.id, ':member'),
  o.id,
  'member',
  'Member',
  'Default collaboration permissions',
  true,
  now(),
  now()
FROM organization o
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Backfill default role-permission relationships**

```sql
INSERT INTO org_role_permissions (id, role_id, permission_key)
SELECT concat(r.id, ':', p.permission_key), r.id, p.permission_key
FROM org_roles r
JOIN (
  VALUES
    ('enterprise_admin', 'org.view'),
    ('enterprise_admin', 'org.manage'),
    ('enterprise_admin', 'members.view'),
    ('enterprise_admin', 'members.invite'),
    ('enterprise_admin', 'members.manage_roles'),
    ('enterprise_admin', 'settings.view'),
    ('enterprise_admin', 'settings.manage'),
    ('enterprise_admin', 'enterprise.manage'),
    ('enterprise_admin', 'billing.view'),
    ('enterprise_admin', 'billing.manage'),
    ('enterprise_admin', 'plugins.view'),
    ('enterprise_admin', 'plugins.manage'),
    ('enterprise_admin', 'tasks.view'),
    ('enterprise_admin', 'tasks.create'),
    ('enterprise_admin', 'tasks.edit'),
    ('enterprise_admin', 'tasks.delete'),
    ('lead', 'org.view'),
    ('lead', 'members.view'),
    ('lead', 'members.invite'),
    ('lead', 'settings.view'),
    ('lead', 'plugins.view'),
    ('lead', 'tasks.view'),
    ('lead', 'tasks.create'),
    ('lead', 'tasks.edit'),
    ('member', 'org.view'),
    ('member', 'members.view'),
    ('member', 'tasks.view'),
    ('member', 'tasks.create')
) AS p(role_key, permission_key)
  ON p.role_key = r.key
ON CONFLICT DO NOTHING;
```

- [ ] **Step 3: Add one-time assignment migration from legacy member.role**

```sql
INSERT INTO member_role_assignments (id, member_id, role_id, source, created_at)
SELECT
  concat(m.id, ':seed'),
  m.id,
  CASE
    WHEN m.role = 'owner' THEN concat(m.organization_id, ':enterprise_admin')
    WHEN m.role = 'admin' THEN concat(m.organization_id, ':lead')
    ELSE concat(m.organization_id, ':member')
  END,
  'migration',
  now()
FROM member m
ON CONFLICT DO NOTHING;
```

- [ ] **Step 4: Run migration locally**

Run: `bunx drizzle-kit migrate`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add drizzle lib/authz/definitions.ts actions/roles.ts
git commit -m "feat: backfill default org roles and permission bundles"
```

### Task 14: Verification pass

**Files:**
- Test: `tests/lib/authz/dependencies.test.ts`
- Test: `tests/lib/authz/effective-permissions.test.ts`
- Test: `tests/lib/enterprise/group-alignment.test.ts`
- Test: `tests/actions/enterprise.test.ts`
- Test: `tests/actions/roles.test.ts`
- Test: `tests/components/settings/enterprise-settings-panel.test.tsx`

- [ ] **Step 1: Run focused test suites**

Run: `bun run test -- tests/lib/authz/dependencies.test.ts tests/lib/authz/effective-permissions.test.ts tests/lib/enterprise/group-alignment.test.ts tests/actions/enterprise.test.ts tests/actions/roles.test.ts tests/components/settings/enterprise-settings-panel.test.tsx`
Expected: PASS

- [ ] **Step 2: Run project typecheck**

Run: `bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Run project build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Manual verification checklist**

```text
1. Enable enterprise mode for a test org and confirm it cannot be disabled.
2. Register one SAML provider and confirm a second provider is rejected.
3. Copy ACS URL, Entity ID, and Metadata URL from the settings card.
4. Generate a SCIM token and confirm only the masked token remains visible after creation.
5. Provision a user with mapped groups and confirm access becomes active.
6. Provision a user with no mapped groups and confirm they enter pending review.
7. Sign in with SAML groups mismatching stored SCIM groups and confirm access is suspended or routed to review.
8. Confirm enterprise-managed non-admin users cannot switch orgs or create orgs.
9. Confirm enterprise-admin users derived from mapped groups can access enterprise settings.
10. Confirm plugin-defined permissions can be registered only when dependency graphs are valid.
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete enterprise auth and rbac revamp"
```
