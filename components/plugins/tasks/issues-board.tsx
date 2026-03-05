"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusIcon, getStatusLabel } from "./status-select";
import { getPriorityIcon, getPriorityLabel } from "./priority-select";
import {
  ISSUE_STATUSES,
  type IssueWithAssignee,
} from "@/lib/plugins/tasks-types";

export function IssuesBoard({
  issues,
  orgSlug,
}: {
  issues: IssueWithAssignee[];
  orgSlug: string;
}) {
  // Group issues by status, in status order
  const groupedIssues = ISSUE_STATUSES.map((status) => ({
    status: status.value,
    label: status.label,
    issues: issues.filter((i) => i.status === status.value),
  }));

  // Sort issues within each group by priority (urgent first)
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    no_priority: 4,
  };

  for (const group of groupedIssues) {
    group.issues.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );
  }

  const hasAnyIssues = issues.length > 0;

  if (!hasAnyIssues) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No issues yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first issue to start tracking work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groupedIssues.map((group) => (
        <StatusGroup
          key={group.status}
          status={group.status}
          label={group.label}
          issues={group.issues}
          orgSlug={orgSlug}
        />
      ))}
    </div>
  );
}

function StatusGroup({
  status,
  label,
  issues,
  orgSlug,
}: {
  status: string;
  label: string;
  issues: IssueWithAssignee[];
  orgSlug: string;
}) {
  // Don't render empty groups for done/cancelled unless they have issues
  const hideIfEmpty =
    status === "done" || status === "cancelled" || status === "backlog";
  if (hideIfEmpty && issues.length === 0) return null;

  return (
    <Collapsible defaultOpen={issues.length > 0}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex items-center gap-2">
          {getStatusIcon(status)}
          {label}
        </span>
        <Badge variant="secondary" className="ml-1 text-xs">
          {issues.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {issues.length === 0 ? (
          <p className="px-10 py-3 text-sm text-muted-foreground">
            No issues
          </p>
        ) : (
          <div className="ml-2 border-l">
            {issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function IssueRow({
  issue,
  orgSlug,
}: {
  issue: IssueWithAssignee;
  orgSlug: string;
}) {
  return (
    <Link
      href={`/app/${orgSlug}/tasks/${issue.id}`}
      className="flex items-center gap-3 rounded-md px-4 py-2.5 ml-2 hover:bg-muted/50 transition-colors group"
    >
      {/* Priority icon */}
      <span className="flex-shrink-0" title={getPriorityLabel(issue.priority)}>
        {getPriorityIcon(issue.priority)}
      </span>

      {/* Identifier */}
      <span className="flex-shrink-0 text-xs font-mono text-muted-foreground w-20">
        {issue.identifier}
      </span>

      {/* Title */}
      <span className="flex-1 truncate text-sm">{issue.title}</span>

      {/* Due date */}
      {issue.dueDate && (
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {new Date(issue.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}

      {/* Assignee */}
      {issue.assignee && (
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarImage src={issue.assignee.image ?? undefined} />
          <AvatarFallback className="text-[10px]">
            {issue.assignee.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}
