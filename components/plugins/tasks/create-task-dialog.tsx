"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar as CalendarIcon, Tag, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label as FormLabel } from "@/components/ui/label";
import { createTask } from "@/actions/tasks";
import { toast } from "sonner";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type TaskStatus,
  type TaskPriority,
  type OrgMember,
  type Label,
  type OrgTeam,
} from "@/lib/plugins/tasks-types";
import { StatusSelect } from "./status-select";
import { PrioritySelect } from "./priority-select";
import { AssigneeSelect } from "./assignee-select";
import { TeamPicker } from "./team-picker";
import { LabelPicker } from "./label-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CreateTaskDialogProps {
  orgId: string;
  orgSlug: string;
  members: OrgMember[];
  labels: Label[];
  teams: OrgTeam[];
  teamsEnabled: boolean;
}

export function CreateTaskDialog({
  orgId,
  orgSlug,
  members,
  labels,
  teams,
  teamsEnabled,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("no_priority");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    const res = await createTask(orgId, {
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      teamId: teamId || undefined,
      dueDate: dueDate?.toISOString(),
      labelIds: selectedLabelIds,
    });

    setIsSubmitting(false);
    if (res.success) {
      toast.success("Task created");
      setOpen(false);
      router.push(`/app/${orgSlug}/tasks/${res.taskId}`);
      resetForm();
    } else {
      toast.error(res.error || "Failed to create task");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("no_priority");
    setAssigneeId(null);
    setTeamId(null);
    setDueDate(undefined);
    setSelectedLabelIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold">New Task</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</FormLabel>
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto py-1"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</FormLabel>
              <Textarea
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</FormLabel>
              <StatusSelect value={status} onChange={(val) => setStatus(val as TaskStatus)} />
            </div>
            
            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</FormLabel>
              <PrioritySelect value={priority} onChange={(val) => setPriority(val as TaskPriority)} />
            </div>

            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignee</FormLabel>
              <AssigneeSelect 
                members={members} 
                value={assigneeId} 
                onChange={setAssigneeId} 
              />
            </div>

            {teamsEnabled && (
              <div className="space-y-2">
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</FormLabel>
                <TeamPicker 
                  teams={teams} 
                  selectedTeamId={teamId} 
                  onSelect={setTeamId} 
                />
              </div>
            )}

            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Labels</FormLabel>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                {selectedLabelIds.map(id => {
                  const label = labels.find(l => l.id === id);
                  if (!label) return null;
                  return (
                    <Badge 
                      key={id} 
                      className="h-6 px-1.5 gap-1 font-normal"
                      style={{ backgroundColor: `${label.color}20`, color: label.color, border: `1px solid ${label.color}40` }}
                    >
                      {label.name}
                      <button onClick={() => setSelectedLabelIds(prev => prev.filter(i => i !== id))}>
                        <Plus className="h-3 w-3 rotate-45" />
                      </button>
                    </Badge>
                  );
                })}
                <LabelPicker
                  orgId={orgId}
                  availableLabels={labels}
                  selectedLabelIds={selectedLabelIds}
                  onSelect={(id) => setSelectedLabelIds(prev => [...prev, id])}
                  onRemove={(id) => setSelectedLabelIds(prev => prev.filter(i => i !== id))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
