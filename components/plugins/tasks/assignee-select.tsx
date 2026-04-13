"use client";

import { useState } from "react";
import { Check, ChevronDown, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { OrgMember } from "@/lib/plugins/tasks-types";

interface AssigneeSelectProps {
  members: OrgMember[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  variant?: "outline" | "ghost";
}

export function AssigneeSelect({ 
  members, 
  value, 
  onChange, 
  disabled = false,
  variant = "outline"
}: AssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedMember = members.find(m => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-auto justify-start font-normal h-8 px-2 gap-1.5",
            variant === "ghost" && "hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            {selectedMember ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedMember.image || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {selectedMember.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedMember.name}</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Unassigned</span>
              </>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members..." className="h-9" />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  Unassigned
                </div>
              </CommandItem>
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.name}
                  onSelect={() => {
                    onChange(member.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{member.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
