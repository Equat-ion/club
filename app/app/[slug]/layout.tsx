import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgProfiles, orgPlugins } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { OrgProvider, type OrgData } from "@/hooks/use-org";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getSessionOrgAccess } from "@/lib/auth/session";

async function getOrgData(slug: string, userId: string) {
  // Load the org by slug
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) return null;

  // Check that the user is a member
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, userId),
    ),
  });

  if (!membership) return null;

  // Load org profile for plan info
  const profile = await db.query.orgProfiles.findFirst({
    where: eq(orgProfiles.id, org.id),
  });

  // Load enabled plugins for this org
  const enabledPlugins = await db.query.orgPlugins.findMany({
    where: and(
      eq(orgPlugins.orgId, org.id),
      eq(orgPlugins.enabled, true),
    ),
  });

  // Get effective permissions and enterprise lock state
  const access = await getSessionOrgAccess(org.id);

  return {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      plan: profile?.plan ?? "free",
      role: membership.role,
      memberId: membership.id,
      orgSwitchingLocked: access.orgSwitchingLocked,
      permissions: access.effectivePermissions,
    } satisfies OrgData,
    enabledPluginIds: enabledPlugins.map((p) => p.pluginId),
  };
}

async function getUserOrgs(userId: string) {
  const memberships = await db.query.member.findMany({
    where: eq(member.userId, userId),
  });

  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organizationId);
  const orgs = await db.query.organization.findMany();

  return orgs
    .filter((o) => orgIds.includes(o.id))
    .map((o) => {
      const m = memberships.find((m) => m.organizationId === o.id)!;
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo: o.logo,
        role: m.role,
      };
    });
}

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await getOrgData(slug, session.user.id);

  if (!data) {
    notFound();
  }

  // Set active org in session (fire and forget — non-blocking)
  auth.api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId: data.org.id },
  });

  const orgs = await getUserOrgs(session.user.id);

  return (
    <OrgProvider org={data.org}>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        orgs={orgs}
        enabledPluginIds={data.enabledPluginIds}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumb />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </OrgProvider>
  );
}
