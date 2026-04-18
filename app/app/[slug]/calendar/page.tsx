import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth/auth";
import { canManageCalendar } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema/auth";
import { orgPlugins } from "@/lib/db/schema/orgs";
import { listOrgCalendars, listOrgCalendarEvents } from "@/actions/calendar";
import { CalendarPageClient } from "@/components/plugins/calendar/calendar-page";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, org.id), eq(member.userId, session.user.id)),
  });

  if (!membership) {
    redirect("/app");
  }

  const plugin = await db.query.orgPlugins.findFirst({
    where: and(eq(orgPlugins.orgId, org.id), eq(orgPlugins.pluginId, "calendar")),
  });

  if (!plugin?.enabled) {
    redirect(`/app/${slug}/plugins`);
  }

  const [calendars, events] = await Promise.all([
    listOrgCalendars(org.id),
    listOrgCalendarEvents(org.id),
  ]);

  return (
    <CalendarPageClient
      orgId={org.id}
      orgSlug={slug}
      actorRole={membership.role}
      canManageCalendar={canManageCalendar(membership.role)}
      initialCalendars={calendars}
      initialEvents={events}
    />
  );
}
