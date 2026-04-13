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
    <div className="w-full flex h-screen overflow-hidden items-center justify-center p-4 md:p-8 bg-[url('/org_bg.svg')] bg-cover bg-center bg-fixed antialiased">
      <div className="absolute inset-0 bg-background/75 pointer-events-none"></div>
      <div className="relative max-w-6xl w-full bg-background/90 border-2 border-border flex flex-col md:flex-row overflow-hidden shadow-2xl" style={{ height: 'calc(100vh - 4rem)' }}>
        <OrgSwitcherGrid orgs={orgs} user={session.user} />
      </div>
    </div>
  );

}
