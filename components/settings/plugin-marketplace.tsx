"use client";

import { useState } from "react";
import { Package, Plus, Settings, Layers } from "lucide-react";
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
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TogglePluginDialog } from "./toggle-plugin-dialog";
import { PLUGINS, type Plugin, getTransitiveDependencies } from "@/lib/plugins/registry";
import { resolvePluginIcon } from "@/lib/plugins/icon-resolver";
import { installPlugin, type InstalledPlugin } from "@/actions/plugins";
import { toast } from "sonner";

// ============================================================================
// Shared Utilities
// ============================================================================

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

const PLAN_TO_LABEL: Record<string, string> = {
    free: "Free",
    plus: "Plus",
    enterprise: "Enterprise",
};

// ============================================================================
// Top Section: Installed Plugin Row
// ============================================================================

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

// ============================================================================
// Bottom Section: Marketplace Plugin Card
// ============================================================================

type MarketplaceCardProps = {
    plugin: Plugin;
    orgId: string;
    isInstalled: boolean;
    isLocked: boolean; // Plan requirement not met
    onInstalled: (pluginId: string, cascadedNames?: string[]) => void;
    installedPluginIds: string[];
};

function MarketplaceCard({ plugin, orgId, isInstalled, isLocked, onInstalled, installedPluginIds }: MarketplaceCardProps) {
    const [installing, setInstalling] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const Icon = resolvePluginIcon(plugin.icon);

    // Filter to only those dependencies that actually need to be installed now
    const dependencies = getTransitiveDependencies(plugin.id);
    const missingDepsToInstall = dependencies.filter(p => !installedPluginIds.includes(p.id));
    const missingDepNames = missingDepsToInstall.map(d => d.name);

    async function handleInstallConfirm() {
        setInstalling(true);
        const result = await installPlugin(orgId, plugin.id);
        setInstalling(false);
        setConfirmOpen(false);

        if (result.success) {
            toast.success(`${plugin.name} installed successfully.`);
            onInstalled(plugin.id, result.cascaded);
        } else {
            toast.error(result.error ?? "Failed to install plugin.");
        }
    }

    function handleInstallClick() {
        // If there are dependencies that need installing, open modal
        if (missingDepsToInstall.length > 0) {
            setConfirmOpen(true);
        } else {
            // Otherwise just install immediately
            handleInstallConfirm();
        }
    }

    // Determine the highest plan required
    const requiredPlanLabel = PLAN_TO_LABEL[plugin.plans[plugin.plans.length - 1] ?? "free"];

    return (
        <>
            <Card className={`flex flex-col h-full ${isLocked ? "bg-muted/30 opacity-80" : ""}`}>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {isInstalled ? (
                                <Badge variant="secondary" className="px-2 font-medium">
                                    Installed
                                </Badge>
                            ) : isLocked ? (
                                <Badge variant="outline" className="px-2 font-medium bg-background text-muted-foreground line-through decoration-muted-foreground">
                                    Upgrade to {requiredPlanLabel}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-2 font-medium">
                                    Free
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="mt-4">
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <CardDescription className="mt-1.5 line-clamp-2">
                            {plugin.description}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="flex-1">
                    {plugin.dependencies && plugin.dependencies.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground mr-1">Requires:</span>
                            {plugin.dependencies.map(depId => {
                                const dep = PLUGINS.find(p => p.id === depId);
                                return dep ? (
                                    <Badge key={dep.id} variant="secondary" className="text-[10px] uppercase font-semibold">
                                        {dep.name}
                                    </Badge>
                                ) : null;
                            })}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-4 border-t">
                    <Button
                        variant={isInstalled ? "outline" : "default"}
                        className="w-full"
                        disabled={isInstalled || isLocked || installing}
                        onClick={handleInstallClick}
                    >
                        {installing ? "Installing..." : isInstalled ? "Already Installed" : "Install"}
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Install {plugin.name}</DialogTitle>
                        <DialogDescription>
                            This plugin requires additional tools to function properly.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Card className="bg-muted/40 shadow-none border-dashed">
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-sm">Additional Dependencies</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    The following plugins will also be installed:
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <ul className="space-y-2">
                                    {missingDepsToInstall.map(dep => {
                                        const DepIcon = resolvePluginIcon(dep.icon);
                                        return (
                                            <li key={dep.id} className="flex items-center gap-2 text-sm">
                                                <DepIcon className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{dep.name}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={installing}>
                            Cancel
                        </Button>
                        <Button onClick={handleInstallConfirm} disabled={installing}>
                            {installing ? "Installing..." : "Accept & Install"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ============================================================================
// Main Marketplace Container
// ============================================================================

type PluginMarketplaceProps = {
    initialPlugins: InstalledPlugin[];
    orgId: string;
    orgSlug: string;
    plan: string;
};

export function PluginMarketplace({ initialPlugins, orgId, orgSlug, plan }: PluginMarketplaceProps) {
    const [plugins, setPlugins] = useState<InstalledPlugin[]>(initialPlugins);

    const installedPluginIds = plugins.map((p) => p.pluginId);
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

    // Handles optimistic update from MarketplaceCard
    function handleInstalled(pluginId: string, cascadedNames?: string[]) {
        // Technically, a full refresh or server action returning the actual row is better,
        // but since we want optimistic inline updates matching the registry model:

        const targetPlugin = PLUGINS.find(p => p.id === pluginId);
        if (!targetPlugin) return;

        const newInstalled: InstalledPlugin[] = [];

        // Insert new dependencies ideally
        if (cascadedNames && cascadedNames.length > 0) {
            const deps = getTransitiveDependencies(pluginId);
            deps.forEach(dep => {
                if (!installedPluginIds.includes(dep.id)) {
                    newInstalled.push({
                        rowId: `temp-${dep.id}`, // Placeholder
                        pluginId: dep.id,
                        name: dep.name,
                        description: dep.description,
                        slug: dep.slug,
                        enabled: true, // It cascades safely to enabled: true 
                        category: dep.category,
                        version: dep.version,
                        createdAt: new Date()
                    });
                }
            });
        }

        // Insert target plugin
        if (!installedPluginIds.includes(pluginId)) {
            newInstalled.push({
                rowId: `temp-${pluginId}`,
                pluginId,
                name: targetPlugin.name,
                description: targetPlugin.description,
                slug: targetPlugin.slug,
                enabled: true,
                category: targetPlugin.category,
                version: targetPlugin.version,
                createdAt: new Date()
            });
        }

        setPlugins(prev => [...prev, ...newInstalled]);
    }

    return (
        <div className="space-y-12">

            {/* Installed Plugins Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Installed Tools</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage active features for your organization.
                        </p>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Installed</TableHead>
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
                                            <span className="text-sm">No plugins installed. Browse below to get started.</span>
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

            {/* Marketplace Grid */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold">Discover</h2>
                    <p className="text-sm text-muted-foreground">
                        Expand your organization's capabilities with new tools.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PLUGINS.map(plugin => {
                        const isInstalled = plugins.some(p => p.pluginId === plugin.id);
                        const isLocked = !plugin.plans.includes(plan as any);

                        return (
                            <MarketplaceCard
                                key={plugin.id}
                                plugin={plugin}
                                orgId={orgId}
                                isInstalled={isInstalled}
                                isLocked={isLocked}
                                onInstalled={handleInstalled}
                                installedPluginIds={installedPluginIds}
                            />
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
