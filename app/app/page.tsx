import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq } from "drizzle-orm";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import { OrgSwitcherGrid } from "./org-switcher-grid";

async function getUserOrgsWithPlans(userId: string) {
  const memberships = await db.query.member.findMany({
    where: eq(member.userId, userId),
  });

  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organizationId);
  const orgs = await db.query.organization.findMany();
  const profiles = await db.query.orgProfiles.findMany();

  return orgs
    .filter((o) => orgIds.includes(o.id))
    .map((o) => {
      const m = memberships.find((m) => m.organizationId === o.id)!;
      const profile = profiles.find((p) => p.id === o.id);
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo: o.logo,
        role: m.role,
        roleLabel: ROLE_DISPLAY_NAMES[m.role] ?? m.role,
        plan: profile?.plan ?? "free",
      };
    });
}

export default async function OrgSwitcherPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const orgs = await getUserOrgsWithPlans(session.user.id);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Select an organisation to get started, or create a new one.
          </p>
        </div>
        <OrgSwitcherGrid orgs={orgs} />
      </div>
    </div>
  );
}
