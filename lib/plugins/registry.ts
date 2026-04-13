export type Plugin = {
  id: string;
  name: string;
  description: string;
  slug: string;
  /** Lucide icon name string — resolved to a React component by `resolvePluginIcon` on the frontend. */
  icon: string;
  plans: ("free" | "plus" | "enterprise")[];
  defaultEnabled: boolean;
  category: "productivity" | "communication" | "management" | "other";
  version: string;
  /** If true, the plugin is shown in the marketplace but cannot be installed yet. */
  comingSoon?: boolean;
  /**
   * Hard dependencies — plugin IDs that MUST be enabled before this plugin
   * can be enabled. The server enforces this; the UI cascades auto-enable
   * with a confirmation dialog.
   */
  dependencies?: string[];
  /**
   * Optional / peer dependencies — plugin IDs that this plugin works better
   * with. Displayed in the UI as informational only; never enforced.
   */
  optionalDependencies?: string[];
};

export const PLUGINS: Plugin[] = [
  {
    id: "tasks",
    name: "Task Management",
    description: "Linear-inspired issue tracker for your org",
    slug: "tasks",
    icon: "CheckSquare",
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: true,
    category: "productivity",
    version: "1.0.0",
    // No dependencies — Tasks is a root plugin.
  },
  {
    id: "teams",
    name: "Teams",
    description: "Divide your members into teams and appoint leaders",
    slug: "teams",
    icon: "Users",
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: false,
    category: "management",
    version: "1.0.0",
  },
  {
    id: "chat",
    name: "Chat",
    description: "Real-time messaging for your organization members",
    slug: "chat",
    icon: "MessageSquare",
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: false,
    category: "communication",
    version: "0.1.0",
    comingSoon: true,
  },
  {
    id: "federations",
    name: "Federations",
    description: "Connect and collaborate with other organizations",
    slug: "federations",
    icon: "Globe",
    plans: ["plus", "enterprise"],
    defaultEnabled: false,
    category: "other",
    version: "0.1.0",
    comingSoon: true,
  },
  {
    id: "files",
    name: "Files",
    description: "Secure cloud storage and file sharing for your club",
    slug: "files",
    icon: "FileText",
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: false,
    category: "productivity",
    version: "0.1.0",
    comingSoon: true,
  },
  {
    id: "notes",
    name: "Notes",
    description: "Collaborative rich-text notes and documentation",
    slug: "notes",
    icon: "NotebookPen",
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: false,
    category: "productivity",
    version: "0.1.0",
    comingSoon: true,
  },
  // future: recruitment, finances, whiteboards
];

// ---------------------------------------------------------------------------
// Startup validation — catches cycles at module-load time
// ---------------------------------------------------------------------------

/**
 * Validates the plugin registry for cycles in the hard-dependency graph.
 * Throws synchronously if a cycle is detected.
 * Called once at module init so a misconfigured registry crashes loudly,
 * not silently at runtime.
 */
export function validateRegistry(): void {
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(id: string) {
    if (stack.has(id)) {
      throw new Error(
        `[Plugin Registry] Circular dependency detected involving plugin "${id}". ` +
        `Cycle path: ${[...stack].join(" → ")} → ${id}`
      );
    }
    if (visited.has(id)) return;

    stack.add(id);
    const plugin = PLUGINS.find((p) => p.id === id);
    for (const depId of plugin?.dependencies ?? []) {
      dfs(depId);
    }
    stack.delete(id);
    visited.add(id);
  }

  for (const plugin of PLUGINS) {
    dfs(plugin.id);
  }
}

// Run immediately on module load.
validateRegistry();

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Returns plugins available for a given plan.
 */
export function getPluginsForPlan(
  plan: "free" | "plus" | "enterprise"
): Plugin[] {
  return PLUGINS.filter((p) => p.plans.includes(plan));
}

/**
 * Returns a plugin by its ID.
 */
export function getPluginById(id: string): Plugin | undefined {
  return PLUGINS.find((p) => p.id === id);
}

/**
 * Returns a plugin by its URL slug.
 */
export function getPluginBySlug(slug: string): Plugin | undefined {
  return PLUGINS.find((p) => p.slug === slug);
}

// ---------------------------------------------------------------------------
// Dependency helpers
// ---------------------------------------------------------------------------

