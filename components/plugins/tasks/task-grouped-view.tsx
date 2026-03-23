"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TaskRow } from "./task-row";
import { TASK_STATUSES, type TaskWithDetails } from "@/lib/plugins/tasks-types";

interface TaskGroupedViewProps {
  tasks: TaskWithDetails[];
  orgSlug: string;
  canSelectTasks: boolean;
  selectedTaskIds: string[];
  onTaskSelectionChange: (taskId: string, selected: boolean) => void;
}

export function TaskGroupedView({
  tasks,
  orgSlug,
  canSelectTasks,
  selectedTaskIds,
  onTaskSelectionChange,
}: TaskGroupedViewProps) {
  const tasksByStatus = useMemo(() => {
    const groups: Record<string, TaskWithDetails[]> = {};
    for (const status of TASK_STATUSES) {
      groups[status.value] = tasks
        .filter((t) => t.status === status.value)
        .sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, no_priority: 4 };
          const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
          const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
          if (pA !== pB) return pA - pB;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    return groups;
  }, [tasks]);

  return (
    <div className="space-y-6">
      {TASK_STATUSES.map((status) => {
        const groupTasks = tasksByStatus[status.value] || [];
        if (groupTasks.length === 0) return null;

        return (
          <StatusGroup 
            key={status.value} 
            status={status} 
            tasks={groupTasks} 
            orgSlug={orgSlug}
            canSelectTasks={canSelectTasks}
            selectedTaskIds={selectedTaskIds}
            onTaskSelectionChange={onTaskSelectionChange}
            defaultOpen={["backlog", "todo", "in_progress"].includes(status.value)}
          />
        );
      })}
    </div>
  );
}

function StatusGroup({ 
  status, 
  tasks, 
  orgSlug, 
  canSelectTasks,
  selectedTaskIds,
  onTaskSelectionChange,
  defaultOpen 
}: { 
  status: typeof TASK_STATUSES[0], 
  tasks: TaskWithDetails[], 
  orgSlug: string,
  canSelectTasks: boolean,
  selectedTaskIds: string[],
  onTaskSelectionChange: (taskId: string, selected: boolean) => void,
  defaultOpen: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger className="flex items-center gap-2 group w-full text-left">
        <div className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {status.label}
        </span>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal bg-muted/50 text-muted-foreground">
          {tasks.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1">
        <div className="flex flex-col">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              orgSlug={orgSlug}
              showCheckbox
              checkboxChecked={selectedTaskIds.includes(task.id)}
              checkboxDisabled={!canSelectTasks}
              onCheckboxChange={(selected) => onTaskSelectionChange(task.id, selected)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
