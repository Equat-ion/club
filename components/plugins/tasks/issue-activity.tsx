"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusLabel, getStatusIcon } from "./status-select";
import { getPriorityLabel, getPriorityIcon } from "./priority-select";
import type { IssueActivityEntry } from "@/lib/plugins/tasks-types";

function formatActivityDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActivityDescription({ entry }: { entry: IssueActivityEntry }) {
  switch (entry.type) {
    case "created":
      return <span>created this issue</span>;
    case "status_change":
      return (
        <span className="flex flex-wrap items-center gap-1">
          changed status from
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getStatusIcon(entry.fromValue ?? "")}
            {getStatusLabel(entry.fromValue ?? "")}
          </span>
          to
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getStatusIcon(entry.toValue ?? "")}
            {getStatusLabel(entry.toValue ?? "")}
          </span>
        </span>
      );
    case "priority_change":
      return (
        <span className="flex flex-wrap items-center gap-1">
          changed priority from
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getPriorityIcon(entry.fromValue ?? "")}
            {getPriorityLabel(entry.fromValue ?? "")}
          </span>
          to
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getPriorityIcon(entry.toValue ?? "")}
            {getPriorityLabel(entry.toValue ?? "")}
          </span>
        </span>
      );
    case "assignment":
      if (!entry.toValue) {
        return <span>removed the assignee</span>;
      }
      if (!entry.fromValue) {
        return <span>assigned this issue</span>;
      }
      return <span>changed the assignee</span>;
    case "comment":
      return <span>added a comment</span>;
    default:
      return <span>{entry.type}</span>;
  }
}

export function IssueActivityLog({
  activity,
}: {
  activity: IssueActivityEntry[];
}) {
  if (activity.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 text-sm">
          <Avatar className="h-6 w-6 mt-0.5">
            <AvatarImage src={entry.actor.image ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {entry.actor.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-medium">{entry.actor.name}</span>
              <ActivityDescription entry={entry} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatActivityDate(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
