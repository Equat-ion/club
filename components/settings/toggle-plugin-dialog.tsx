"use client";

import { useState } from "react";
import { togglePlugin, type InstalledPlugin } from "@/actions/plugins";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type TogglePluginDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plugin: InstalledPlugin;
    targetEnabled: boolean;
    orgId: string;
    orgSlug: string;
    onToggled: (newEnabled: boolean) => void;
};

export function TogglePluginDialog({
    open,
    onOpenChange,
    plugin,
    targetEnabled,
    orgId,
    onToggled,
}: TogglePluginDialogProps) {
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        const result = await togglePlugin(orgId, plugin.pluginId, targetEnabled);
        setLoading(false);

        if (result.success) {
            toast.success(
                targetEnabled
                    ? `${plugin.name} enabled`
                    : `${plugin.name} disabled`
            );
            onToggled(targetEnabled);
        } else {
            toast.error(result.error ?? "Failed to update plugin");
            onOpenChange(false);
        }
    }

    const action = targetEnabled ? "Enable" : "Disable";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {action} {plugin.name}?
                    </DialogTitle>
                    <DialogDescription>
                        {targetEnabled
                            ? `This will add ${plugin.name} to the sidebar for all members of your organization.`
                            : `This will hide ${plugin.name} from the sidebar for all members. Your data will be preserved and the plugin can be re-enabled at any time.`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={targetEnabled ? "default" : "destructive"}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? `${action}ing...` : action}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
