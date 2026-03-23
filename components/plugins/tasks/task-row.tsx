"use client";

import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  type LucideIcon,
  Minus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStatusIcon, getStatusLabel } from "./status-select";
import type { TaskPriority, TaskWithDetails } from "@/lib/plugins/tasks-types";

interface TaskRowProps {
  task: TaskWithDetails;
  orgSlug: string;
  showCheckbox?: boolean;
  checkboxChecked?: boolean;
  checkboxDisabled?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
}

const priorityIcons: Record<TaskPriority, { icon: LucideIcon; color: string }> = {
  urgent: { icon: CircleAlert, color: "text-red-500" },
  high: { icon: ChevronUp, color: "text-orange-500" },
  medium: { icon: ChevronRight, color: "text-yellow-500" },
  low: { icon: ChevronDown, color: "text-blue-500" },
  no_priority: { icon: Minus, color: "text-muted-foreground" },
};

export const TASK_ROW_TEMPLATE_WITH_CHECKBOX =
  "grid-cols-[2rem_2rem_6.75rem_minmax(0,1fr)_6rem_6rem_minmax(10rem,1.2fr)_5rem_7rem]";
export const TASK_ROW_TEMPLATE_NO_CHECKBOX =
  "grid-cols-[2rem_6.75rem_minmax(0,1fr)_6rem_6rem_minmax(10rem,1.2fr)_5rem_7rem]";

export function TaskRow({
  task,
  orgSlug,
  showCheckbox = false,
  checkboxChecked = false,
  checkboxDisabled = true,
  onCheckboxChange,
}: TaskRowProps) {
  const PriorityIcon = priorityIcons[task.priority as TaskPriority]?.icon || Minus;
  const priorityColor = priorityIcons[task.priority as TaskPriority]?.color || "text-muted-foreground";

  const isOverdue =
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate)) &&
    !["done", "cancelled"].includes(task.status);
  const isDueToday =
    task.dueDate &&
    isToday(new Date(task.dueDate)) &&
    !["done", "cancelled"].includes(task.status);

  return (
    <div
      className={cn(
        "grid h-11 items-center gap-x-4 border-b border-muted/30 px-4 transition-colors last:border-0 hover:bg-muted/50",
        checkboxChecked && "bg-muted/30 hover:bg-muted/40",
        showCheckbox ? TASK_ROW_TEMPLATE_WITH_CHECKBOX : TASK_ROW_TEMPLATE_NO_CHECKBOX
      )}
    >
      {showCheckbox ? (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={checkboxChecked}
            disabled={checkboxDisabled}
            aria-label={`Select task ${task.identifier}`}
            onCheckedChange={(checked) => onCheckboxChange?.(checked === true)}
          />
        </div>
      ) : (
        <div />
      )}

      <Link href={`/app/${orgSlug}/tasks/${task.id}`} className="contents">
        <div className={cn("flex items-center justify-center", priorityColor)}>
          <PriorityIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
          {task.identifier}
        </div>

        <div className="min-w-0 truncate text-sm">{task.title}</div>

        {task.assignee ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {task.assignee.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{task.assignee.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div />
        )}

        {task.team ? (
          <Badge
            variant="outline"
            className="h-5 flex-shrink-0 border-muted/50 px-1.5 text-[10px] font-normal text-muted-foreground"
          >
            {task.team.name}
          </Badge>
        ) : (
          <div />
        )}

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {task.labels.map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              className="h-5 max-w-full gap-1.5 border-muted/50 px-2 text-[10px] font-normal text-muted-foreground"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="min-w-0 truncate">{label.name}</span>
            </Badge>
          ))}
        </div>

        {task.dueDate ? (
          <div
            className={cn(
              "w-full text-right text-[10px] flex-shrink-0",
              isOverdue
                ? "font-medium text-destructive"
                : isDueToday
                  ? "font-medium text-amber-500"
                  : "text-muted-foreground"
            )}
          >
            {format(new Date(task.dueDate), "MMM d")}
          </div>
        ) : (
          <div />
        )}

        <div className="flex justify-end">
          <Badge
            variant="secondary"
            className="h-6 gap-1.5 rounded-full bg-muted/50 px-2.5 text-[10px] font-normal text-muted-foreground"
          >
            {getStatusIcon(task.status)}
            {getStatusLabel(task.status)}
          </Badge>
        </div>
      </Link>
    </div>
  );
}
