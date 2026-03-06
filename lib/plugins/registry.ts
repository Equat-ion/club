import {
  CheckSquare,
  type LucideIcon,
} from "lucide-react";

export type Plugin = {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: LucideIcon;
  plans: ("free" | "plus" | "enterprise")[];
  defaultEnabled: boolean;
  category: "productivity" | "communication" | "management" | "other";
  version: string;
};

export const PLUGINS: Plugin[] = [
  {
    id: "tasks",
    name: "Task Management",
    description: "Linear-inspired issue tracker for your org",
    slug: "tasks",
    icon: CheckSquare,
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: true,
    category: "productivity",
    version: "1.0.0",
  },
  // future: chat, storage, notes, whiteboards, recruitment, finances
];

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
