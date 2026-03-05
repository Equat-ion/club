"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/actions/tasks";
import { toast } from "sonner";
import type { IssueComment } from "@/lib/plugins/tasks-types";

function formatCommentDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IssueComments({
  issueId,
  comments,
  currentUserId,
  currentUserRole,
}: {
  issueId: string;
  comments: IssueComment[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDeleteAny =
    currentUserRole === "owner" || currentUserRole === "admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    const result = await addComment(issueId, body.trim());
    setLoading(false);

    if (result.success) {
      setBody("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to add comment");
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    const result = await deleteComment(commentId);
    setDeletingId(null);

    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete comment");
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing comments */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const canDelete =
              canDeleteAny || comment.author.id === currentUserId;
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-7 w-7 mt-0.5 flex-shrink-0">
                  <AvatarImage src={comment.author.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={loading || !body.trim()}
          >
            {loading ? "Posting..." : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
