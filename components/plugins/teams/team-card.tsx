"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  slug: string;
  team: {
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
  };
}

export function TeamCard({ slug, team }: TeamCardProps) {
  const leaders = team.members.filter((m) => m.role === "leader");
  const otherMembers = team.members.filter((m) => m.role !== "leader");
  const displayMembers = [...leaders, ...otherMembers].slice(0, 3);
  const remainingCount = team.memberCount - displayMembers.length;

  return (
    <Link 
      href={`/app/${slug}/teams/${team.id}`} 
      className="group block rounded-md border bg-card transition-colors hover:bg-muted/50 overflow-hidden"
    >
      <div className="flex h-full">
        {/* Left accent bar */}
        <div 
          className="w-1.5 shrink-0" 
          style={{ backgroundColor: team.color || "var(--border)" }} 
        />
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold leading-none">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {team.description}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-normal shrink-0">
              <Users className="mr-1 h-3 w-3" />
              {team.memberCount}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {displayMembers.map((member) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-background ring-offset-background">
                  <AvatarImage src={member.image || undefined} alt={member.name} />
                  <AvatarFallback className="text-[9px]">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {remainingCount > 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium">
                  +{remainingCount}
                </div>
              )}
            </div>
            
            <div className="text-[11px] text-muted-foreground">
              {leaders.length > 0 ? (
                <span className="truncate max-w-[120px] block">
                  Lead by <span className="font-medium text-foreground">{leaders[0].name.split(' ')[0]}</span>
                </span>
              ) : (
                <span className="italic">No leader</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
