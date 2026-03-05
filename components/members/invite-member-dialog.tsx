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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { inviteMember, type OrgRole } from "@/actions/members";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  currentUserRole: string;
  isAtLimit: boolean;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  orgId,
  currentUserRole,
  isAtLimit,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [loading, setLoading] = useState(false);

  // Leads (admin role) can only invite Members
  // Admins (owner role) can invite Members and Leads
  const availableRoles =
    currentUserRole === "owner"
      ? [
          { value: "member", label: ROLE_DISPLAY_NAMES.member },
          { value: "admin", label: ROLE_DISPLAY_NAMES.admin },
        ]
      : [{ value: "member", label: ROLE_DISPLAY_NAMES.member }];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    const result = await inviteMember(orgId, email.trim(), role);

    if (result.success) {
      toast.success(`Invitation sent to ${email}`);
      onOpenChange(false);
      setEmail("");
      setRole("member");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to send invitation");
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new member to this organisation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger id="invite-role">
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isAtLimit}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
