import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { invitation, organization } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { AcceptInvitationClient } from "./accept-invitation-client";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  // Load invitation details for display
  const invite = await db.query.invitation.findFirst({
    where: eq(invitation.id, invitationId),
  });

  if (!invite) {
    notFound();
  }

  // Load org name for display
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, invite.organizationId),
  });

  if (!org) {
    notFound();
  }

  // Check if user is signed in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isExpired = invite.expiresAt < new Date();
  const isAlreadyAccepted = invite.status !== "pending";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AcceptInvitationClient
        invitationId={invitationId}
        orgName={org.name}
        orgSlug={org.slug}
        email={invite.email}
        isSignedIn={!!session}
        isExpired={isExpired}
        isAlreadyAccepted={isAlreadyAccepted}
        status={invite.status}
      />
    </div>
  );
}
