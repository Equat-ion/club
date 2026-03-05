"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersTable } from "./members-table";
import { PendingInvitations } from "./pending-invitations";
import { InviteMemberDialog } from "./invite-member-dialog";
import type { MemberWithUser, PendingInvitation } from "@/actions/members";

type Props = {
  orgId: string;
  orgSlug: string;
  currentUserRole: string;
  currentUserId: string;
  members: MemberWithUser[];
  pendingInvitations: PendingInvitation[];
  memberInfo: {
    memberCount: number;
  };
};

export function MembersContent({
  orgId,
  orgSlug,
  currentUserRole,
  currentUserId,
  members,
  pendingInvitations,
  memberInfo,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {memberInfo.memberCount} {memberInfo.memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 size-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersTable
            orgId={orgId}
            members={members}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <PendingInvitations
            invitations={pendingInvitations}
            currentUserRole={currentUserRole}
          />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgId={orgId}
        currentUserRole={currentUserRole}
        isAtLimit={false}
      />
    </>
  );
}
