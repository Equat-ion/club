"use client";

import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, UserMinus, ShieldAlert, Shield, Mail } from "lucide-react";
import { removeTeamMember, setTeamMemberRole } from "@/actions/teams";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TeamMemberRowProps {
  orgId: string;
  teamId: string;
  member: {
    id: string;
    userId: string;
    role: string;
    name: string;
    email: string;
    image: string | null;
  };
  canManage: boolean;
}

export function TeamMemberRow({ orgId, teamId, member, canManage }: TeamMemberRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmToggleRoleOpen, setConfirmToggleRoleOpen] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    const result = await removeTeamMember(orgId, teamId, member.id);
    setLoading(false);

    if (result.success) {
      toast.success("Member removed from team");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove member");
    }
  };

  const handleToggleRole = async () => {
    const newRole = member.role === "leader" ? "member" : "leader";
    
    setLoading(true);
    const result = await setTeamMemberRole(orgId, teamId, member.id, newRole);
    setLoading(false);

    if (result.success) {
      toast.success(`Member ${newRole === "leader" ? "promoted to leader" : "demoted to member"}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update member role");
    }
  };

  const newRole = member.role === "leader" ? "member" : "leader";
  const roleAction = newRole === "leader" ? "promote" : "demote";

  return (
    <div className="flex items-center justify-between py-3 px-4 transition-colors hover:bg-muted/40 group">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={member.image || undefined} alt={member.name} />
          <AvatarFallback className="text-xs">{member.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{member.name}</span>
            {member.role === "leader" && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                Leader
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
            <Mail className="h-3 w-3" />
            {member.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canManage && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" disabled={loading}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setConfirmToggleRoleOpen(true)}>
                  {member.role === "leader" ? (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Demote to Member
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Promote to Leader
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirmRemoveOpen(true)} className="text-destructive">
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove from Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Remove Confirmation */}
            <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove <strong>{member.name}</strong> from the team. This action can be undone by adding them back later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Remove Member
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Role Toggle Confirmation */}
            <AlertDialog open={confirmToggleRoleOpen} onOpenChange={setConfirmToggleRoleOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Member Role?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to <strong>{roleAction}</strong> {member.name}?
                    {roleAction === "promote" && " This will make them a team leader."}
                    {roleAction === "demote" && " This will remove their leader permissions for this team."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleToggleRole}>
                    Confirm {roleAction.charAt(0).toUpperCase() + roleAction.slice(1)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
