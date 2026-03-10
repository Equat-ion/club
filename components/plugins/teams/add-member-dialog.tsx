"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addTeamMember, getOrgMembersNotInTeam } from "@/actions/teams";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AvailableMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface AddMemberDialogProps {
  orgId: string;
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({
  orgId,
  teamId,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  useEffect(() => {
    if (open) {
      setAvailableMembers([]);
      setSelectedMemberIds([]);
      const fetchMembers = async () => {
        setFetchingMembers(true);
        try {
          const members = await getOrgMembersNotInTeam(orgId, teamId);
          setAvailableMembers(members);
        } catch (error) {
          toast.error("Failed to fetch members");
        } finally {
          setFetchingMembers(false);
        }
      };
      fetchMembers();
    }
  }, [open, orgId, teamId]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((current) =>
      current.includes(id)
        ? current.filter((i) => i !== id)
        : [...current, id]
    );
  };

  const handleAddMultiple = async () => {
    if (selectedMemberIds.length === 0) return;

    setLoading(true);
    try {
      // Add members sequentially to maintain hook order, or use Promise.all
      const results = await Promise.all(
        selectedMemberIds.map((id) => addTeamMember(orgId, teamId, id))
      );

      const failures = results.filter((r) => !r.success);
      if (failures.length === 0) {
        toast.success(`Successfully added ${selectedMemberIds.length} members`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(`Failed to add ${failures.length} members`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const selectedMembers = availableMembers.filter(m => selectedMemberIds.includes(m.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight">Add Team Members</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select one or more members to join this team.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[450px]">
          <Command className="flex-1 rounded-none border-t border-b">
            <div className="flex items-center border-b px-3">
              <CommandInput 
                placeholder="Search organization members..." 
                className="flex-1 border-none focus:ring-0 h-12 text-sm"
              />
            </div>
            
            <CommandList className="max-h-none h-full overflow-hidden">
               <ScrollArea className="h-full">
                {fetchingMembers ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading members...
                  </div>
                ) : availableMembers.length === 0 ? (
                  <CommandEmpty className="p-8 text-center text-sm text-muted-foreground">
                    No available members found.
                  </CommandEmpty>
                ) : (
                  <CommandGroup className="p-2">
                    {availableMembers.map((member) => (
                      <CommandItem
                        key={member.id}
                        onSelect={() => toggleMember(member.id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors mb-1",
                          selectedMemberIds.includes(member.id) 
                            ? "bg-primary/5 text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={member.image || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {selectedMemberIds.includes(member.id) && (
                            <div className="absolute -right-1 -top-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                              <Check className="h-2 w-2" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm truncate">{member.name}</span>
                          <span className="text-[11px] text-muted-foreground truncate">{member.email}</span>
                        </div>
                        <div className={cn(
                          "h-4 w-4 rounded-sm border transition-colors flex items-center justify-center shrink-0",
                          selectedMemberIds.includes(member.id) 
                            ? "bg-primary border-primary" 
                            : "border-muted-foreground/30"
                        )}>
                          {selectedMemberIds.includes(member.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </ScrollArea>
            </CommandList>
          </Command>

          {/* Selection Status Bar */}
          <div className={cn(
            "px-6 py-3 bg-muted/30 border-b flex items-center justify-between transition-all",
            selectedMemberIds.length === 0 ? "opacity-0 h-0 p-0 overflow-hidden" : "opacity-100 h-auto"
          )}>
            <div className="flex flex-wrap gap-1.5 max-w-[70%]">
              {selectedMembers.slice(0, 3).map(m => (
                <Badge key={m.id} variant="secondary" className="h-6 gap-1 px-1.5 text-[10px] font-medium bg-background border">
                   <Avatar className="h-3.5 w-3.5">
                    <AvatarImage src={m.image || undefined} />
                    <AvatarFallback className="text-[6px]">{m.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {m.name.split(' ')[0]}
                  <button onClick={(e) => { e.stopPropagation(); toggleMember(m.id); }} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              {selectedMemberIds.length > 3 && (
                <Badge variant="outline" className="h-6 text-[10px] bg-background">
                  +{selectedMemberIds.length - 3} more
                </Badge>
              )}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {selectedMemberIds.length} selected
            </span>
          </div>
        </div>

        <DialogFooter className="p-6 bg-background">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddMultiple} 
            disabled={loading || selectedMemberIds.length === 0}
            size="sm"
            className="text-xs font-bold px-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Adding...
              </div>
            ) : (
              `Add ${selectedMemberIds.length} Member${selectedMemberIds.length === 1 ? '' : 's'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
