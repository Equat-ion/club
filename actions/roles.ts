"use server";

import { db } from "@/lib/db";
import { orgRolePermissions, orgRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { validatePermissionGrantSet } from "@/lib/authz/dependencies";
import { getAllPermissionDefinitions } from "@/lib/authz/registry";
import { requireOrgPermission } from "@/lib/authz/guards";
import { revalidatePath } from "next/cache";

export async function saveOrgRole(input: {
  orgId: string;
  roleId: string;
  permissionKeys: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireOrgPermission(input.orgId, "members.manage_roles");
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" };
  }

  try {
    const allDefs = await getAllPermissionDefinitions();
    
    // Validate that dependencies are satisfied within the set of granted permissions
    validatePermissionGrantSet(input.permissionKeys, allDefs);

    await db.delete(orgRolePermissions).where(eq(orgRolePermissions.roleId, input.roleId));
    
    if (input.permissionKeys.length > 0) {
      await db.insert(orgRolePermissions).values(
        input.permissionKeys.map((permissionKey) => ({
          id: createId(),
          roleId: input.roleId,
          permissionKey,
        })),
      );
    }

    // Revalidate paths
    const role = await db.query.orgRoles.findFirst({
      where: eq(orgRoles.id, input.roleId),
      with: {
        // Since we don't have relations set up, we query org slug manually if needed.
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save role" };
  }
}

export async function getOrgRoles(orgId: string) {
  try {
    return await db.select().from(orgRoles).where(eq(orgRoles.orgId, orgId));
  } catch (err) {
    console.error("Failed to fetch organization roles:", err);
    return [];
  }
}
