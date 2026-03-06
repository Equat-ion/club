"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema/auth";
import { orgPlugins } from "@/lib/db/schema/orgs";
import { PLUGINS, type Plugin } from "@/lib/plugins/registry";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Plugin installation metadata joined with plugin registry fields for UI rendering.
 */
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

    const membership = await db.query.member.findFirst({
        where: and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)),
    });
    if (!membership || membership.role !== "owner") {
        return { success: false, error: "Only the Admin can manage plugins" };
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
 */
export async function togglePlugin(
    orgId: string,
    pluginId: string,
    enabled: boolean
): Promise<{ success: boolean; error?: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Not authenticated" };

    const membership = await db.query.member.findFirst({
        where: and(eq(member.organizationId, orgId), eq(member.userId, session.user.id)),
    });
    if (!membership || membership.role !== "owner") {
        return { success: false, error: "Only the Admin can manage plugins" };
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

    await db
        .update(orgPlugins)
        .set({ enabled })
        .where(and(eq(orgPlugins.orgId, orgId), eq(orgPlugins.pluginId, pluginId)));

    // Revalidate sidebar (layout) and settings page
    const org = await db.query.organization.findFirst({
        where: eq(organization.id, orgId),
    });
    if (org) {
        revalidatePath(`/app/${org.slug}`, "layout");
        revalidatePath(`/app/${org.slug}/settings`);
    }

    return { success: true };
}
