/**
 * Frontend-only icon resolver for plugin icons.
 *
 * The plugin registry stores icon names as plain strings to keep the library
 * layer free of React/icon dependencies. This module maps those strings to
 * actual Lucide React components and should only be imported in client-side
 * or server-component code — never in shared lib/server utilities.
 */

import {
    CheckSquare,
    Users,
    MessageSquare,
    Globe,
    FileText,
    NotebookPen,
    type LucideIcon,
    type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

/** Map of every icon string used in the plugin registry to its React component. */
const ICON_MAP: Record<string, LucideIcon> = {
    CheckSquare,
    Users,
    MessageSquare,
    Globe,
    FileText,
    NotebookPen,
};

/**
 * Returns the Lucide React component for a given plugin icon string.
 * Falls back to `CheckSquare` if the icon name is unrecognised.
 */
export function resolvePluginIcon(
    iconName: string
): ComponentType<LucideProps> {
    return ICON_MAP[iconName] ?? CheckSquare;
}
