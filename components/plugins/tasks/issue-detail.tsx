"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusSelect } from "./status-select";
import { PrioritySelect } from "./priority-select";
import { AssigneeSelect } from "./assignee-select";
import { IssueActivityLog } from "./issue-activity";
import { IssueComments } from "./issue-comments";
import { updateIssue, deleteIssue } from "@/actions/tasks";
import { toast } from "sonner";
import type {
  IssueWithAssignee,
  IssueComment,
  IssueActivityEntry,
  IssueStatus,
  IssuePriority,
  OrgMember,
} from "@/lib/plugins/tasks-types";

export function IssueDetail({
  issue,
  comments,
  activity,
  members,
  orgSlug,
  currentUserId,
  currentUserRole,
}: {
  issue: IssueWithAssignee;
  comments: IssueComment[];
  activity: IssueActivityEntry[];
  members: OrgMember[];
  orgSlug: string;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnerOrAdmin =
    currentUserRole === "owner" || currentUserRole === "admin";
  const canEdit = isOwnerOrAdmin || issue.creatorId === currentUserId;
  const canDelete = isOwnerOrAdmin;

  async function handleFieldUpdate(
    field: string,
    value: string | null
  ) {
    const result = await updateIssue(issue.id, { [field]: value });
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update issue");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteIssue(issue.id);
    setDeleting(false);

    if (result.success) {
      toast.success("Issue deleted");
      router.push(`/app/${orgSlug}/tasks`);
    } else {
      toast.error(result.error ?? "Failed to delete issue");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/app/${orgSlug}/tasks`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm font-mono text-muted-foreground">
          {issue.identifier}
        </span>
        {canDelete && (
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Issue</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {issue.identifier}? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main content */}
        <div className="space-y-6">
          {/* Title */}
          <EditableTitle
            value={issue.title}
            onSave={(val) => handleFieldUpdate("title", val)}
            disabled={!canEdit}
          />

          {/* Description */}
          <EditableDescription
            value={issue.description ?? ""}
            onSave={(val) => handleFieldUpdate("description", val || null)}
            disabled={!canEdit}
          />

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Comments</h3>
            <IssueComments
              issueId={issue.id}
              comments={comments}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>

          <Separator />

          {/* Activity Log */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Activity</h3>
            <IssueActivityLog activity={activity} />
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border p-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <StatusSelect
                value={issue.status}
                onValueChange={(val) => handleFieldUpdate("status", val)}
                disabled={!canEdit}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </label>
              <PrioritySelect
                value={issue.priority}
                onValueChange={(val) => handleFieldUpdate("priority", val)}
                disabled={!canEdit}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assignee
              </label>
              <AssigneeSelect
                value={issue.assigneeId}
                onValueChange={(val) => handleFieldUpdate("assigneeId", val)}
                members={members}
                disabled={!canEdit}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Due Date
              </label>
              <Input
                type="date"
                value={issue.dueDate ?? ""}
                onChange={(e) =>
                  handleFieldUpdate("dueDate", e.target.value || null)
                }
                disabled={!canEdit}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Meta info */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Created by {issue.creator.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(issue.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Inline editable fields
// ============================================================

function EditableTitle({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (val: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleBlur() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) {
      onSave(draft.trim());
    } else {
      setDraft(value);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (disabled || !editing) {
    return (
      <h1
        className="text-2xl font-bold tracking-tight cursor-text"
        onClick={() => !disabled && setEditing(true)}
      >
        {value}
      </h1>
    );
  }

  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      className="text-2xl font-bold h-auto py-1 px-2"
    />
  );
}

function EditableDescription({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (val: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleBlur() {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  }

  if (disabled || !editing) {
    return (
      <div
        className="min-h-[60px] cursor-text text-sm"
        onClick={() => !disabled && setEditing(true)}
      >
        {value ? (
          <p className="whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {disabled ? "No description" : "Click to add a description..."}
          </p>
        )}
      </div>
    );
  }

  return (
    <Textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      rows={5}
      placeholder="Add a description..."
      className="text-sm"
    />
  );
}
