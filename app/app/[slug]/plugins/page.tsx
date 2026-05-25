import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { getOrgPlugins } from "@/actions/plugins";
import { PluginMarketplace } from "@/components/settings/plugin-marketplace";
import { getSessionOrgAccess } from "@/lib/auth/session";

export async function generateMetadata() {
    return {
        title: "Plugin Marketplace",
    };
}

export default async function PluginsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Load org
    const org = await db.query.organization.findFirst({
        where: eq(organization.slug, slug),
    });

    if (!org) {
        redirect("/app");
    }

    // Load org profile for plan
    const orgProfile = await db.query.orgProfiles.findFirst({
        where: eq(orgProfiles.id, org.id),
    });

    // Verify membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, org.id),
            eq(member.userId, session.user.id),
        ),
    });

    if (!membership) {
        redirect("/app");
    }

    const access = await getSessionOrgAccess(org.id);
    if (!access.effectivePermissions.includes("plugins.manage")) {
        redirect(`/app/${slug}`);
    }

    // Fetch installed plugins
    const pluginsResult = await getOrgPlugins(org.id);
    const installedPlugins = pluginsResult.success ? pluginsResult.plugins : [];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Plugin Marketplace</h1>
                <p className="text-muted-foreground">
                    Browse and install tools to power your organization.
                </p>
            </div>

            <PluginMarketplace
                initialPlugins={installedPlugins}
                orgId={org.id}
                orgSlug={slug}
                plan={orgProfile?.plan ?? "free"}
            />
        </div>
    );
}
