import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { SettingsContent } from "@/components/settings/settings-content";
import { getOrgPlugins } from "@/actions/plugins";

export default async function SettingsPage({
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

  // Only owners can access settings
  if (membership.role !== "owner") {
    redirect(`/app/${slug}`);
  }

  // Fetch installed plugins (owner already verified above)
  const pluginsResult = await getOrgPlugins(org.id);
  const installedPlugins = pluginsResult.success ? pluginsResult.plugins : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings.
        </p>
      </div>
      <SettingsContent
        orgId={org.id}
        orgSlug={slug}
        orgName={org.name}
        orgLogo={org.logo ?? null}
        installedPlugins={installedPlugins}
      />
    </div>
  );
}
