"use server";

import { createId } from "@paralleldrive/cuid2";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema/auth";
import { orgPlugins } from "@/lib/db/schema/orgs";
import {
    PLUGINS,
    type Plugin,
    canDisablePlugin,
    getMissingDependencies,
    getEnableOrder,
} from "@/lib/plugins/registry";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { initHooks, hooksRegistry } from "@/lib/hooks";
import { requireOrgPermission } from "@/lib/authz/guards";

// Register all plugin hook handlers once at module load.
initHooks();

export type InstalledPlugin = {
    rowId: string;       // org_plugins.id
    pluginId: string;    // registry Plugin.id
    name: string;
    description: string;
    slug: string;
    enabled: boolean;
    category: Plugin["category"];
    version: string;
    createdAt: Date;     // first install date
};

/**
 * Returns all org_plugins rows for the given org, enriched with registry metadata.
 * Rows whose pluginId is no longer in the registry are silently filtered out.
 * Admin-only — callers must enforce ownership before calling.
 */
export async function getOrgPlugins(
    orgId: string
): Promise<{ success: true; plugins: InstalledPlugin[] } | { success: false; error: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Not authenticated" };

    try {
        await requireOrgPermission(orgId, "plugins.manage");
    } catch (err: any) {
        return { success: false, error: err.message || "Unauthorized" };
    }

    const rows = await db.query.orgPlugins.findMany({
        where: eq(orgPlugins.orgId, orgId),
    });

    const plugins: InstalledPlugin[] = rows
        .map((row) => {
            const registryPlugin = PLUGINS.find((p) => p.id === row.pluginId);
            if (!registryPlugin) return null;
            return {
                rowId: row.id,
                pluginId: row.pluginId,
                name: registryPlugin.name,
                description: registryPlugin.description,
                slug: registryPlugin.slug,
                enabled: row.enabled,
                category: registryPlugin.category,
                version: registryPlugin.version,
                createdAt: row.createdAt,
            } satisfies InstalledPlugin;
        })
        .filter((p): p is InstalledPlugin => p !== null);

    return { success: true, plugins };
}

/**
 * Toggles the enabled state of a plugin for an org.
 * Owner-only. Plugin must already have an org_plugins row (i.e., be installed).
 *
 * **Enabling:** if the plugin has hard dependencies that are currently disabled,
 * they are auto-enabled in topological order (the UI must have confirmed this
 * with the user before calling). Returns `cascaded` listing what was also enabled.
 *
 * **Disabling:** blocked if any currently-enabled plugin transitively depends
 * on this one. Returns `{ success: false, error, blockedBy }` in that case.
 */
export async function togglePlugin(
    orgId: string,
    pluginId: string,
    enabled: boolean
): Promise<
    | { success: true; cascaded?: string[] }
    | { success: false; error: string; blockedBy?: string[] }
> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Not authenticated" };

    try {
        await requireOrgPermission(orgId, "plugins.manage");
    } catch (err: any) {
        return { success: false, error: err.message || "Unauthorized" };
    }

    // Verify plugin exists in registry
    const registryPlugin = PLUGINS.find((p) => p.id === pluginId);
    if (!registryPlugin) {
        return { success: false, error: "Plugin not found in registry" };
    }

    const existing = await db.query.orgPlugins.findFirst({
        where: and(eq(orgPlugins.orgId, orgId), eq(orgPlugins.pluginId, pluginId)),
    });
    if (!existing) {
        return { success: false, error: "Plugin is not installed for this organization" };
    }

    // Fetch the current enabled state for all org plugins (needed for dep checks)
    const allOrgPlugins = await db.query.orgPlugins.findMany({
        where: eq(orgPlugins.orgId, orgId),
    });
    const enabledPluginIds = allOrgPlugins
        .filter((p) => p.enabled)
        .map((p) => p.pluginId);

    // ------------------------------------------------------------------
    // Disable path — block if any enabled plugin transitively depends on this one
    // ------------------------------------------------------------------
    if (!enabled) {
        const check = canDisablePlugin(pluginId, enabledPluginIds);
        if (!check.allowed) {
            return {
                success: false,
                error: `Cannot disable ${registryPlugin.name} — other enabled plugins depend on it.`,
                blockedBy: check.blockedBy.map((p) => p.name),
            };
        }

        await db
            .update(orgPlugins)
            .set({ enabled: false })
            .where(and(eq(orgPlugins.orgId, orgId), eq(orgPlugins.pluginId, pluginId)));

        await revalidatePluginPaths(orgId);
        await hooksRegistry.emit("plugin:disabled", { orgId, pluginId });
        return { success: true };
    }

    // ------------------------------------------------------------------
    // Enable path — auto-enable missing hard dependencies in topo order
    // ------------------------------------------------------------------
    const missing = getMissingDependencies(pluginId, enabledPluginIds);

    // Collect all plugin IDs to enable (deps first, then the target itself)
    const toEnableInOrder = getEnableOrder([
        ...missing.map((p) => p.id),
        pluginId,
    ]);

    const toEnableIds = toEnableInOrder.map((p) => p.id);

    await db
        .update(orgPlugins)
        .set({ enabled: true })
        .where(
            and(
                eq(orgPlugins.orgId, orgId),
                inArray(orgPlugins.pluginId, toEnableIds)
            )
        );

    await revalidatePluginPaths(orgId);

    const cascadedNames = missing.map((p) => p.name);
    const cascadedIds = missing.map((p) => p.id);
    await hooksRegistry.emit("plugin:enabled", {
        orgId,
        pluginId,
        cascaded: cascadedIds,
    });
    return { success: true, ...(cascadedNames.length > 0 ? { cascaded: cascadedNames } : {}) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function revalidatePluginPaths(orgId: string) {
    const org = await db.query.organization.findFirst({
        where: eq(organization.id, orgId),
    });
    if (org) {
        revalidatePath(`/app/${org.slug}`, "layout");
        revalidatePath(`/app/${org.slug}/settings`);
    }
}

/**
 * Installs a plugin for an org (and its missing dependencies).
 * Owner-only. Plugin must not already be installed.
 */
export async function installPlugin(
    orgId: string,
    pluginId: string
): Promise<{ success: true; cascaded?: string[] } | { success: false; error: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Not authenticated" };

    try {
        await requireOrgPermission(orgId, "plugins.manage");
    } catch (err: any) {
        return { success: false, error: err.message || "Unauthorized" };
    }

    // Verify plugin exists in registry
    const registryPlugin = PLUGINS.find((p) => p.id === pluginId);
    if (!registryPlugin) {
        return { success: false, error: "Plugin not found in registry" };
    }

    // Check if already installed
    const existing = await db.query.orgPlugins.findFirst({
        where: and(eq(orgPlugins.orgId, orgId), eq(orgPlugins.pluginId, pluginId)),
    });
    if (existing) {
        return { success: false, error: "Plugin is already installed for this organization" };
    }

    // Fetch the current enabled state for all org plugins (needed for dep checks)
    const allOrgPlugins = await db.query.orgPlugins.findMany({
        where: eq(orgPlugins.orgId, orgId),
    });

    const installedPluginIds = new Set(allOrgPlugins.map(p => p.pluginId));
    const enabledPluginIds = allOrgPlugins.filter(p => p.enabled).map(p => p.pluginId);

    // Dependencies to install and enable
    const missingDeps = getMissingDependencies(pluginId, enabledPluginIds);

    const toInstallRegistryPlugins = [
        ...missingDeps.filter(p => !installedPluginIds.has(p.id)),
        registryPlugin
    ];

    const toEnableInOrder = getEnableOrder([
        ...missingDeps.map(p => p.id),
        pluginId
    ]);

    // Gather records to insert
    const insertValues = toInstallRegistryPlugins.map(p => ({
        id: createId(),
        orgId,
        pluginId: p.id,
        enabled: true, // User requested defaults to enabled: true upon installation
        settings: {}
    }));

    // 1. Insert new plugins
    if (insertValues.length > 0) {
        await db.insert(orgPlugins).values(insertValues);
    }

    // 2. Enable plugins that were just installed or were already installed but disabled
    const toForceEnableIds = toEnableInOrder.map(p => p.id);

    await db
        .update(orgPlugins)
        .set({ enabled: true })
        .where(
            and(
                eq(orgPlugins.orgId, orgId),
                inArray(orgPlugins.pluginId, toForceEnableIds)
            )
        );

    await revalidatePluginPaths(orgId);

    // 3. Emit hook events
    for (const p of toInstallRegistryPlugins) {
        await hooksRegistry.emit("plugin:installed", { orgId, pluginId: p.id });
    }

    const cascadedNames = missingDeps.map(p => p.name);
    if (cascadedNames.length > 0) {
        await hooksRegistry.emit("plugin:enabled", {
            orgId,
            pluginId,
            cascaded: missingDeps.map(p => p.id)
        });
    } else {
        await hooksRegistry.emit("plugin:enabled", {
            orgId,
            pluginId,
            cascaded: [],
        });
    }

    return {
        success: true,
        ...(cascadedNames.length > 0 ? { cascaded: cascadedNames } : {})
    };
}

