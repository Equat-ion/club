"use client";

import { useMemo, useRef, useState } from "react";
import { MessageSquare, History } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import type {
  TaskWithDetails,
  TaskComment,
  TaskActivityEntry,
  OrgMember,
  Label,
  OrgTeam,
  TaskStatus,
  TaskPriority,
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
  currentUser: {
    id: string;
    name: string;
    image: string | null;
  };
}

export function TaskDetail({
  task,
  comments,
  activity,
  members,
  labels,
  teams,
  teamsEnabled,
  currentUser,
}: TaskDetailProps) {
  const [taskState, setTaskState] = useState(task);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const taskRef = useRef(task);
  const mutationVersionRef = useRef(0);

  const membersById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);

  const teamsById = useMemo(() => {
    return new Map(teams.map((team) => [team.id, team]));
  }, [teams]);

  const labelsById = useMemo(() => {
    return new Map(labels.map((label) => [label.id, label]));
  }, [labels]);

  const applyPatch = (
    baseTask: TaskWithDetails,
    patch: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      teamId?: string | null;
      dueDate?: string | null;
      labelIds?: string[];
    }
  ): TaskWithDetails => {
    const nextAssigneeId =
      patch.assigneeId !== undefined ? patch.assigneeId : baseTask.assigneeId;
    const nextTeamId = patch.teamId !== undefined ? patch.teamId : baseTask.teamId;
    const nextLabels =
      patch.labelIds !== undefined
        ? patch.labelIds
            .map((labelId) => labelsById.get(labelId))
            .filter((label): label is Label => Boolean(label))
        : baseTask.labels;

    return {
      ...baseTask,
      title: patch.title !== undefined ? patch.title : baseTask.title,
      description:
        patch.description !== undefined ? patch.description : baseTask.description,
      status: patch.status !== undefined ? patch.status : baseTask.status,
      priority: patch.priority !== undefined ? patch.priority : baseTask.priority,
      assigneeId: nextAssigneeId,
      teamId: nextTeamId,
      dueDate: patch.dueDate !== undefined ? patch.dueDate : baseTask.dueDate,
      assignee:
        nextAssigneeId === null
          ? null
          : nextAssigneeId
            ? {
                id: nextAssigneeId,
                name: membersById.get(nextAssigneeId)?.name ?? baseTask.assignee?.name ?? "Unknown",
                image: membersById.get(nextAssigneeId)?.image ?? baseTask.assignee?.image ?? null,
              }
            : baseTask.assignee,
      team:
        nextTeamId === null
          ? null
          : nextTeamId
            ? {
                id: nextTeamId,
                name: teamsById.get(nextTeamId)?.name ?? baseTask.team?.name ?? "Unknown",
              }
            : baseTask.team,
      labels: nextLabels,
      updatedAt: new Date(),
    };
  };

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
    const mutationVersion = mutationVersionRef.current + 1;
    mutationVersionRef.current = mutationVersion;

    const previousTask = taskRef.current;
    const optimisticTask = applyPatch(previousTask, data);
    taskRef.current = optimisticTask;
    setTaskState(optimisticTask);

    if (data.title !== undefined) {
      setTitle(data.title);
    }
    if (data.description !== undefined) {
      setDescription(data.description || "");
    }

    const res = await updateTask(task.id, data);
    if (!res.success) {
      if (mutationVersionRef.current === mutationVersion) {
        taskRef.current = previousTask;
        setTaskState(previousTask);
        setTitle(previousTask.title);
        setDescription(previousTask.description || "");
      }
      toast.error(res.error || "Update failed");
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== taskRef.current.title) {
      handleUpdate({ title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (taskRef.current.description || "")) {
      handleUpdate({ description });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
      <div className="space-y-6">
        <TaskMetadataRow
          task={taskState}
          members={members}
          labels={labels}
          teams={teams}
          teamsEnabled={teamsEnabled}
          onUpdate={handleUpdate}
          orgId={taskState.orgId}
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
                  setTitle(taskRef.current.title);
                  setIsEditingTitle(false);
                }
              }}
            />
          ) : (
            <h1 
              className="text-4xl font-bold cursor-text hover:text-foreground/80 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {taskState.title}
            </h1>
          )}
        </div>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2 text-xs opacity-60">
            <span>Created by</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={taskState.creator.image || undefined} />
                <AvatarFallback className="text-[8px]">
                  {taskState.creator.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{taskState.creator.name}</span>
            </div>
            <span>•</span>
            <span>{format(new Date(taskState.createdAt), "PPP")}</span>
            {taskState.labels.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {taskState.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className="h-5 max-w-[140px] gap-1 border-muted/50 px-1.5 text-[10px] font-normal text-muted-foreground"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="truncate">{label.name}</span>
                    </Badge>
                  ))}
                </div>
              </>
            )}
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
            <TaskDiscussion
              taskId={taskState.id}
              comments={comments}
              currentUser={currentUser}
            />
          </TabsContent>
          <TabsContent value="activity">
            <TaskActivity activity={activity} teamsEnabled={teamsEnabled} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
