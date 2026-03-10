"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronLeft, 
  MoreHorizontal, 
  Trash2, 
  User, 
  Users,
  Plus,
  MessageSquare,
  History
} from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { deleteTask, updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import type { 
  TaskWithDetails, 
  TaskComment, 
  TaskActivityEntry, 
  OrgMember, 
  Label, 
  OrgTeam,
  TaskStatus,
  TaskPriority 
} from "@/lib/plugins/tasks-types";
import { TaskMetadataRow } from "./task-metadata-row";
import { TaskDiscussion } from "./task-discussion";
import { TaskActivity } from "./task-activity";

interface TaskDetailProps {
  task: TaskWithDetails;
  comments: TaskComment[];
  activity: TaskActivityEntry[];
  members: OrgMember[];
  labels: Label[];
  teams: OrgTeam[];
  teamsEnabled: boolean;
  orgSlug: string;
  currentUserId: string;
  currentUserRole: string;
}

export function TaskDetail({
  task,
  comments,
  activity,
  members,
  labels,
  teams,
  teamsEnabled,
  orgSlug,
  currentUserId,
  currentUserRole,
}: TaskDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const handleUpdate = async (data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    teamId?: string | null;
    dueDate?: string | null;
    labelIds?: string[];
  }) => {
    const res = await updateTask(task.id, data);
    if (!res.success) {
      toast.error(res.error || "Update failed");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteTask(task.id);
    if (res.success) {
      toast.success("Task deleted");
      router.push(`/app/${orgSlug}/tasks`);
    } else {
      toast.error(res.error || "Failed to delete task");
      setIsDeleting(false);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== task.title) {
      handleUpdate({ title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || "")) {
      handleUpdate({ description });
    }
  };

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href={`/app/${orgSlug}/tasks`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Tasks
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                  disabled={!isAdmin}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this task and all its comments. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-6">
        <TaskMetadataRow
          task={task}
          members={members}
          labels={labels}
          teams={teams}
          teamsEnabled={teamsEnabled}
          onUpdate={handleUpdate}
          orgId={task.orgId}
        />

        <div className="group relative">
          {isEditingTitle ? (
            <input
              autoFocus
              className="text-4xl font-bold w-full bg-transparent outline-none border-b-2 border-primary pb-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleBlur();
                if (e.key === "Escape") {
                  setTitle(task.title);
                  setIsEditingTitle(false);
                }
              }}
            />
          ) : (
            <h1 
              className="text-4xl font-bold cursor-text hover:text-foreground/80 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {task.title}
            </h1>
          )}
        </div>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Assigned to</span>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee?.image || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {task.assignee ? task.assignee.name.substring(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                {task.assignee?.name || "Unassigned"}
              </div>
            </div>

            {teamsEnabled && (
              <div className="flex items-center gap-2">
                <span>Team</span>
                <Badge variant="secondary" className="font-medium bg-muted/50">
                  {task.team?.name || "No team"}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Labels</span>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map(label => (
                  <Badge 
                    key={label.id} 
                    className="h-6 px-1.5 gap-1 font-normal"
                    style={{ backgroundColor: `${label.color}20`, color: label.color, border: `1px solid ${label.color}40` }}
                  >
                    {label.name}
                  </Badge>
                ))}
                {task.labels.length === 0 && <span className="text-muted-foreground/50">None</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>Due</span>
              <span className={cn(
                "font-medium",
                task.dueDate && isPast(new Date(task.dueDate)) && !["done", "cancelled"].includes(task.status) ? "text-destructive" : "text-foreground"
              )}>
                {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs opacity-60">
            <span>Created by</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={task.creator.image || undefined} />
                <AvatarFallback className="text-[8px]">
                  {task.creator.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{task.creator.name}</span>
            </div>
            <span>•</span>
            <span>{format(new Date(task.createdAt), "PPP")}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</h3>
        <Textarea
          placeholder="Add a description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          className="min-h-[150px] text-base border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 resize-none bg-transparent"
        />
      </div>

      <Separator />

      <Tabs defaultValue="discussion" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="discussion">
            <MessageSquare className="h-4 w-4" />
            Discussion
            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-muted/50 ml-1">{comments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4" />
            Activity
            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-muted/50 ml-1">{activity.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="pt-6">
          <TabsContent value="discussion">
            <TaskDiscussion taskId={task.id} comments={comments} />
          </TabsContent>
          <TabsContent value="activity">
            <TaskActivity activity={activity} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
