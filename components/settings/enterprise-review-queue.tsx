"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { activateEnterpriseMember } from "@/actions/enterprise";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ClipboardList, ShieldAlert, Check } from "lucide-react";

interface RoleOption {
  id: string;
  name: string;
  key: string;
}

interface ReviewEntry {
  id: string;
  memberId: string;
  userId: string;
  status: string;
  scimGroups: any;
  samlGroups: any;
  alignmentState: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

interface EnterpriseReviewQueueProps {
  orgId: string;
  roles: RoleOption[];
  initialQueue: ReviewEntry[];
}

export function EnterpriseReviewQueue({ orgId, roles, initialQueue }: EnterpriseReviewQueueProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<ReviewEntry[]>(initialQueue);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  async function handleActivate(memberId: string) {
    const roleId = selectedRoles[memberId] || roles[0]?.id;
    if (!roleId) {
      toast.error("A role must be selected");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [memberId]: true }));
    const result = await activateEnterpriseMember({ orgId, memberId, roleIds: [roleId] });
    setLoadingStates((prev) => ({ ...prev, [memberId]: false }));

    if (result.success) {
      toast.success("Member activated successfully");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to activate member");
    }
  }

  function handleRoleChange(memberId: string, roleId: string) {
    setSelectedRoles((prev) => ({ ...prev, [memberId]: roleId }));
  }

  function getGroupsList(groups: any): string[] {
    if (Array.isArray(groups)) return groups;
    try {
      if (typeof groups === "string") {
        const parsed = JSON.parse(groups);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ClipboardList className="size-6 text-primary" />
          <CardTitle>Enterprise Review Queue</CardTitle>
        </div>
        <CardDescription>
          Review and manually provision directory-synced users with group mismatches or missing mappings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>SCIM Groups</TableHead>
                <TableHead>SAML Groups</TableHead>
                <TableHead>Alignment State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                    No members require review at this time.
                  </TableCell>
                </TableRow>
              ) : (
                initialQueue.map((entry) => {
                  const scim = getGroupsList(entry.scimGroups);
                  const saml = getGroupsList(entry.samlGroups);
                  const selectedRole = selectedRoles[entry.memberId] || roles[0]?.id || "";
                  const isLoading = !!loadingStates[entry.memberId];

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{entry.userName}</span>
                          <span className="text-xs text-muted-foreground">{entry.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {scim.length === 0 ? (
                            <span className="text-xs text-muted-foreground font-mono">none</span>
                          ) : (
                            scim.map((g) => (
                              <Badge key={g} variant="outline" className="font-mono text-[10px] py-0.5">
                                {g}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {saml.length === 0 ? (
                            <span className="text-xs text-muted-foreground font-mono">none</span>
                          ) : (
                            saml.map((g) => (
                              <Badge key={g} variant="outline" className="font-mono text-[10px] py-0.5">
                                {g}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.alignmentState === "aligned" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {entry.alignmentState}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-amber-500 border-amber-500/20 bg-amber-500/5">
                          {entry.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none disabled:opacity-50"
                            value={selectedRole}
                            onChange={(e) => handleRoleChange(entry.memberId, e.target.value)}
                            disabled={isLoading}
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isLoading || !selectedRole}
                            onClick={() => handleActivate(entry.memberId)}
                            className="h-8 gap-1 py-1"
                          >
                            <Check className="size-3.5" />
                            Activate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
