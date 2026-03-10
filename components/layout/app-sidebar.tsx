"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { OrgSwitcher } from "./org-switcher";
import { UserNav } from "./user-nav";
import { useOrg } from "@/hooks/use-org";
import { PLUGINS } from "@/lib/plugins/registry";
import { resolvePluginIcon } from "@/lib/plugins/icon-resolver";

type OrgListItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
};

type AppSidebarProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  orgs: OrgListItem[];
  enabledPluginIds: string[];
};

export function AppSidebar({ user, orgs, enabledPluginIds }: AppSidebarProps) {
  const pathname = usePathname();
  const org = useOrg();
  const slug = org.slug;

  const coreNav = [
    {
      title: "Home",
      href: `/app/${slug}/home`,
      icon: Home,
      visible: true,
    },
    {
      title: "Members",
      href: `/app/${slug}/members`,
      icon: Users,
      visible: true,
    },
    {
      title: "Settings",
      href: `/app/${slug}/settings`,
      icon: Settings,
      // Only visible to Admin (owner role)
      visible: org.role === "owner",
    },
  ];

  // Plugin navigation items — filtered by enabled plugins for this org
  const pluginNav = PLUGINS.filter((plugin) =>
    enabledPluginIds.includes(plugin.id)
  ).map((plugin) => ({
    title: plugin.name,
    href: `/app/${slug}/${plugin.slug}`,
    icon: resolvePluginIcon(plugin.icon),
  }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher orgs={orgs} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreNav
                .filter((item) => item.visible)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {pluginNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Plugins</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pluginNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserNav user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
