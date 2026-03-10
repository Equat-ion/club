import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgPlugins } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { getOrgTeams } from "@/actions/teams";
import { TeamsList } from "@/components/plugins/teams/teams-list";

export default async function TeamsPage({
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
    notFound();
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Plugin gate
  const pluginState = await db.query.orgPlugins.findFirst({
    where: and(
        eq(orgPlugins.orgId, org.id),
        eq(orgPlugins.pluginId, "teams"),
        eq(orgPlugins.enabled, true)
    ),
  });

  if (!pluginState) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-6">
        <h2 className="text-xl font-semibold">Teams is not enabled</h2>
        <p className="mt-2 text-muted-foreground">
          Enable the Teams plugin in organization settings to use this feature.
        </p>
      </div>
    );
  }

  const teams = await getOrgTeams(org.id);
  const isOwner = membership.role === "owner";

  return (
    <div className="p-6">
      <TeamsList 
        slug={slug} 
        orgId={org.id} 
        teams={teams} 
        isOwner={isOwner} 
      />
    </div>
  );
}
