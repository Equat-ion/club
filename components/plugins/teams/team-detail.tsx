"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { ArrowLeft, Plus, Settings, Trash2, Users, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { TeamMemberRow } from "./team-member-row";
import { AddMemberDialog } from "./add-member-dialog";
import { EditTeamDialog } from "./edit-team-dialog";
import { deleteTeam } from "@/actions/teams";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: Date;
}

interface TeamDetailProps {
  slug: string;
  orgId: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    members: TeamMember[];
    createdAt: Date;
  };
  isOwner: boolean;
  isLeader: boolean;
}

export function TeamDetail({ slug, orgId, team, isOwner, isLeader }: TeamDetailProps) {
  const router = useRouter();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteTeam(orgId, team.id);
    setLoading(false);

    if (result.success) {
      toast.success("Team deleted successfully");
      router.push(`/app/${slug}/teams`);
    } else {
      toast.error(result.error || "Failed to delete team");
    }
  };

  const canManage = isOwner || isLeader;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/app/${slug}/teams`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div 
              className="h-4 w-4 rounded-sm" 
              style={{ backgroundColor: team.color || "var(--border)" }} 
            />
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setEditTeamOpen(true)}>
                <Settings className="mr-2 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {isOwner && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteConfirmOpen(true)} 
                  disabled={loading} 
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the <strong>{team.name}</strong> team. 
                        Members will not be removed from the organization, but they will lose their team membership.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        {/* Main content - Members list */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Members ({team.members.length})
            </h3>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => setAddMemberOpen(true)} className="h-8 text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Member
              </Button>
            )}
          </div>
          
          <div className="rounded-md border bg-card">
            {team.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">This team has no members yet.</p>
                {canManage && (
                  <Button variant="link" size="sm" onClick={() => setAddMemberOpen(true)} className="mt-1">
                    Add the first member
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {team.members.map((member) => (
                  <TeamMemberRow
                    key={member.id}
                    orgId={orgId}
                    teamId={team.id}
                    member={member}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-6">
          <div className="rounded-md border p-5 space-y-6 bg-card/50">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Info className="h-3 w-3" />
                Description
              </label>
              <p className="text-sm leading-relaxed text-foreground/90">
                {team.description || "No description provided."}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
               <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Created
                </span>
                <span className="font-medium">
                  {new Date(team.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Visibility
                </span>
                <span className="font-medium">All Members</span>
              </div>
            </div>
          </div>
          
          {canManage && !isLeader && (
            <div className="p-4 rounded-md bg-muted/30 border border-dashed flex items-start gap-3">
               <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
               <p className="text-[11px] text-muted-foreground leading-normal">
                 As an organization owner, you can manage this team even though you are not a member.
               </p>
            </div>
          )}
        </div>
      </div>

      <AddMemberDialog
        orgId={orgId}
        teamId={team.id}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />

      <EditTeamDialog
        orgId={orgId}
        team={team}
        open={editTeamOpen}
        onOpenChange={setEditTeamOpen}
      />
    </div>
  );
}
