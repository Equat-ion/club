import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  getIssue,
  getIssueComments,
  getIssueActivity,
  getOrgMembers,
} from "@/actions/tasks";
import { IssueDetail } from "@/components/plugins/tasks/issue-detail";

export default async function IssueDetailPage({
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

  // Fetch issue and related data in parallel
  const [issue, comments, activity, members] = await Promise.all([
    getIssue(issueId),
    getIssueComments(issueId),
    getIssueActivity(issueId),
    getOrgMembers(org.id),
  ]);

  if (!issue || issue.orgId !== org.id) {
    notFound();
  }

  return (
    <IssueDetail
      issue={issue}
      comments={comments}
      activity={activity}
      members={members}
      orgSlug={slug}
      currentUserId={session.user.id}
      currentUserRole={membership.role}
    />
  );
}
