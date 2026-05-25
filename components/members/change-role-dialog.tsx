"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateMemberRole, updateMemberAssignedRoles, type OrgRole } from "@/actions/members";
import { getOrgRoles } from "@/actions/roles";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import type { MemberWithUser } from "@/actions/members";

type Props = {
  orgId: string;
  member: MemberWithUser | null;
  onClose: () => void;
  enterpriseModeEnabled: boolean;
};

export function ChangeRoleDialog({ orgId, member, onClose, enterpriseModeEnabled }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<OrgRole>((member?.role as OrgRole) ?? "member");
  const [orgRolesList, setOrgRolesList] = useState<Array<{ id: string; key: string; name: string }>>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const currentRole = member?.role ?? "member";

  // Available legacy roles (owner cannot be assigned via this dialog)
  const availableRoles = [
    { value: "admin", label: ROLE_DISPLAY_NAMES.admin },
    { value: "member", label: ROLE_DISPLAY_NAMES.member },
  ];

  // Fetch custom organization roles if enterprise mode is enabled
  useEffect(() => {
    if (member && enterpriseModeEnabled) {
      setLoading(true);
      getOrgRoles(orgId)
        .then((roles) => {
          setOrgRolesList(roles);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load organization roles");
        })
        .finally(() => {
          setLoading(false);
        });
      setSelectedRoleIds(member.assignedRoles?.map((r) => r.id) ?? []);
    }
  }, [member, orgId, enterpriseModeEnabled]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!member) return;
    setLoading(true);

    let result;
    if (enterpriseModeEnabled) {
      result = await updateMemberAssignedRoles(orgId, member.id, selectedRoleIds);
    } else {
      if (role === currentRole) {
        onClose();
        setLoading(false);
        return;
      }
      result = await updateMemberRole(orgId, member.id, role);
    }

    if (result.success) {
      toast.success(
        enterpriseModeEnabled
          ? `Updated role assignments for ${member.user.name}`
          : `${member.user.name}'s role changed to ${ROLE_DISPLAY_NAMES[role] ?? role}`
      );
      onClose();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update roles");
    }

    setLoading(false);
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the roles and permissions for{" "}
            <strong>{member?.user.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!enterpriseModeEnabled && (
              <div className="space-y-2">
                <Label>Current role</Label>
                <p className="text-sm text-muted-foreground">
                  {ROLE_DISPLAY_NAMES[currentRole] ?? currentRole}
                </p>
              </div>
            )}

            {enterpriseModeEnabled ? (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Assign Roles</Label>
                {orgRolesList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-md">
                    No custom roles defined for this organization.
                  </p>
                ) : (
                  <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                    {orgRolesList.map((r) => {
                      const checked = selectedRoleIds.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          className="flex items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-card hover:bg-accent/10 transition-colors"
                        >
                          <Checkbox
                            id={r.id}
                            checked={checked}
                            onCheckedChange={(checkedState) => {
                              if (checkedState) {
                                setSelectedRoleIds([...selectedRoleIds, r.id]);
                              } else {
                                setSelectedRoleIds(selectedRoleIds.filter((id) => id !== r.id));
                              }
                            }}
                          />
                          <div className="grid gap-1 leading-none">
                            <label
                              htmlFor={r.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {r.name}
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Role identifier: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{r.key}</code>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (!enterpriseModeEnabled && role === currentRole)}
            >
              {loading ? "Updating..." : "Update Roles"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
