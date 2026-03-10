"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { TogglePluginDialog } from "./toggle-plugin-dialog";
import type { InstalledPlugin } from "@/actions/plugins";
import { PLUGINS } from "@/lib/plugins/registry";
import { resolvePluginIcon } from "@/lib/plugins/icon-resolver";

type PluginCardProps = {
    plugin: InstalledPlugin;
    orgId: string;
    orgSlug: string;
    enabledPluginIds: string[];
    onToggled: (pluginId: string, newEnabled: boolean, cascadedIds?: string[]) => void;
};

export function PluginCard({ plugin, orgId, orgSlug, enabledPluginIds, onToggled }: PluginCardProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);

    const registryPlugin = PLUGINS.find((p) => p.id === plugin.pluginId);
    const Icon = registryPlugin ? resolvePluginIcon(registryPlugin.icon) : null;

    function handleSwitchClick() {
        setPendingEnabled(!plugin.enabled);
        setDialogOpen(true);
    }

    function handleDialogClose() {
        setDialogOpen(false);
        setPendingEnabled(null);
    }

    function handleToggled(newEnabled: boolean, cascadedIds?: string[]) {
        onToggled(plugin.pluginId, newEnabled, cascadedIds);
        setDialogOpen(false);
        setPendingEnabled(null);
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {Icon && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-sm font-medium">{plugin.name}</CardTitle>
                                    <Badge variant={plugin.enabled ? "default" : "secondary"} className="text-xs">
                                        {plugin.enabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-mono">
                                        v{plugin.version}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={plugin.enabled}
                            onCheckedChange={handleSwitchClick}
                            aria-label={`${plugin.enabled ? "Disable" : "Enable"} ${plugin.name}`}
                        />
                    </div>
                    <CardDescription className="mt-1 ml-12">{plugin.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-2 ml-12">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                    <Button variant="outline" size="sm" disabled className="gap-1.5">
                                        <Settings className="h-3.5 w-3.5" />
                                        Settings
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>Coming soon</TooltipContent>
                        </Tooltip>
                    </div>
                </CardContent>
            </Card>

            {pendingEnabled !== null && (
                <TogglePluginDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) handleDialogClose();
                    }}
                    plugin={plugin}
                    targetEnabled={pendingEnabled}
                    orgId={orgId}
                    orgSlug={orgSlug}
                    enabledPluginIds={enabledPluginIds}
                    onToggled={handleToggled}
                />
            )}
        </>
    );
}
