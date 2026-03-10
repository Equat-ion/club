import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { getTasks, getOrgMembers, getOrgLabels, getOrgTeams } from "@/actions/tasks";
import { TasksPage } from "@/components/plugins/tasks/tasks-page";
import { orgPlugins } from "@/lib/db/schema/orgs";

export default async function TasksMainPage({
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
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Check if teams plugin is enabled
  const installedPlugins = await db.query.orgPlugins.findMany({
    where: eq(orgPlugins.orgId, org.id),
  });
  const teamsEnabled = installedPlugins.some(p => p.pluginId === "teams" && p.enabled);

  // Fetch all data in parallel
  const [tasks, members, labels, teams] = await Promise.all([
    getTasks(org.id),
    getOrgMembers(org.id),
    getOrgLabels(org.id),
    getOrgTeams(org.id),
  ]);

  return (
    <TasksPage
      orgId={org.id}
      orgSlug={slug}
      currentMemberId={membership.id}
      tasks={tasks}
      members={members}
      labels={labels}
      teams={teams}
      teamsEnabled={teamsEnabled}
    />
  );
}
