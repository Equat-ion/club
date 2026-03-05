"use client";

import {
  SignalHigh,
  SignalMedium,
  SignalLow,
  AlertTriangle,
  Minus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ISSUE_PRIORITIES,
  type IssuePriority,
} from "@/lib/plugins/tasks-types";

const PRIORITY_ICONS: Record<IssuePriority, React.ReactNode> = {
  urgent: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  high: <SignalHigh className="h-3.5 w-3.5 text-orange-500" />,
  medium: <SignalMedium className="h-3.5 w-3.5 text-yellow-500" />,
  low: <SignalLow className="h-3.5 w-3.5 text-blue-500" />,
  no_priority: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function getPriorityIcon(priority: string) {
  return PRIORITY_ICONS[priority as IssuePriority] ?? PRIORITY_ICONS.no_priority;
}

export function getPriorityLabel(priority: string) {
  return (
    ISSUE_PRIORITIES.find((p) => p.value === priority)?.label ?? priority
  );
}

export function PrioritySelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: IssuePriority) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as IssuePriority)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            {getPriorityIcon(value)}
            <span>{getPriorityLabel(value)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ISSUE_PRIORITIES.map((priority) => (
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
