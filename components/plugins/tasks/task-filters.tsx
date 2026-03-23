"use client";

import { useState } from "react";
import { X, ChevronDown, User, Users as UsersIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES, type OrgMember, type Label, type OrgTeam, type TaskFilterState } from "@/lib/plugins/tasks-types";
import { Trash2 } from "lucide-react";

interface TaskFiltersProps {
  filters: TaskFilterState;
  onFilterChange: (key: keyof TaskFilterState, value: string | null) => void;
  onClearFilters: () => void;
  canBulkDelete: boolean;
  selectedTaskIds: string[];
  onBulkDeleteSelected: (taskIds: string[]) => Promise<boolean>;
  members: OrgMember[];
  labels: Label[];
  teams: OrgTeam[];
  teamsEnabled: boolean;
}

export function TaskFilters({
  filters,
  onFilterChange,
  onClearFilters,
  canBulkDelete,
  selectedTaskIds,
  onBulkDeleteSelected,
  members,
  labels,
  teams,
  teamsEnabled,
}: TaskFiltersProps) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedTaskCount = selectedTaskIds.length;

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await onBulkDeleteSelected(selectedTaskIds);

      if (success) {
        setConfirmOpen(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <FilterPopover
          label="Status"
          value={filters.status}
          options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          onSelect={(val) => onFilterChange("status", val)}
        />

        <FilterPopover
          label="Priority"
          value={filters.priority}
          options={TASK_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
          onSelect={(val) => onFilterChange("priority", val)}
        />

        <FilterPopover
          label="Assignee"
          value={filters.assignee}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
          onSelect={(val) => onFilterChange("assignee", val)}
          icon={<User className="mr-2 h-3.5 w-3.5" />}
        />

        {teamsEnabled && (
          <FilterPopover
            label="Team"
            value={filters.team}
            options={teams.map((t) => ({ value: t.id, label: t.name }))}
            onSelect={(val) => onFilterChange("team", val)}
            icon={<UsersIcon className="mr-2 h-3.5 w-3.5" />}
          />
        )}

        <FilterPopover
          label="Label"
          value={filters.label}
          options={labels.map((l) => ({ value: l.id, label: l.name }))}
          onSelect={(val) => onFilterChange("label", val)}
          icon={<Tag className="mr-2 h-3.5 w-3.5" />}
        />

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={onClearFilters}
          >
            Clear filters
            <X className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {canBulkDelete && selectedTaskCount > 0 && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="ml-auto h-8 gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedTaskCount})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected tasks?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedTaskCount} selected task
                {selectedTaskCount === 1 ? "" : "s"} and all associated comments
                and activity. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirmDelete();
                }}
              >
                {isDeleting ? "Deleting..." : "Delete tasks"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
