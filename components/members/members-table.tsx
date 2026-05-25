"use client";

import { useState } from "react";
import { MoreHorizontal, Shield, ShieldAlert, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import { ChangeRoleDialog } from "./change-role-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import type { MemberWithUser } from "@/actions/members";
import { MemberPermissionBadges } from "./member-permission-badges";
import { useOrg } from "@/hooks/use-org";

type Props = {
  orgId: string;
  members: MemberWithUser[];
  currentUserRole: string;
  currentUserId: string;
  enterpriseModeEnabled: boolean;
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  owner: ShieldAlert,
  admin: Shield,
  member: User,
};

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getEnterpriseStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] py-0.5 px-2 font-medium">
          Active (SSO)
        </Badge>
      );
    case "pending_review":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] py-0.5 px-2 font-medium animate-pulse">
          Pending Review
        </Badge>
      );
    case "suspended":
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/20 text-[10px] py-0.5 px-2 font-medium">
          Suspended
        </Badge>
      );
    case "deprovisioned":
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20 text-[10px] py-0.5 px-2 font-medium">
          Deprovisioned
        </Badge>
      );
    default:
      return null;
  }
}

export function MembersTable({
  orgId,
  members,
  currentUserRole,
  currentUserId,
  enterpriseModeEnabled,
}: Props) {
  const [changeRoleMember, setChangeRoleMember] =
    useState<MemberWithUser | null>(null);
  const [removeMember, setRemoveMember] = useState<MemberWithUser | null>(null);
  
  const org = useOrg();

  // Allow manage if user has permission members.manage_roles or is owner (fallback)
  const canManage = org.permissions?.includes("members.manage_roles") || currentUserRole === "owner";

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              {enterpriseModeEnabled && <TableHead>Status</TableHead>}
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? (enterpriseModeEnabled ? 5 : 4) : (enterpriseModeEnabled ? 4 : 3)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const isOwner = m.role === "owner";
                
                // Disable manual role editing for SCIM active provisioned members
                const roleEditingDisabled = m.provisionSource === "scim" && m.enterpriseStatus === "active";

                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {m.user.image && (
                            <AvatarImage
                              src={m.user.image}
                              alt={m.user.name}
                            />
                          )}
                          <AvatarFallback>
                            {m.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none flex items-center">
                            {m.user.name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MemberPermissionBadges
                        assignedRoles={m.assignedRoles}
                        legacyRole={m.role}
                      />
                    </TableCell>
                    {enterpriseModeEnabled && (
                      <TableCell>
                        {getEnterpriseStatusBadge(m.enterpriseStatus || "active")}
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {!isSelf && !isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={roleEditingDisabled}
                                onClick={() => setChangeRoleMember(m)}
                              >
                                {roleEditingDisabled ? "Managed via SCIM" : "Change role"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setRemoveMember(m)}
                              >
                                Remove member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ChangeRoleDialog
        orgId={orgId}
        member={changeRoleMember}
        onClose={() => setChangeRoleMember(null)}
        enterpriseModeEnabled={enterpriseModeEnabled}
      />

      <RemoveMemberDialog
        orgId={orgId}
        member={removeMember}
        onClose={() => setRemoveMember(null)}
      />
    </>
  );
}
