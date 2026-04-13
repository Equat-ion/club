"use client";

import { 
  CircleAlert, 
  ChevronUp, 
  ChevronRight, 
  ChevronDown, 
  Minus 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_PRIORITIES,
  type TaskPriority,
} from "@/lib/plugins/tasks-types";
import { cn } from "@/lib/utils";

const PRIORITY_ICONS: Record<TaskPriority, React.ReactNode> = {
  urgent: <CircleAlert className="h-3.5 w-3.5 text-red-500" />,
  high: <ChevronUp className="h-3.5 w-3.5 text-orange-500" />,
  medium: <ChevronRight className="h-3.5 w-3.5 text-yellow-500" />,
  low: <ChevronDown className="h-3.5 w-3.5 text-orange-500" />,
  no_priority: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function getPriorityIcon(priority: string) {
  return PRIORITY_ICONS[priority as TaskPriority] ?? PRIORITY_ICONS.no_priority;
}

export function getPriorityLabel(priority: string) {
  return (
    TASK_PRIORITIES.find((p) => p.value === priority)?.label ?? priority
  );
}

export function PrioritySelect({
  value,
  onChange,
  disabled,
  variant = "outline",
}: {
  value: string;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
  variant?: "outline" | "badge";
}) {
  const label = getPriorityLabel(value);
  const icon = getPriorityIcon(value);

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskPriority)}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        variant === "badge" 
          ? "h-7 px-2 bg-muted/50 border-none hover:bg-muted w-auto gap-2" 
          : "w-full h-9"
      )}>
        <SelectValue>
          <span className="flex items-center gap-2">
            {icon}
            <span className="truncate">{label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TASK_PRIORITIES.map((priority) => (
          <SelectItem key={priority.value} value={priority.value}>
            <span className="flex items-center gap-2">
              {getPriorityIcon(priority.value)}
              <span>{priority.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
