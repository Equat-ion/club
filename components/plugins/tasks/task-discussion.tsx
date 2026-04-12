"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/actions/tasks";
import { toast } from "sonner";
import type { TaskComment } from "@/lib/plugins/tasks-types";

interface TaskDiscussionProps {
  taskId: string;
  comments: TaskComment[];
  currentUser: {
    id: string;
    name: string;
    image: string | null;
  };
}

export function TaskDiscussion({ taskId, comments, currentUser }: TaskDiscussionProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentList, setCommentList] = useState<TaskComment[]>(comments);

  useEffect(() => {
    setCommentList(comments);
  }, [comments]);

  const handleSubmit = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment: TaskComment = {
      id: optimisticId,
      taskId,
      body: trimmedBody,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image,
      },
    };

    setCommentList((prev) => [...prev, optimisticComment]);
    setBody("");

    setIsSubmitting(true);
    const res = await addComment(taskId, trimmedBody);
    setIsSubmitting(false);

    if (res.success) {
      setCommentList((prev) =>
        prev.map((comment) =>
          comment.id === optimisticId
            ? {
                ...comment,
                id: res.commentId || optimisticId,
              }
            : comment
        )
      );
      toast.success("Comment posted");
    } else {
      setCommentList((prev) => prev.filter((comment) => comment.id !== optimisticId));
      setBody(trimmedBody);
      toast.error(res.error || "Failed to post comment");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !body.trim()}>
              Post
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {commentList.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.image || undefined} />
              <AvatarFallback>{comment.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="text-sm text-foreground/90 whitespace-pre-wrap">
                {comment.body}
              </div>
            </div>
          </div>
        ))}

        {commentList.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No comments yet. Start a discussion.
          </div>
        )}
      </div>
    </div>
  );
}
