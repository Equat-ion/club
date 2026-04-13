"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Tag, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { createLabel, deleteLabel } from "@/actions/tasks";
import { toast } from "sonner";
import type { Label } from "@/lib/plugins/tasks-types";

const PRESET_COLORS = [
  { name: "Slate", value: "#94a3b8" },
  { name: "Red", value: "#f87171" },
  { name: "Amber", value: "#fbbf24" },
  { name: "Emerald", value: "#34d399" },
  { name: "Sky", value: "#38bdf8" },
  { name: "Violet", value: "#a78bfa" },
  { name: "Pink", value: "#f472b6" },
  { name: "Orange", value: "#fb923c" },
];

interface LabelPickerProps {
  orgId: string;
  availableLabels: Label[];
  selectedLabelIds: string[];
  onSelect: (labelId: string) => void;
  onRemove: (labelId: string) => void;
  isAdmin?: boolean;
}

export function LabelPicker({ 
  orgId, 
  availableLabels, 
  selectedLabelIds, 
  onSelect, 
  onRemove,
  isAdmin = false
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0].value);

  const filteredLabels = useMemo(() => {
    return availableLabels.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  }, [availableLabels, search]);

  const exactMatch = availableLabels.find(l => l.name.toLowerCase() === search.toLowerCase());

  const handleCreateLabel = async () => {
    if (!search.trim()) return;
    
    const res = await createLabel(orgId, { name: search, color: newLabelColor });
    if (res.success) {
      toast.success("Label created");
      onSelect(res.labelId!);
      setSearch("");
      setIsCreating(false);
    } else {
      toast.error(res.error || "Failed to create label");
    }
  };

  const handleDeleteLabel = async (e: React.MouseEvent, labelId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this label? This will remove it from all tasks.")) return;
    
    const res = await deleteLabel(orgId, labelId);
    if (res.success) {
      toast.success("Label deleted");
      if (selectedLabelIds.includes(labelId)) onRemove(labelId);
    } else {
      toast.error(res.error || "Failed to delete label");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5 border border-dashed border-muted-foreground/30 hover:border-solid">
          <Plus className="h-3 w-3" />
          Add label
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search or create label..."
              className="w-full pl-8 pr-2 py-2 text-sm bg-transparent outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !exactMatch && search) {
                  setIsCreating(true);
                }
              }}
            />
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-auto">
          {isCreating ? (
            <div className="p-3 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select color</div>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-full aspect-square rounded-md border-2 transition-all",
                      newLabelColor === color.value ? "border-primary scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewLabelColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={handleCreateLabel}>Create</Button>
              </div>
            </div>
          ) : (
            <div className="py-1">
              {filteredLabels.length > 0 ? (
                filteredLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer transition-colors group"
                      onClick={() => isSelected ? onRemove(label.id) : onSelect(label.id)}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                      <span className="flex-1 text-sm">{label.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                      {isAdmin && (
                        <button 
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5 rounded transition-all"
                          onClick={(e) => handleDeleteLabel(e, label.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No labels found
                </div>
              )}
              
              {!exactMatch && search.trim() && (
                <div 
                  className="mx-1 mt-1 p-2 flex items-center gap-2 text-sm text-primary hover:bg-primary/5 rounded cursor-pointer border border-dashed border-primary/30"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create "{search}"
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
