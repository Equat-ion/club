import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { getIssues, getOrgMembers } from "@/actions/tasks";
import { IssuesBoard } from "@/components/plugins/tasks/issues-board";
import { CreateIssueDialog } from "@/components/plugins/tasks/create-issue-dialog";

export default async function TasksPage({
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

  // Fetch issues and members in parallel
  const [issues, members] = await Promise.all([
    getIssues(org.id),
    getOrgMembers(org.id),
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </p>
        </div>
        <CreateIssueDialog
          orgId={org.id}
          orgSlug={slug}
          members={members}
        />
      </div>
      <IssuesBoard issues={issues} orgSlug={slug} />
    </div>
  );
}
