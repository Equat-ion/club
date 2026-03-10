"use client";

import { useState } from "react";
import { togglePlugin, type InstalledPlugin } from "@/actions/plugins";
import { getMissingDependencies } from "@/lib/plugins/registry";
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
    /** Currently-enabled plugin IDs for this org — used to compute dep cascade. */
    enabledPluginIds: string[];
    onToggled: (newEnabled: boolean, cascadedIds?: string[]) => void;
};

export function TogglePluginDialog({
    open,
    onOpenChange,
    plugin,
    targetEnabled,
    orgId,
    enabledPluginIds,
    onToggled,
}: TogglePluginDialogProps) {
    const [loading, setLoading] = useState(false);

    // Compute which hard deps are missing (enable path only).
    const missingDeps = targetEnabled
        ? getMissingDependencies(plugin.pluginId, enabledPluginIds)
        : [];

    async function handleConfirm() {
        setLoading(true);
        const result = await togglePlugin(orgId, plugin.pluginId, targetEnabled);
        setLoading(false);

        if (result.success) {
            if (result.cascaded?.length) {
                toast.success(
                    `${plugin.name} enabled along with: ${result.cascaded.join(", ")}`
                );
            } else {
                toast.success(
                    targetEnabled
                        ? `${plugin.name} enabled`
                        : `${plugin.name} disabled`
                );
            }

            // Pass dep IDs (from local missingDeps) so parent can optimistically flip them
            onToggled(targetEnabled, missingDeps.map((d) => d.id));
            onOpenChange(false);
        } else {
            if (result.blockedBy?.length) {
                toast.error(
                    `Cannot disable ${plugin.name} — ${result.blockedBy.join(" and ")} depend${result.blockedBy.length === 1 ? "s" : ""} on it.`
                );
            } else {
                toast.error(result.error ?? "Failed to update plugin");
            }
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
                    <DialogDescription asChild>
                        <div className="space-y-3">
                            {targetEnabled ? (
                                missingDeps.length > 0 ? (
                                    <>
                                        <p>
                                            Enabling <strong>{plugin.name}</strong> will also
                                            enable the following plugins it depends on:
                                        </p>
                                        <ul className="ml-4 list-disc space-y-1 text-sm">
                                            {missingDeps.map((dep) => (
                                                <li key={dep.id} className="font-medium text-foreground">
                                                    {dep.name}
                                                    <span className="ml-1 font-normal text-muted-foreground">
                                                        — {dep.description}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-sm">
                                            These plugins will be added to the sidebar for all
                                            members of your organization.
                                        </p>
                                    </>
                                ) : (
                                    <p>
                                        This will add{" "}
                                        <strong>{plugin.name}</strong> to the sidebar for
                                        all members of your organization.
                                    </p>
                                )
                            ) : (
                                <p>
                                    This will hide <strong>{plugin.name}</strong> from the
                                    sidebar for all members. Your data will be preserved
                                    and the plugin can be re-enabled at any time.
                                </p>
                            )}
                        </div>
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
                        {loading
                            ? `${action}ing...`
                            : missingDeps.length > 0
                                ? `Enable all (${missingDeps.length + 1})`
                                : action}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
