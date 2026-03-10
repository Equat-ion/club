"use client";

import { useState, useMemo } from "react";
import { List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskFilters } from "./task-filters";
import { TaskGroupedView } from "./task-grouped-view";
import { TaskFlatView } from "./task-flat-view";
import type {
  TaskWithDetails,
  OrgMember,
  Label,
  OrgTeam,
  TaskFilterState,
} from "@/lib/plugins/tasks-types";

interface TasksPageProps {
  orgId: string;
  orgSlug: string;
  currentMemberId: string;
  tasks: TaskWithDetails[];
  members: OrgMember[];
  labels: Label[];
  teams: OrgTeam[];
  teamsEnabled: boolean;
}

export type { TaskFilterState };
const EMPTY_FILTERS: TaskFilterState = {
  status: null,
  priority: null,
  assignee: null,
  team: null,
  label: null,
};

export function TasksPage({
  orgId,
  orgSlug,
  currentMemberId,
  tasks,
  members,
  labels,
  teams,
  teamsEnabled,
}: TasksPageProps) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [filters, setFilters] = useState<TaskFilterState>(EMPTY_FILTERS);
  const [view, setView] = useState<"grouped" | "flat">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("tasks-view-preference") as
          | "grouped"
          | "flat") || "grouped"
      );
    }
    return "grouped";
  });

  const handleViewChange = (newView: "grouped" | "flat") => {
    setView(newView);
    localStorage.setItem("tasks-view-preference", newView);
  };

  const handleFilterChange = (key: keyof TaskFilterState, value: string | null) => {
    setFilters((prev: TaskFilterState) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (tab === "mine" && task.assigneeId !== currentMemberId) return false;
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.assignee && task.assigneeId !== filters.assignee) return false;
      if (filters.team && task.teamId !== filters.team) return false;
      if (filters.label && !task.labels.some((l) => l.id === filters.label)) return false;
      return true;
    });
  }, [tasks, tab, currentMemberId, filters]);

  const myTasksCount = useMemo(
    () => tasks.filter((t) => t.assigneeId === currentMemberId).length,
    [tasks, currentMemberId]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-bold tracking-tight">Tasks</h1>
        <CreateTaskDialog
          orgId={orgId}
          orgSlug={orgSlug}
          members={members}
          labels={labels}
          teams={teams}
          teamsEnabled={teamsEnabled}
        />
      </div>

      {/* Tabs + view toggle toolbar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-0 border-b">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")} className="w-auto">
          <TabsList variant="line" className="h-auto gap-2 pb-0">
            <TabsTrigger value="all" className="pb-3 text-sm">
              All Tasks
            </TabsTrigger>
            <TabsTrigger value="mine" className="pb-3 text-sm gap-1.5">
              My Tasks
              {myTasksCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                  {myTasksCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md mb-2">
          <Button
            variant={view === "flat" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-18 gap-1.5 text-xs"
            onClick={() => handleViewChange("flat")}
          >
            <List className="h-3.5 w-3.5" />
            List
          </Button>
          <Button
            variant={view === "grouped" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 w-22 gap-1.5 text-xs"
            onClick={() => handleViewChange("grouped")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grouped
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="px-6 py-2.5 border-b">
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          members={members}
          labels={labels}
          teams={teams}
          teamsEnabled={teamsEnabled}
        />
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto px-6 pt-4 pb-6">
        {view === "grouped" ? (
          <TaskGroupedView tasks={filteredTasks} orgSlug={orgSlug} />
        ) : (
          <TaskFlatView tasks={filteredTasks} orgSlug={orgSlug} />
        )}
      </div>
    </div>
  );
}
