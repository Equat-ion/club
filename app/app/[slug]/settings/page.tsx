import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import {
  orgProfiles,
  orgRoles,
  enterpriseGroupMappings,
  enterpriseConnections,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { SettingsContent } from "@/components/settings/settings-content";
import type { SSOProviderSummary } from "@/lib/auth/sso";
import { getEnterpriseReviewQueue } from "@/actions/enterprise";
import { getSessionOrgAccess } from "@/lib/auth/session";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Load org
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id),
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  const access = await getSessionOrgAccess(org.id);
  if (!access.effectivePermissions.includes("settings.manage")) {
    redirect(`/app/${slug}`);
  }

  let initialSSOProviders: SSOProviderSummary[] = [];
  try {
    const providersResponse = await auth.api.listSSOProviders({
      headers: await headers(),
    });
    initialSSOProviders = providersResponse.providers.filter(
      (provider) => provider.organizationId === org.id,
    );
  } catch {
    initialSSOProviders = [];
  }

  // Query enterprise mode status
  const profile = await db.query.orgProfiles.findFirst({
    where: eq(orgProfiles.id, org.id),
  });
  const enterpriseModeEnabled = profile?.enterpriseModeEnabled ?? false;

  // Query roles
  const roles = await db.select()
    .from(orgRoles)
    .where(eq(orgRoles.orgId, org.id));
  const roleOptions = roles.map((r) => ({
    id: r.id,
    name: r.name,
    key: r.key,
  }));

  // Query mappings
  const mappings = await db.select()
    .from(enterpriseGroupMappings)
    .where(eq(enterpriseGroupMappings.orgId, org.id));
  const initialMappings = mappings.map((m) => ({
    id: m.id,
    groupKey: m.groupKey,
    roleId: m.roleId,
  }));

  // Query review queue
  const initialReviewQueue = await getEnterpriseReviewQueue(org.id);

  // Query SCIM connection details
  const conn = await db.query.enterpriseConnections.findFirst({
    where: eq(enterpriseConnections.orgId, org.id),
  });
  const scimProviderId = conn?.scimProviderId ?? undefined;
  const scimTokenLastFour = conn?.scimTokenLastFour ?? undefined;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 w-full">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization settings.
        </p>
      </div>
      <SettingsContent
        orgId={org.id}
        orgSlug={slug}
        orgName={org.name}
        orgLogo={org.logo ?? null}
        initialSSOProviders={initialSSOProviders}
        enterpriseModeEnabled={enterpriseModeEnabled}
        roles={roleOptions}
        initialMappings={initialMappings}
        initialReviewQueue={initialReviewQueue}
        scimProviderId={scimProviderId}
        scimTokenLastFour={scimTokenLastFour}
      />
    </div>
  );
}
