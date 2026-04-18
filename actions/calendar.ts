"use server";

import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { canManageCalendar } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { orgCalendarEvents, orgCalendars } from "@/lib/db/schema/calendar";
import { hooksRegistry, initHooks } from "@/lib/hooks";
import { normalizeCalendarRange } from "@/lib/plugins/calendar-validation";

initHooks();

type CalendarWriteInput = {
  orgId: string;
  actorRole: string;
  actorId?: string;
};

function assertCalendarWritePermission(role: string): void {
  if (!canManageCalendar(role)) {
    throw new Error("Only Admins and Leads can manage calendar data.");
  }
}

async function findPrimaryCalendar(orgId: string) {
  return await db.query.orgCalendars.findFirst({
    where: and(eq(orgCalendars.orgId, orgId), eq(orgCalendars.isDefault, true)),
    orderBy: [asc(orgCalendars.createdAt)],
  });
}

export async function ensureCalendarPluginSeed(orgId: string) {
  const existing = await findPrimaryCalendar(orgId);
  if (existing) {
    return existing;
  }

  const inserted = await db
    .insert(orgCalendars)
    .values({
      id: createId(),
      orgId,
      name: "Primary",
      color: "#f97316",
      isDefault: true,
      isVisible: true,
    })
    .returning();

  return inserted[0] ?? null;
}

export async function listOrgCalendars(orgId: string) {
  return await db.query.orgCalendars.findMany({
    where: eq(orgCalendars.orgId, orgId),
    orderBy: [desc(orgCalendars.isDefault), asc(orgCalendars.createdAt)],
  });
}

export async function createOrgCalendar(
  input: CalendarWriteInput & {
    name: string;
    color: string;
  }
) {
  assertCalendarWritePermission(input.actorRole);

  const inserted = await db
    .insert(orgCalendars)
    .values({
      id: createId(),
      orgId: input.orgId,
      name: input.name.trim(),
      color: input.color,
      isDefault: false,
      isVisible: true,
    })
    .returning();

  const created = inserted[0];
  if (!created) {
    throw new Error("Failed to create calendar.");
  }

  await hooksRegistry.emit("calendar:created", {
    orgId: input.orgId,
    calendarId: created.id,
    name: created.name,
    actorId: input.actorId ?? "system",
  });

  return created;
}

export async function updateOrgCalendar(
  input: CalendarWriteInput & {
    calendarId: string;
    name?: string;
    color?: string;
    isVisible?: boolean;
  }
) {
  assertCalendarWritePermission(input.actorRole);

  const updates: Partial<{
    name: string;
    color: string;
    isVisible: boolean;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.color !== undefined) updates.color = input.color;
  if (input.isVisible !== undefined) updates.isVisible = input.isVisible;

  const updated = await db
    .update(orgCalendars)
    .set(updates)
    .where(and(eq(orgCalendars.id, input.calendarId), eq(orgCalendars.orgId, input.orgId)))
    .returning();

  const row = updated[0];
  if (!row) {
    throw new Error("Calendar not found.");
  }

  await hooksRegistry.emit("calendar:updated", {
    orgId: input.orgId,
    calendarId: input.calendarId,
    changes: {
      ...(input.name !== undefined ? { name: updates.name } : {}),
      ...(input.color !== undefined ? { color: updates.color } : {}),
      ...(input.isVisible !== undefined ? { isVisible: updates.isVisible } : {}),
    },
    actorId: input.actorId ?? "system",
  });

  return row;
}

export async function deleteOrgCalendar(
  input: CalendarWriteInput & {
    calendarId: string;
  }
) {
  assertCalendarWritePermission(input.actorRole);

  const existing = await db.query.orgCalendars.findFirst({
    where: and(eq(orgCalendars.id, input.calendarId), eq(orgCalendars.orgId, input.orgId)),
  });

  if (!existing) {
    throw new Error("Calendar not found.");
  }
  if (existing.isDefault) {
    throw new Error("Default calendar cannot be deleted.");
  }

  await db
    .delete(orgCalendars)
    .where(and(eq(orgCalendars.id, input.calendarId), eq(orgCalendars.orgId, input.orgId)));

  await hooksRegistry.emit("calendar:deleted", {
    orgId: input.orgId,
    calendarId: input.calendarId,
    actorId: input.actorId ?? "system",
  });

  return { success: true };
}

