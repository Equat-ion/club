"use client";

import { User, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { OrgMember } from "@/lib/plugins/tasks-types";

export function AssigneeSelect({
  value,
  onValueChange,
  members,
  disabled,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  members: OrgMember[];
  disabled?: boolean;
}) {
  const selectedMember = members.find((m) => m.id === value);

  return (
    <div className="flex items-center gap-1">
      <Select
        value={value ?? "unassigned"}
        onValueChange={(v) => onValueChange(v === "unassigned" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {selectedMember ? (
              <span className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedMember.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedMember.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Unassigned</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Unassigned</span>
            </span>
          </SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              <span className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={m.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {m.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{m.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onValueChange(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
