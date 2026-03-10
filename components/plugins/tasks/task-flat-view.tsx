"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskRow } from "./task-row";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TaskWithDetails } from "@/lib/plugins/tasks-types";

interface TaskFlatViewProps {
  tasks: TaskWithDetails[];
  orgSlug: string;
}

type SortKey = "priority" | "title" | "assignee" | "team" | "due" | "status" | "createdAt";
type SortOrder = "asc" | "desc" | "none";

export function TaskFlatView({ tasks, orgSlug }: TaskFlatViewProps) {
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

    return [...tasks].sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof TaskWithDetails];
      let valB: any = b[sortConfig.key as keyof TaskWithDetails];

      if (sortConfig.key === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, no_priority: 4 };
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
      }

      if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });
  }, [tasks, sortConfig]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column || sortConfig.order === "none") return <ArrowUpDown className="ml-2 h-3 w-3" />;
    if (sortConfig.order === "asc") return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="w-full">
      <div className="flex items-center h-8 px-4 border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        <div className="w-8 flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="opacity-50">
                  <Checkbox disabled />
                </div>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex-shrink-0 w-8 flex justify-center cursor-pointer hover:text-foreground" onClick={() => handleSort("priority")}>
          <SortIcon column="priority" />
        </div>
        <div className="flex-shrink-0 w-14 ml-3">ID</div>
        <div className="flex-1 cursor-pointer hover:text-foreground flex items-center" onClick={() => handleSort("title")}>
          Title <SortIcon column="title" />
        </div>
        <div className="flex-shrink-0 w-24 cursor-pointer hover:text-foreground flex items-center" onClick={() => handleSort("assignee")}>
          Assignee <SortIcon column="assignee" />
        </div>
        <div className="flex-shrink-0 w-24 cursor-pointer hover:text-foreground flex items-center" onClick={() => handleSort("team")}>
          Team <SortIcon column="team" />
        </div>
        <div className="flex-shrink-0 w-20">Labels</div>
        <div className="flex-shrink-0 w-16 text-right cursor-pointer hover:text-foreground flex items-center justify-end" onClick={() => handleSort("due")}>
          Due <SortIcon column="due" />
        </div>
        <div className="flex-shrink-0 w-24 text-right cursor-pointer hover:text-foreground flex items-center justify-end" onClick={() => handleSort("status")}>
          Status <SortIcon column="status" />
        </div>
      </div>
      <div className="flex flex-col">
        {sortedTasks.map((task) => (
          <div key={task.id} className="flex items-center hover:bg-muted/50 transition-colors border-b last:border-0 border-muted/30">
            <div className="w-8 flex justify-center">
              <Checkbox disabled />
            </div>
            <div className="flex-1">
              <TaskRow task={task} orgSlug={orgSlug} />
            </div>
          </div>
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
