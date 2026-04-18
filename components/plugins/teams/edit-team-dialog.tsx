"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTeam } from "@/actions/teams";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Teal", value: "#2dd4bf" },
  { name: "Amber", value: "#fbbf24" },
  { name: "Rose", value: "#fb7185" },
  { name: "Blue", value: "#6366f1" },
  { name: "Green", value: "#4ade80" },
  { name: "Indigo", value: "#818cf8" },
  { name: "Orange", value: "#fb923c" },
  { name: "Purple", value: "#c084fc" },
];

interface EditTeamDialogProps {
  orgId: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamDialog({
  orgId,
  team,
  open,
  onOpenChange,
}: EditTeamDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  const [selectedColor, setSelectedColor] = useState(team.color || PRESET_COLORS[0].value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await updateTeam(orgId, team.id, {
      name,
      description,
      color: selectedColor,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Team updated successfully");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update team");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setName(team.name);
          setDescription(team.description || "");
          setSelectedColor(team.color || PRESET_COLORS[0].value);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update your team&apos;s name, description and color.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g. Marketing, Development"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="What does this team do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Team Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                      selectedColor === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
