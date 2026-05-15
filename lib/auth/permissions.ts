import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/organization/access";

// Extend the default statements with plugin-level resources
const statement = {
  ...defaultStatements,
  issue: [
    "create",
    "update",
    "update_own",
    "delete",
    "comment",
    "delete_own_comment",
    "delete_any_comment",
  ],
} as const;

export const ac = createAccessControl(statement);

// owner = "Admin" in UI — full control including billing and org deletion
export const owner = ac.newRole({
  issue: [
    "create",
    "update",
    "update_own",
    "delete",
    "comment",
    "delete_own_comment",
    "delete_any_comment",
  ],
  ...adminAc.statements,
  organization: ["update", "delete"],
});

// admin = "Lead" in UI — officer-level, manages members and content
export const admin = ac.newRole({
  issue: [
    "create",
    "update",
    "update_own",
    "delete",
    "comment",
    "delete_own_comment",
    "delete_any_comment",
  ],
  ...adminAc.statements,
});

// member = "Member" in UI — contributor, limited write access
export const member = ac.newRole({
  issue: ["create", "update_own", "comment", "delete_own_comment"],
});

/**
 * Maps internal better-auth role names to UI-facing labels.
 * The UI should never reference internal role names directly.
 */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: "Admin",
  admin: "Lead",
  member: "Member",
} as const;

/**
 * Maps UI-facing role labels back to internal better-auth role names.
 */
export const DISPLAY_NAME_TO_ROLE: Record<string, string> = {
  Admin: "owner",
  Lead: "admin",
  Member: "member",
} as const;

export function canManageCalendar(role: string): boolean {
  return role === "owner" || role === "admin";
}
