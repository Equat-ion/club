export function validatePermissionDependencyGraph(
  definitions: Array<{ key: string; dependsOn: Record<string, boolean> }>,
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
    const def = byKey.get(key);
    if (def) {
      for (const dependency of Object.keys(def.dependsOn)) {
        visit(dependency);
      }
    }
    visiting.delete(key);
    visited.add(key);
  }

  for (const definition of definitions) {
    visit(definition.key);
  }
}

/**
 * Validates a set of granted permissions to ensure they contain all required dependencies.
 * If a required dependency is missing, it is automatically added (implied permission).
 */
export function expandPermissionsWithDependencies(
  grantedKeys: string[],
  allDefinitions: Array<{ key: string; dependsOn: Record<string, boolean> }>,
): Set<string> {
  const expanded = new Set<string>(grantedKeys);
  const byKey = new Map(allDefinitions.map((def) => [def.key, def]));

  function addDependencies(key: string) {
    const def = byKey.get(key);
    if (!def) return;
    for (const depKey of Object.keys(def.dependsOn)) {
      if (!expanded.has(depKey)) {
        expanded.add(depKey);
        addDependencies(depKey);
      }
    }
  }

  for (const key of grantedKeys) {
    addDependencies(key);
  }

  return expanded;
}

/**
 * Validates that a set of permission keys has no missing dependencies.
 */
export function validatePermissionGrantSet(
  permissionKeys: string[],
  allDefinitions: Array<{ key: string; dependsOn: Record<string, boolean> }>,
) {
  const granted = new Set(permissionKeys);
  const byKey = new Map(allDefinitions.map((def) => [def.key, def]));

  for (const key of permissionKeys) {
    const def = byKey.get(key);
    if (!def) continue;
    for (const depKey of Object.keys(def.dependsOn)) {
      if (!granted.has(depKey)) {
        throw new Error(`Invalid permission set: ${key} requires ${depKey}`);
      }
    }
  }
}
