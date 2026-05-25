"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, User } from "lucide-react";

type RoleItem = {
  id: string;
  key: string;
  name: string;
};

type Props = {
  assignedRoles?: RoleItem[];
  legacyRole: string;
};

export function MemberPermissionBadges({ assignedRoles, legacyRole }: Props) {
  const hasAssignedRoles = assignedRoles && assignedRoles.length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5 items-center">
        {hasAssignedRoles ? (
          assignedRoles.map((role) => (
            <Tooltip key={role.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 transition-all font-medium py-0.5 px-2 text-[11px] cursor-help"
                >
                  {role.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Role key: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{role.key}</code>
              </TooltipContent>
            </Tooltip>
          ))
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20 py-0.5 px-2 text-[11px] font-normal cursor-help">
                {legacyRole === "owner" ? "Admin" : legacyRole === "admin" ? "Lead" : "Member"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              System default role assignment (legacy fallback)
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
