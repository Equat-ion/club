"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  Plus,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOrg } from "@/hooks/use-org";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import { setActiveOrg } from "@/actions/orgs";

type OrgListItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
};

export function OrgSwitcher({ orgs }: { orgs: OrgListItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeOrg = useOrg();

  // Show up to 5 orgs in dropdown
  const visibleOrgs = orgs.slice(0, 5);
  const hasMore = orgs.length > 5;

  async function handleSwitch(org: OrgListItem) {
    if (org.id === activeOrg.id) return;
    await setActiveOrg(org.id);
    router.push(`/app/${org.slug}/home`);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={activeOrg.orgSwitchingLocked}
            >
              <Avatar className="size-8 rounded-lg">
                {activeOrg.logo && <AvatarImage src={activeOrg.logo} alt={activeOrg.name} />}
                <AvatarFallback className="rounded-lg text-xs">
                  {activeOrg.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeOrg.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_DISPLAY_NAMES[activeOrg.role] ?? activeOrg.role}
                </span>
              </div>
              {!activeOrg.orgSwitchingLocked && <ChevronsUpDown className="ml-auto size-4" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {!activeOrg.orgSwitchingLocked && (
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              {visibleOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitch(org)}
                  className="gap-2 p-2"
                >
                  <Avatar className="size-6 rounded-md">
                    {org.logo && <AvatarImage src={org.logo} alt={org.name} />}
                    <AvatarFallback className="rounded-md text-[10px]">
                      {org.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{org.name}</span>
                  {org.id === activeOrg.id && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              {hasMore && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/app")}
                    className="gap-2 p-2"
                  >
                    <Building2 className="size-4" />
                    <span>View all organizations</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/app?create=true")}
                className="gap-2 p-2"
              >
                <Plus className="size-4" />
                <span>Create organisation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