/**
 * Returns the direct hard dependencies of a plugin (the plugins it requires).
 */
export function getDirectDependencies(pluginId: string): Plugin[] {
  const plugin = getPluginById(pluginId);
  if (!plugin?.dependencies?.length) return [];
  return plugin.dependencies.flatMap((id) => getPluginById(id) ?? []);
}

/**
 * Returns all plugins that directly hard-depend on the given plugin
 * (i.e. the reverse / "dependents" edge).
 */
export function getDirectDependents(pluginId: string): Plugin[] {
  return PLUGINS.filter((p) => p.dependencies?.includes(pluginId));
}

/**
 * Returns the full transitive set of plugins that must be enabled
 * before `pluginId` can be enabled (breadth-first, deduped).
 */
export function getTransitiveDependencies(pluginId: string): Plugin[] {
  const visited = new Set<string>();
  const result: Plugin[] = [];
  const queue = [pluginId];

  while (queue.length) {
    const current = queue.shift()!;
    for (const dep of getDirectDependencies(current)) {
      if (!visited.has(dep.id)) {
        visited.add(dep.id);
        result.push(dep);
        queue.push(dep.id);
      }
    }
  }

  return result;
}

/**
 * Returns all plugins that transitively depend on the given plugin
 * (i.e. the full reverse-reachability set). Used by `canDisablePlugin`.
 */
export function getTransitiveDependents(pluginId: string): Plugin[] {
  const visited = new Set<string>();
  const result: Plugin[] = [];
  const queue = [pluginId];

  while (queue.length) {
    const current = queue.shift()!;
    for (const dep of getDirectDependents(current)) {
      if (!visited.has(dep.id)) {
        visited.add(dep.id);
        result.push(dep);
        queue.push(dep.id);
      }
    }
  }

  return result;
}

/**
 * Returns the hard dependencies of `pluginId` that are NOT currently enabled.
 * Used by the UI to determine which plugins need to be auto-enabled (with
 * a confirmation dialog) before `pluginId` can be activated.
 */
export function getMissingDependencies(
  pluginId: string,
  enabledPluginIds: string[]
): Plugin[] {
  const enabledSet = new Set(enabledPluginIds);
  return getTransitiveDependencies(pluginId).filter(
    (dep) => !enabledSet.has(dep.id)
  );
}

/**
 * Returns whether a plugin can safely be disabled given the set of
 * currently-enabled plugin IDs.
 *
 * A plugin **cannot** be disabled if any currently-enabled plugin
 * transitively depends on it (not just direct dependents).
 *
 * Returns `{ allowed: true }` or `{ allowed: false, blockedBy: Plugin[] }`
 * where `blockedBy` lists the enabled plugins preventing the action.
 */
export function canDisablePlugin(
  pluginId: string,
  enabledPluginIds: string[]
): { allowed: true } | { allowed: false; blockedBy: Plugin[] } {
  const enabledSet = new Set(enabledPluginIds);
  const blockedBy = getTransitiveDependents(pluginId).filter((p) =>
    enabledSet.has(p.id)
  );

  if (blockedBy.length === 0) return { allowed: true };
  return { allowed: false, blockedBy };
}

/**
 * Given a set of plugin IDs to enable, returns them in topological order
 * (dependencies first) so they can be activated without missing prerequisites.
 *
 * Cycles are already prevented by `validateRegistry()` at startup, so this
 * will not throw in production. The cycle guard is kept as a safety net.
 */
export function getEnableOrder(pluginIds: string[]): Plugin[] {
  const idSet = new Set(pluginIds);
  const plugins = PLUGINS.filter((p) => idSet.has(p.id));

  const visited = new Set<string>();
  const stack = new Set<string>();
  const sorted: Plugin[] = [];

  function visit(plugin: Plugin) {
    if (stack.has(plugin.id)) {
      throw new Error(`Circular plugin dependency detected: ${plugin.id}`);
    }
    if (visited.has(plugin.id)) return;

    stack.add(plugin.id);
    for (const depId of plugin.dependencies ?? []) {
      const dep = getPluginById(depId);
      if (dep && idSet.has(dep.id)) visit(dep);
    }
    stack.delete(plugin.id);
    visited.add(plugin.id);
    sorted.push(plugin);
  }

  for (const plugin of plugins) visit(plugin);
  return sorted;
}
