"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskRow } from "./task-row";
import type { TaskWithDetails } from "@/lib/plugins/tasks-types";
import { TASK_ROW_TEMPLATE_WITH_CHECKBOX, TASK_ROW_TEMPLATE_NO_TEAM } from "./task-row";

interface TaskFlatViewProps {
  tasks: TaskWithDetails[];
  orgSlug: string;
  canSelectTasks: boolean;
  selectedTaskIds: string[];
  onTaskSelectionChange: (taskId: string, selected: boolean) => void;
  onSelectVisibleTasks: (taskIds: string[], selected: boolean) => void;
  teamsEnabled?: boolean;
}

type SortKey = "priority" | "title" | "assignee" | "team" | "due" | "status" | "createdAt";
type SortOrder = "asc" | "desc" | "none";

function renderSortIcon(sortConfig: { key: SortKey; order: SortOrder }, column: SortKey) {
  if (sortConfig.key !== column || sortConfig.order === "none") {
    return <ArrowUpDown className="ml-2 h-3 w-3" />;
  }

  if (sortConfig.order === "asc") {
    return <ArrowUp className="ml-2 h-3 w-3" />;
  }

  return <ArrowDown className="ml-2 h-3 w-3" />;
}

export function TaskFlatView({
  tasks,
  orgSlug,
  canSelectTasks,
  selectedTaskIds,
  onTaskSelectionChange,
  onSelectVisibleTasks,
  teamsEnabled = false,
}: TaskFlatViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: "createdAt",
    order: "desc",
  });

  const handleSort = (key: SortKey) => {
    let order: SortOrder = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.order === "asc") order = "desc";
      else if (sortConfig.order === "desc") order = "none";
      else order = "asc";
    }
    setSortConfig({ key, order });
  };

  const sortedTasks = useMemo(() => {
    if (sortConfig.order === "none") return tasks;
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, no_priority: 4 };
    const statusOrder = { backlog: 0, todo: 1, in_progress: 2, done: 3, cancelled: 4 };

    return [...tasks].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortConfig.key === "priority") {
        valA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
        valB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      } else if (sortConfig.key === "assignee") {
        valA = a.assignee?.name || "";
        valB = b.assignee?.name || "";
      } else if (sortConfig.key === "team") {
        valA = a.team?.name || "";
        valB = b.team?.name || "";
      } else if (sortConfig.key === "due") {
        valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      } else if (sortConfig.key === "status") {
        valA = statusOrder[a.status as keyof typeof statusOrder] ?? 0;
        valB = statusOrder[b.status as keyof typeof statusOrder] ?? 0;
      } else if (sortConfig.key === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortConfig.key === "title") {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      }

      if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });
  }, [tasks, sortConfig]);

  const visibleTaskIds = sortedTasks.map((task) => task.id);
  const selectedVisibleTaskCount = visibleTaskIds.filter((taskId) => selectedTaskIds.includes(taskId)).length;
  const allVisibleSelected = visibleTaskIds.length > 0 && selectedVisibleTaskCount === visibleTaskIds.length;
  const someVisibleSelected = selectedVisibleTaskCount > 0 && selectedVisibleTaskCount < visibleTaskIds.length;

  return (
    <div className="w-full">
      <div
        className={`grid h-8 items-center gap-x-4 border-b px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 ${teamsEnabled ? TASK_ROW_TEMPLATE_WITH_CHECKBOX : TASK_ROW_TEMPLATE_NO_TEAM}`}
      >
        <div className="flex items-center justify-center opacity-50">
          <Checkbox
            checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
            disabled={!canSelectTasks || visibleTaskIds.length === 0}
            aria-label="Select all visible tasks"
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(checked) => onSelectVisibleTasks(visibleTaskIds, checked === true || checked === "indeterminate")}
          />
        </div>
        <div
          className="flex-shrink-0 flex cursor-pointer items-center justify-center hover:text-foreground"
          onClick={() => handleSort("priority")}
        >
          {renderSortIcon(sortConfig, "priority")}
        </div>
        <div className="flex-shrink-0 whitespace-nowrap">ID</div>
        <div
          className="min-w-0 cursor-pointer hover:text-foreground flex items-center"
          onClick={() => handleSort("title")}
        >
          Title {renderSortIcon(sortConfig, "title")}
        </div>
        <div
          className="flex-shrink-0 cursor-pointer hover:text-foreground flex items-center"
          onClick={() => handleSort("assignee")}
        >
          Assignee {renderSortIcon(sortConfig, "assignee")}
        </div>
        {teamsEnabled && (
          <div
            className="flex-shrink-0 cursor-pointer hover:text-foreground flex items-center"
            onClick={() => handleSort("team")}
          >
            Team {renderSortIcon(sortConfig, "team")}
          </div>
        )}
        {!teamsEnabled && <div />}
        <div className="flex-shrink-0">Labels</div>
        <div
          className="flex-shrink-0 cursor-pointer hover:text-foreground flex items-center justify-end text-right"
          onClick={() => handleSort("due")}
        >
          Due {renderSortIcon(sortConfig, "due")}
        </div>
        <div
          className="flex-shrink-0 cursor-pointer hover:text-foreground flex items-center justify-end text-right"
          onClick={() => handleSort("status")}
        >
          Status {renderSortIcon(sortConfig, "status")}
        </div>
      </div>
      <div className="flex flex-col">
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              orgSlug={orgSlug}
              showCheckbox
              checkboxChecked={selectedTaskIds.includes(task.id)}
              checkboxDisabled={!canSelectTasks}
              onCheckboxChange={(selected) => onTaskSelectionChange(task.id, selected)}
              teamsEnabled={teamsEnabled}
            />
          ))}
      </div>
      {sortedTasks.length === 0 && (
        <div className="py-10 text-center text-muted-foreground">
          No tasks found
        </div>
      )}
    </div>
  );
}
