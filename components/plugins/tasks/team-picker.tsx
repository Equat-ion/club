"use client";

import { useState } from "react";
import { Check, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { OrgTeam } from "@/lib/plugins/tasks-types";

interface TeamPickerProps {
  teams: OrgTeam[];
  selectedTeamId: string | null;
  onSelect: (teamId: string | null) => void;
  placeholder?: string;
  variant?: "outline" | "ghost";
}

export function TeamPicker({ 
  teams, 
  selectedTeamId, 
  onSelect, 
  placeholder = "Select team...",
  variant = "outline"
}: TeamPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-start font-normal h-8 px-2 gap-1.5"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Users className="h-4 w-4 text-muted-foreground" />
            {selectedTeam ? selectedTeam.name : placeholder}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teams..." className="h-9" />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" />
                  No team
                </div>
              </CommandItem>
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => {
                    onSelect(team.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedTeamId === team.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {team.name}
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
