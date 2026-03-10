"use client";

import { X, ChevronDown, User, Users as UsersIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES, type OrgMember, type Label, type OrgTeam, type TaskFilterState } from "@/lib/plugins/tasks-types";

interface TaskFiltersProps {
  filters: TaskFilterState;
  onFilterChange: (key: keyof TaskFilterState, value: string | null) => void;
  onClearFilters: () => void;
  members: OrgMember[];
  labels: Label[];
  teams: OrgTeam[];
  teamsEnabled: boolean;
}

export function TaskFilters({
  filters,
  onFilterChange,
  onClearFilters,
  members,
  labels,
  teams,
  teamsEnabled,
}: TaskFiltersProps) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterPopover
        label="Status"
        value={filters.status}
        options={TASK_STATUSES.map(s => ({ value: s.value, label: s.label }))}
        onSelect={(val) => onFilterChange("status", val)}
      />

      <FilterPopover
        label="Priority"
        value={filters.priority}
        options={TASK_PRIORITIES.map(p => ({ value: p.value, label: p.label }))}
        onSelect={(val) => onFilterChange("priority", val)}
      />

      <FilterPopover
        label="Assignee"
        value={filters.assignee}
        options={members.map(m => ({ value: m.id, label: m.name }))}
        onSelect={(val) => onFilterChange("assignee", val)}
        icon={<User className="h-3.5 w-3.5 mr-2" />}
      />

      {teamsEnabled && (
        <FilterPopover
          label="Team"
          value={filters.team}
          options={teams.map(t => ({ value: t.id, label: t.name }))}
          onSelect={(val) => onFilterChange("team", val)}
          icon={<UsersIcon className="h-3.5 w-3.5 mr-2" />}
        />
      )}

      <FilterPopover
        label="Label"
        value={filters.label}
        options={labels.map(l => ({ value: l.id, label: l.name }))}
        onSelect={(val) => onFilterChange("label", val)}
        icon={<Tag className="h-3.5 w-3.5 mr-2" />}
      />

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
        >
          Clear filters
          <X className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      )}
    </div>
  );
}

function FilterPopover({
  label,
  value,
  options,
  onSelect,
  icon,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onSelect: (val: string | null) => void;
  icon?: React.ReactNode;
}) {
  const activeOption = options.find(o => o.value === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={value ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "h-8 px-2.5 border-dashed border-muted-foreground/30",
            value && "border-solid bg-secondary/50"
          )}
        >
          {icon}
          {value ? activeOption?.label : label}
          <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-50" />
          {value && (
            <div className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => onSelect(null)}
                className="text-muted-foreground"
              >
                Clear
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => onSelect(option.value)}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
