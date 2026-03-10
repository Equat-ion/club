"use client";

import { useState } from "react";
import { Package, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { TogglePluginDialog } from "./toggle-plugin-dialog";
import { PLUGINS } from "@/lib/plugins/registry";
import { resolvePluginIcon } from "@/lib/plugins/icon-resolver";
import type { InstalledPlugin } from "@/actions/plugins";

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

type PluginRowProps = {
    plugin: InstalledPlugin;
    orgId: string;
    orgSlug: string;
    enabledPluginIds: string[];
    onToggled: (pluginId: string, newEnabled: boolean, cascadedIds?: string[]) => void;
};

function PluginRow({ plugin, orgId, orgSlug, enabledPluginIds, onToggled }: PluginRowProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);

    const registryPlugin = PLUGINS.find((p) => p.id === plugin.pluginId);
    const Icon = registryPlugin ? resolvePluginIcon(registryPlugin.icon) : null;

    function handleSwitchClick() {
        setPendingEnabled(!plugin.enabled);
        setDialogOpen(true);
    }

    function handleToggled(newEnabled: boolean, cascadedIds?: string[]) {
        onToggled(plugin.pluginId, newEnabled, cascadedIds);
        setDialogOpen(false);
        setPendingEnabled(null);
    }

    return (
        <>
            <TableRow>
                {/* Name — icon + plugin name */}
                <TableCell>
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-sm font-medium">{plugin.name}</span>
                    </div>
                </TableCell>

                {/* Description */}
                <TableCell className="text-sm text-muted-foreground">
                    {plugin.description}
                </TableCell>

                {/* Installed date */}
                <TableCell className="text-sm text-muted-foreground">
                    {formatDate(plugin.createdAt)}
                </TableCell>

                {/* Settings button + Switch */}
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled>
                                        <Settings className="h-4 w-4" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>Coming soon</TooltipContent>
                        </Tooltip>
                        <Switch
                            checked={plugin.enabled}
                            onCheckedChange={handleSwitchClick}
                            aria-label={`${plugin.enabled ? "Disable" : "Enable"} ${plugin.name}`}
                        />
                    </div>
                </TableCell>
            </TableRow>

            {pendingEnabled !== null && (
                <TogglePluginDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDialogOpen(false);
                            setPendingEnabled(null);
                        }
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

type PluginManagementProps = {
    initialPlugins: InstalledPlugin[];
    orgId: string;
    orgSlug: string;
};

export function PluginManagement({ initialPlugins, orgId, orgSlug }: PluginManagementProps) {
    const [plugins, setPlugins] = useState<InstalledPlugin[]>(initialPlugins);

    const enabledPluginIds = plugins.filter((p) => p.enabled).map((p) => p.pluginId);

    function handleToggled(pluginId: string, newEnabled: boolean, cascadedIds?: string[]) {
        setPlugins((prev) =>
            prev.map((p) => {
                if (p.pluginId === pluginId) return { ...p, enabled: newEnabled };
                // Also flip any deps that were auto-enabled as a cascade
                if (newEnabled && cascadedIds?.includes(p.pluginId)) return { ...p, enabled: true };
                return p;
            })
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold">Plugins</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage the tools available to your organization.
                    </p>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0}>
                            <Button variant="outline" size="sm" disabled className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Install Plugins
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Installed</TableHead>
                            {/* no header for actions column */}
                            <TableHead className="w-28" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plugins.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Package className="h-6 w-6 opacity-50" />
                                        <span className="text-sm">No plugins installed</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            plugins.map((plugin) => (
                                <PluginRow
                                    key={plugin.pluginId}
                                    plugin={plugin}
                                    orgId={orgId}
                                    orgSlug={orgSlug}
                                    enabledPluginIds={enabledPluginIds}
                                    onToggled={handleToggled}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
