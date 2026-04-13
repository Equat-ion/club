"use client";

import Link from "next/link";
import { ArrowRight, CheckSquare, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskWithDetails } from "@/lib/plugins/tasks-types";

interface DashboardWidgetProps {
  tasks: TaskWithDetails[];
  orgSlug: string;
}

export function DashboardWidget({ tasks, orgSlug }: DashboardWidgetProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border rounded-lg bg-card text-card-foreground shadow-none">
        <Inbox className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border rounded-lg bg-card text-card-foreground shadow-none">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">My Tasks</h3>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground">
          <Link href={`/app/${orgSlug}/tasks?tab=mine`}>
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
      
      <div className="divide-y divide-muted/30">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/app/${orgSlug}/tasks/${task.id}`}
            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col min-w-0 pr-4">
              <span className="text-xs font-mono text-muted-foreground/60">{task.identifier}</span>
              <span className="text-sm font-medium truncate">{task.title}</span>
            </div>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal shrink-0">
              {task.status.replace("_", " ")}
            </Badge>
          </Link>
        ))}
      </div>
      
      <div className="p-3 bg-muted/10 border-t mt-auto">
        <p className="text-[10px] text-center text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"} assigned to you
        </p>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "outline" ? "text-foreground border-border" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </div>
  );
}
