"use client";

import {
  Circle,
  CircleDot,
  Timer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, type TaskStatus } from "@/lib/plugins/tasks-types";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  backlog: <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />,
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Timer className="h-3.5 w-3.5 text-yellow-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  cancelled: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

export function getStatusIcon(status: string) {
  return STATUS_ICONS[status as TaskStatus] ?? STATUS_ICONS.backlog;
}

export function getStatusLabel(status: string) {
  return (
    TASK_STATUSES.find((s) => s.value === status)?.label ?? status
  );
}

export function StatusSelect({
  value,
  onChange,
  disabled,
  variant = "outline",
}: {
  value: string;
  onChange: (value: TaskStatus) => void;
  disabled?: boolean;
  variant?: "outline" | "badge";
}) {
  const label = getStatusLabel(value);
  const icon = getStatusIcon(value);

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as TaskStatus)}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        variant === "badge" 
          ? "h-7 px-3 rounded-full bg-muted/50 border-none hover:bg-muted w-auto gap-2" 
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
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            <span className="flex items-center gap-2">
              {getStatusIcon(status.value)}
              <span>{status.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
