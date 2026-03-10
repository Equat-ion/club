import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgPlugins } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { getTeam } from "@/actions/teams";
import { TeamDetail } from "@/components/plugins/teams/team-detail";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string; teamId: string }>;
}) {
  const { slug, teamId } = await params;

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

  const team = await getTeam(org.id, teamId);

  if (!team) {
    notFound();
  }

  const isOwner = membership.role === "owner";
  const isLeader = team.members.some(m => m.id === membership.id && m.role === "leader");

  return (
    <div className="p-6">
      <TeamDetail 
        slug={slug} 
        orgId={org.id} 
        team={team} 
        isOwner={isOwner} 
        isLeader={isLeader} 
      />
    </div>
  );
}
