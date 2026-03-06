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
import type { InstalledPlugin } from "@/actions/plugins";

/**
 * Formats a plugin installation date for display in the management table.
 */
function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

/**
 * Props for a single plugin row in the plugin management table.
 */
type PluginRowProps = {
    plugin: InstalledPlugin;
    orgId: string;
    orgSlug: string;
    onToggled: (pluginId: string, newEnabled: boolean) => void;
};

/**
 * Renders one plugin row with details, settings placeholder, and enable switch.
 */
function PluginRow({ plugin, orgId, orgSlug, onToggled }: PluginRowProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);

    const registryPlugin = PLUGINS.find((p) => p.id === plugin.pluginId);
    const Icon = registryPlugin?.icon;

    /**
     * Opens the toggle confirmation dialog with the opposite enabled state.
     */
    function handleSwitchClick() {
        setPendingEnabled(!plugin.enabled);
        setDialogOpen(true);
    }

    /**
     * Applies a confirmed toggle result to parent state and resets local dialog state.
     */
    function handleToggled(newEnabled: boolean) {
        onToggled(plugin.pluginId, newEnabled);
        setDialogOpen(false);
        setPendingEnabled(null);
    }

    return (
        <>
            <TableRow>
                {/* Name — icon + plugin name, no header text */}
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

                {/* Settings button + Switch — no header */}
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
                    onToggled={handleToggled}
                />
            )}
        </>
    );
}

/**
 * Props for the plugin management table and its initial plugin data.
 */
type PluginManagementProps = {
    initialPlugins: InstalledPlugin[];
    orgId: string;
    orgSlug: string;
};

/**
 * Displays installed plugins for an organization and handles optimistic toggle updates.
 */
export function PluginManagement({ initialPlugins, orgId, orgSlug }: PluginManagementProps) {
    const [plugins, setPlugins] = useState<InstalledPlugin[]>(initialPlugins);

    /**
     * Updates local plugin state after a toggle is confirmed in a child row dialog.
     */
    function handleToggled(pluginId: string, newEnabled: boolean) {
        setPlugins((prev) =>
            prev.map((p) => (p.pluginId === pluginId ? { ...p, enabled: newEnabled } : p))
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
