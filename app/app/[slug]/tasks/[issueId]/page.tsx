import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  getTask,
  getTaskComments,
  getTaskActivity,
  getOrgMembers,
  getOrgLabels,
  getOrgTeams,
} from "@/actions/tasks";
import { TaskDetail } from "@/components/plugins/tasks/task-detail";
import { orgPlugins } from "@/lib/db/schema/orgs";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; issueId: string }>;
}) {
  const { slug, issueId } = await params;

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

  // Fetch task and related data in parallel
  const [task, comments, activity, members, labels, teams] = await Promise.all([
    getTask(issueId),
    getTaskComments(issueId),
    getTaskActivity(issueId),
    getOrgMembers(org.id),
    getOrgLabels(org.id),
    getOrgTeams(org.id),
  ]);

  if (!task || task.orgId !== org.id) {
    notFound();
  }

  return (
    <TaskDetail
      task={task}
      comments={comments}
      activity={activity}
      members={members}
      labels={labels}
      teams={teams}
      teamsEnabled={teamsEnabled}
      orgSlug={slug}
      currentUserId={session.user.id}
      currentUserRole={membership.role}
    />
  );
}
