"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cancelInvitation } from "@/actions/members";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import type { PendingInvitation } from "@/actions/members";

type Props = {
  invitations: PendingInvitation[];
  currentUserRole: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function isExpired(date: Date) {
  return new Date(date) < new Date();
}

export function PendingInvitations({ invitations, currentUserRole }: Props) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canCancel =
    currentUserRole === "owner" || currentUserRole === "admin";

  async function handleCancel(invitationId: string) {
    setCancellingId(invitationId);

    const result = await cancelInvitation(invitationId);

    if (result.success) {
      toast.success("Invitation cancelled");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to cancel invitation");
    }

    setCancellingId(null);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited by</TableHead>
            <TableHead>Expires</TableHead>
            {canCancel && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canCancel ? 5 : 4}
                className="h-24 text-center text-muted-foreground"
              >
                No pending invitations.
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((inv) => {
              const expired = isExpired(inv.expiresAt);

              return (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {inv.role
                        ? ROLE_DISPLAY_NAMES[inv.role] ?? inv.role
                        : "Member"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.inviterName}
                  </TableCell>
                  <TableCell>
                    {expired ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Expired
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(inv.expiresAt)}
                      </span>
                    )}
                  </TableCell>
                  {canCancel && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleCancel(inv.id)}
                        disabled={cancellingId === inv.id}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Cancel invitation</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
