"use client";

import { useState } from "react";
import { TeamCard } from "./team-card";
import { CreateTeamDialog } from "./create-team-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  memberCount: number;
  members: {
    id: string;
    role: string;
    name: string;
    image: string | null;
  }[];
}

interface TeamsListProps {
  slug: string;
  orgId: string;
  teams: Team[];
  isOwner: boolean;
}

export function TeamsList({ slug, orgId, teams, isOwner }: TeamsListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground text-sm">
            {teams.length} {teams.length === 1 ? 'team' : 'teams'} within the organization
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Team
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 border">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">No teams found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {isOwner
              ? "Teams help you group members and track project involvement. Create your first team to get started."
              : "There are no teams in this organization yet."}
          </p>
          {isOwner && (
            <Button className="mt-8" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} slug={slug} team={team} />
          ))}
        </div>
      )}

      <CreateTeamDialog
        orgId={orgId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
