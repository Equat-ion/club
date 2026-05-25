import { db } from "@/lib/db";
import { permissionDefinitions } from "@/lib/db/schema";
import { SYSTEM_PERMISSIONS } from "./definitions";
import { validatePermissionDependencyGraph } from "./dependencies";
import { sql } from "drizzle-orm";

export async function getAllPermissionDefinitions() {
  const custom = await db.select().from(permissionDefinitions);
  
  const all = [
    ...SYSTEM_PERMISSIONS.map((p) => ({
      key: p.key,
      label: p.label,
      description: p.label,
      dependsOn: p.dependsOn as Record<string, boolean>,
      isSystem: true,
    })),
    ...custom.map((p) => ({
      key: p.key,
      label: p.label,
      description: p.description,
      dependsOn: p.dependsOn as Record<string, boolean>,
      isSystem: p.isSystem,
    })),
  ];
  return all;
}

export async function registerPluginPermissions(input: {
  pluginId: string;
  permissions: Array<{
    key: string;
    label: string;
    description: string;
    dependsOn: Record<string, boolean>;
  }>;
}) {
  validatePermissionDependencyGraph(input.permissions);
  
  if (input.permissions.length === 0) return;

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