export async function listOrgCalendarEvents(orgId: string) {
  return await db
    .select({
      id: orgCalendarEvents.id,
      orgId: orgCalendarEvents.orgId,
      calendarId: orgCalendarEvents.calendarId,
      title: orgCalendarEvents.title,
      description: orgCalendarEvents.description,
      location: orgCalendarEvents.location,
      startTime: orgCalendarEvents.startTime,
      endTime: orgCalendarEvents.endTime,
      isAllDay: orgCalendarEvents.isAllDay,
      createdAt: orgCalendarEvents.createdAt,
      updatedAt: orgCalendarEvents.updatedAt,
      calendarName: orgCalendars.name,
      calendarColor: orgCalendars.color,
      calendarVisible: orgCalendars.isVisible,
    })
    .from(orgCalendarEvents)
    .innerJoin(orgCalendars, eq(orgCalendarEvents.calendarId, orgCalendars.id))
    .where(eq(orgCalendarEvents.orgId, orgId))
    .orderBy(asc(orgCalendarEvents.startTime));
}

export async function createOrgCalendarEvent(
  input: CalendarWriteInput & {
    calendarId: string;
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
  }
) {
  assertCalendarWritePermission(input.actorRole);
  const { start, end } = normalizeCalendarRange(input.startTime, input.endTime);

  const inserted = await db
    .insert(orgCalendarEvents)
    .values({
      id: createId(),
      orgId: input.orgId,
      calendarId: input.calendarId,
      title: input.title.trim(),
      description: input.description ?? null,
      location: input.location ?? null,
      startTime: start,
      endTime: end,
      isAllDay: input.isAllDay,
    })
    .returning();

  const created = inserted[0];
  if (!created) {
    throw new Error("Failed to create calendar event.");
  }

  await hooksRegistry.emit("calendar:event_created", {
    orgId: input.orgId,
    eventId: created.id,
    calendarId: created.calendarId,
    actorId: input.actorId ?? "system",
  });

  return created;
}

export async function updateOrgCalendarEvent(
  input: CalendarWriteInput & {
    eventId: string;
    calendarId?: string;
    title?: string;
    description?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    isAllDay?: boolean;
  }
) {
  assertCalendarWritePermission(input.actorRole);

  const existing = await db.query.orgCalendarEvents.findFirst({
    where: and(eq(orgCalendarEvents.id, input.eventId), eq(orgCalendarEvents.orgId, input.orgId)),
  });

  if (!existing) {
    throw new Error("Calendar event not found.");
  }

  const nextStart = input.startTime ?? existing.startTime;
  const nextEnd = input.endTime ?? existing.endTime;
  normalizeCalendarRange(nextStart, nextEnd);

  const updates: Partial<{
    calendarId: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };

  if (input.calendarId !== undefined) updates.calendarId = input.calendarId;
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description;
  if (input.location !== undefined) updates.location = input.location;
  if (input.startTime !== undefined) updates.startTime = input.startTime;
  if (input.endTime !== undefined) updates.endTime = input.endTime;
  if (input.isAllDay !== undefined) updates.isAllDay = input.isAllDay;

  const updated = await db
    .update(orgCalendarEvents)
    .set(updates)
    .where(and(eq(orgCalendarEvents.id, input.eventId), eq(orgCalendarEvents.orgId, input.orgId)))
    .returning();

  const row = updated[0];
  if (!row) {
    throw new Error("Failed to update calendar event.");
  }

  await hooksRegistry.emit("calendar:event_updated", {
    orgId: input.orgId,
    eventId: row.id,
    calendarId: row.calendarId,
    actorId: input.actorId ?? "system",
  });

  return row;
}

export async function deleteOrgCalendarEvent(
  input: CalendarWriteInput & {
    eventId: string;
  }
) {
  assertCalendarWritePermission(input.actorRole);

  const deleted = await db
    .delete(orgCalendarEvents)
    .where(and(eq(orgCalendarEvents.id, input.eventId), eq(orgCalendarEvents.orgId, input.orgId)))
    .returning();

  const row = deleted[0];
  if (!row) {
    throw new Error("Calendar event not found.");
  }

  await hooksRegistry.emit("calendar:event_deleted", {
    orgId: input.orgId,
    eventId: row.id,
    actorId: input.actorId ?? "system",
  });

  return { success: true };
}

export async function getCalendarEventsByRange(
  orgId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select()
    .from(orgCalendarEvents)
    .where(
      and(
        eq(orgCalendarEvents.orgId, orgId),
        sql`${orgCalendarEvents.startTime} <= ${endTime}`,
        sql`${orgCalendarEvents.endTime} >= ${startTime}`
      )
    )
    .orderBy(asc(orgCalendarEvents.startTime));
}
