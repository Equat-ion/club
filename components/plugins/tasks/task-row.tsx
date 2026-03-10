"use client";

import Link from "next/link";
import { format, isToday, isPast } from "date-fns";
import { 
  CircleAlert, 
  ChevronUp, 
  ChevronRight, 
  ChevronDown, 
  Minus,
  CheckCircle2,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TaskWithDetails, TaskPriority } from "@/lib/plugins/tasks-types";

interface TaskRowProps {
  task: TaskWithDetails;
  orgSlug: string;
}

const priorityIcons: Record<TaskPriority, { icon: any, color: string }> = {
  urgent: { icon: CircleAlert, color: "text-red-500" },
  high: { icon: ChevronUp, color: "text-orange-500" },
  medium: { icon: ChevronRight, color: "text-yellow-500" },
  low: { icon: ChevronDown, color: "text-blue-500" },
  no_priority: { icon: Minus, color: "text-muted-foreground" },
};

export function TaskRow({ task, orgSlug }: TaskRowProps) {
  const PriorityIcon = priorityIcons[task.priority as TaskPriority]?.icon || Minus;
  const priorityColor = priorityIcons[task.priority as TaskPriority]?.color || "text-muted-foreground";

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !["done", "cancelled"].includes(task.status);
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate)) && !["done", "cancelled"].includes(task.status);

  return (
    <Link
      href={`/app/${orgSlug}/tasks/${task.id}`}
      className="flex items-center h-10 px-4 gap-3 hover:bg-muted/50 transition-colors group border-b last:border-0 border-muted/30"
    >
      <div className={cn("flex-shrink-0", priorityColor)}>
        <PriorityIcon className="h-4 w-4" />
      </div>

      <div className="flex-shrink-0 font-mono text-[10px] text-muted-foreground w-14">
        {task.identifier}
      </div>

      <div className="flex-1 truncate text-sm">
        {task.title}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.labels.slice(0, 3).map((label) => (
          <TooltipProvider key={label.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: label.color }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{label.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {task.labels.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{task.labels.length - 3}</span>
        )}
      </div>

      {task.assignee && (
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
      )}

      {task.team && (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal border-muted/50 text-muted-foreground flex-shrink-0">
          {task.team.name}
        </Badge>
      )}

      {task.dueDate && (
        <div className={cn(
          "text-[10px] w-12 text-right flex-shrink-0",
          isOverdue ? "text-destructive font-medium" : isDueToday ? "text-amber-500 font-medium" : "text-muted-foreground"
        )}>
          {format(new Date(task.dueDate), "MMM d")}
        </div>
      )}
    </Link>
  );
}
