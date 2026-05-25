"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveGroupMapping, deleteGroupMapping } from "@/actions/enterprise";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Users, Trash2, Plus } from "lucide-react";

interface RoleOption {
  id: string;
  name: string;
  key: string;
}

interface MappingItem {
  id: string;
  groupKey: string;
  roleId: string;
}

interface GroupMappingCardProps {
  orgId: string;
  roles: RoleOption[];
  initialMappings: MappingItem[];
}

export function GroupMappingCard({ orgId, roles, initialMappings }: GroupMappingCardProps) {
  const router = useRouter();
  const [mappings, setMappings] = useState<MappingItem[]>(initialMappings);
  const [groupKey, setGroupKey] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id || "");
  const [loading, setLoading] = useState(false);

  // Wait! Let's check how Select is imported from components/ui/select.tsx
  // Yes: import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  
  async function handleAddMapping(e: React.FormEvent) {
    e.preventDefault();
    const key = groupKey.trim();
    if (!key) {
      toast.error("Group key is required");
      return;
    }

    if (!roleId) {
      toast.error("Role is required");
      return;
    }

    setLoading(true);
    const result = await saveGroupMapping({ orgId, groupKey: key, roleId });
    setLoading(false);

    if (result.success) {
      toast.success("Group mapping added");
      setGroupKey("");
      router.refresh();
      // We assume hot refresh will update mappings via server component,
      // but let's also update local state for immediate feedback if needed.
      // Wait, let's let the router refresh handle it, or update local mappings.
    } else {
      toast.error(result.error ?? "Failed to add mapping");
    }
  }

  async function handleDelete(mappingId: string) {
    if (!confirm("Are you sure you want to delete this group mapping?")) {
      return;
    }

    const result = await deleteGroupMapping({ orgId, mappingId });
    if (result.success) {
      toast.success("Group mapping deleted");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete mapping");
    }
  }

  function getRoleName(rId: string) {
    const role = roles.find((r) => r.id === rId);
    return role ? role.name : rId;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="size-6 text-primary" />
          <CardTitle>Group Mappings</CardTitle>
        </div>
        <CardDescription>
          Map your directory groups (SCIM/SAML claims) to Club organization roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAddMapping} className="flex flex-col md:flex-row gap-4 items-end bg-muted/20 border rounded-lg p-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="groupKey">Directory Group Name / Claim</Label>
            <Input
              id="groupKey"
              value={groupKey}
              onChange={(e) => setGroupKey(e.target.value)}
              placeholder="e.g. engineering-leads"
              disabled={loading}
            />
          </div>
          
          <div className="w-full md:w-56 space-y-1.5">
            <Label htmlFor="mappingRole">Assigned Role</Label>
            <select
              id="mappingRole"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={loading}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading || !groupKey.trim()} className="shrink-0 gap-1.5">
            <Plus className="size-4" />
            Add mapping
          </Button>
        </form>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Directory Group</TableHead>
                <TableHead>Club Role</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">
                    No group mappings configured yet.
                  </TableCell>
                </TableRow>
              ) : (
                initialMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-mono text-sm">{mapping.groupKey}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        {getRoleName(mapping.roleId)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(mapping.id)}
                        className="hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
