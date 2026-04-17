"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StatusSelect } from "./status-select";
import { PrioritySelect } from "./priority-select";
import { AssigneeSelect } from "./assignee-select";
import { TeamPicker } from "./team-picker";
import { LabelPicker } from "./label-picker";
import type { TaskWithDetails, OrgMember, Label, OrgTeam, TaskStatus, TaskPriority } from "@/lib/plugins/tasks-types";
import { MAX_TASK_LABELS } from "@/lib/plugins/tasks-constants";

interface TaskMetadataRowProps {
  task: TaskWithDetails;
  members: OrgMember[];
  labels: Label[];
  teams: OrgTeam[];
  teamsEnabled: boolean;
  onUpdate: (data: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    teamId?: string | null;
    dueDate?: string | null;
    labelIds?: string[];
  }) => Promise<void>;
  orgId: string;
}

export function TaskMetadataRow({
  task,
  members,
  labels,
  teams,
  teamsEnabled,
  onUpdate,
  orgId,
}: TaskMetadataRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <StatusSelect
        value={task.status}
        onChange={(status) => onUpdate({ status })}
        variant="badge"
      />
      <PrioritySelect
        value={task.priority}
        onChange={(priority) => onUpdate({ priority })}
        variant="badge"
      />

      <div className="h-4 w-px bg-muted mx-1" />

      <AssigneeSelect
        members={members}
        value={task.assigneeId}
        onChange={(assigneeId) => onUpdate({ assigneeId })}
        variant="ghost"
      />

      {teamsEnabled && (
        <TeamPicker
          teams={teams}
          selectedTeamId={task.teamId}
          onSelect={(teamId) => onUpdate({ teamId })}
          variant="ghost"
        />
      )}

      <div className="h-4 w-px bg-muted mx-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 font-normal gap-1.5 text-muted-foreground hover:text-foreground">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={task.dueDate ? new Date(task.dueDate) : undefined}
            onSelect={(date) => onUpdate({ dueDate: date?.toISOString() || null })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {task.labels.map((label) => (
        <Badge
          key={label.id}
          variant="outline"
          className="h-7 max-w-[160px] gap-1.5 border-muted/50 px-2 text-xs font-normal text-muted-foreground"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: label.color }}
          />
          <span className="truncate">{label.name}</span>
        </Badge>
      ))}

      <LabelPicker
        orgId={orgId}
        availableLabels={labels}
        selectedLabelIds={task.labels.map(l => l.id)}
        maxSelectedLabels={MAX_TASK_LABELS}
        onSelect={(labelId) =>
          onUpdate({
            labelIds: [...new Set([...task.labels.map((l) => l.id), labelId])].slice(
              0,
              MAX_TASK_LABELS
            ),
          })
        }
        onRemove={(labelId) => onUpdate({ labelIds: task.labels.map(l => l.id).filter(id => id !== labelId) })}
      />
    </div>
  );
}
