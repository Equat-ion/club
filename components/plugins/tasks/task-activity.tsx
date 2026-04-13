"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TaskActivityEntry } from "@/lib/plugins/tasks-types";

interface TaskActivityProps {
  activity: TaskActivityEntry[];
  teamsEnabled?: boolean;
}

export function TaskActivity({ activity, teamsEnabled = false }: TaskActivityProps) {
  const filteredActivity = teamsEnabled
    ? activity
    : activity.filter((item) => item.type !== "team_assignment");
  const renderActivityDescription = (item: TaskActivityEntry) => {
    const actorName = item.actor.name;

    switch (item.type) {
      case "created":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> created this task
          </span>
        );
      case "status_change":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> changed status from{" "}
            <span className="font-mono text-xs bg-muted px-1 rounded">{item.fromValue}</span> to{" "}
            <span className="font-mono text-xs bg-muted px-1 rounded">{item.toValue}</span>
          </span>
        );
      case "priority_change":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> changed priority from{" "}
            <span className="font-mono text-xs bg-muted px-1 rounded">{item.fromValue}</span> to{" "}
            <span className="font-mono text-xs bg-muted px-1 rounded">{item.toValue}</span>
          </span>
        );
      case "assignment":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> assigned this to{" "}
            <span className="font-medium text-foreground">{item.toValue || "Unassigned"}</span>
          </span>
        );
      case "team_assignment":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> assigned this to team{" "}
            <span className="font-medium text-foreground">{item.toValue || "None"}</span>
          </span>
        );
      case "comment":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> commented
          </span>
        );
      case "label_added":
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> added label{" "}
            <span className="font-medium text-foreground">{item.toValue}</span>
          </span>
        );
      default:
        return (
          <span>
            <span className="font-medium text-foreground">{actorName}</span> performed action: {item.type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {filteredActivity.map((item) => (
        <div key={item.id} className="flex gap-4">
          <Avatar className="h-6 w-6">
            <AvatarImage src={item.actor.image || undefined} />
            <AvatarFallback className="text-[10px]">
              {item.actor.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-0.5">
            <div className="text-sm text-muted-foreground">
              {renderActivityDescription(item)}
            </div>
            <div className="text-[10px] text-muted-foreground/60">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}

      {filteredActivity.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No activity recorded yet.
        </div>
      )}
    </div>
  );
}
