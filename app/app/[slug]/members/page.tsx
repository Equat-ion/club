import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  getMembers,
  getPendingInvitations,
  getOrgMemberInfo,
} from "@/actions/members";
import { MembersContent } from "@/components/members/members-content";

export default async function MembersPage({
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

  // Fetch data in parallel
  const [members, pendingInvitations, memberInfo] = await Promise.all([
    getMembers(org.id),
    getPendingInvitations(org.id),
    getOrgMemberInfo(org.id),
  ]);

  return (
    <div className="p-6 space-y-6">
      <MembersContent
        orgId={org.id}
        orgSlug={slug}
        currentUserRole={membership.role}
        currentUserId={session.user.id}
        members={members}
        pendingInvitations={pendingInvitations}
        memberInfo={memberInfo}
      />
    </div>
  );
}
