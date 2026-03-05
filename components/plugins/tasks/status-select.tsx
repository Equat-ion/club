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
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/plugins/tasks-types";

const STATUS_ICONS: Record<IssueStatus, React.ReactNode> = {
  backlog: <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />,
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Timer className="h-3.5 w-3.5 text-yellow-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  cancelled: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

export function getStatusIcon(status: string) {
  return STATUS_ICONS[status as IssueStatus] ?? STATUS_ICONS.backlog;
}

export function getStatusLabel(status: string) {
  return (
    ISSUE_STATUSES.find((s) => s.value === status)?.label ?? status
  );
}

export function StatusSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: IssueStatus) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as IssueStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            {getStatusIcon(value)}
            <span>{getStatusLabel(value)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ISSUE_STATUSES.map((status) => (
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
