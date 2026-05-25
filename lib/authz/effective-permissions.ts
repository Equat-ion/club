export function resolveEffectivePermissions(input: {
  rolePermissions: string[][];
  directPermissions: string[];
}) {
  const effective = new Set<string>();
  for (const bundle of input.rolePermissions) {
    for (const permission of bundle) {
      effective.add(permission);
    }
  }
  for (const permission of input.directPermissions) {
    effective.add(permission);
  }
  return effective;
}

export function hasPermission(
  effectivePermissions: Set<string>,
  permissionKey: string,
) {
  return effectivePermissions.has(permissionKey);
}
