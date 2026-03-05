"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { removeMember } from "@/actions/members";
import type { MemberWithUser } from "@/actions/members";

type Props = {
  orgId: string;
  member: MemberWithUser | null;
  onClose: () => void;
};

export function RemoveMemberDialog({ orgId, member, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!member) return;

    setLoading(true);

    const result = await removeMember(orgId, member.id);

    if (result.success) {
      toast.success(`${member.user.name} has been removed from the organisation`);
      onClose();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to remove member");
    }

    setLoading(false);
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <strong>{member?.user.name}</strong> ({member?.user.email}) from this
            organisation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? "Removing..." : "Remove Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
