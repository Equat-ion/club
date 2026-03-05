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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateMemberRole, type OrgRole } from "@/actions/members";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import type { MemberWithUser } from "@/actions/members";

type Props = {
  orgId: string;
  member: MemberWithUser | null;
  onClose: () => void;
};

export function ChangeRoleDialog({ orgId, member, onClose }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<OrgRole>(member?.role as OrgRole ?? "member");
  const [loading, setLoading] = useState(false);

  // Reset role when member changes
  const currentRole = member?.role ?? "member";

  // Available roles to assign (owner cannot be assigned via this dialog)
  const availableRoles = [
    { value: "admin", label: ROLE_DISPLAY_NAMES.admin },
    { value: "member", label: ROLE_DISPLAY_NAMES.member },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!member) return;
    if (role === currentRole) {
      onClose();
      return;
    }

    setLoading(true);

    const result = await updateMemberRole(orgId, member.id, role);

    if (result.success) {
      toast.success(
        `${member.user.name}'s role changed to ${ROLE_DISPLAY_NAMES[role] ?? role}`
      );
      onClose();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update role");
    }

    setLoading(false);
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the role for{" "}
            <strong>{member?.user.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current role</Label>
              <p className="text-sm text-muted-foreground">
                {ROLE_DISPLAY_NAMES[currentRole] ?? currentRole}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">New role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as OrgRole)}
                defaultValue={currentRole}
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === "admin"
                  ? "Leads can manage members and content but cannot access billing or settings."
                  : "Members can view and contribute to content with limited management access."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || role === currentRole}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
