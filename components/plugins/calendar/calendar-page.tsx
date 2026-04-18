"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createOrgCalendar,
  createOrgCalendarEvent,
  deleteOrgCalendarEvent,
  listOrgCalendarEvents,
  listOrgCalendars,
  updateOrgCalendar,
  updateOrgCalendarEvent,
} from "@/actions/calendar";

import { CalendarHeader } from "./calendar-header";
import { CalendarSidebar } from "./calendar-sidebar";
import { CreateCalendarDialog } from "./create-calendar-dialog";
import { EntryPopover } from "./entry-popover";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import type { CalendarEventDraft, CalendarEventRecord, CalendarRecord, CalendarViewMode } from "./types";

type CalendarPageClientProps = {
  orgId: string;
  orgSlug: string;
  actorRole: string;
  canManageCalendar: boolean;
  initialCalendars: CalendarRecord[];
  initialEvents: CalendarEventRecord[];
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function CalendarPageClient({
  orgId,
  actorRole,
  canManageCalendar,
  initialCalendars,
  initialEvents,
}: CalendarPageClientProps) {
  const initialStartDate = useMemo(() => new Date(2026, 3, 15), []);
  const initialEndDate = useMemo(() => {
    const end = new Date(initialStartDate);
    end.setHours(end.getHours() + 1);
    return end;
  }, [initialStartDate]);

  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 15));
  const [view, setView] = useState<CalendarViewMode>("week");
  const [calendars, setCalendars] = useState<CalendarRecord[]>(initialCalendars);
  const [events, setEvents] = useState<CalendarEventRecord[]>(initialEvents);
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [isCreateCalendarOpen, setCreateCalendarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventRecord | null>(null);
  const [defaultStartDate, setDefaultStartDate] = useState(initialStartDate);
  const [defaultEndDate, setDefaultEndDate] = useState(initialEndDate);

  const visibleCalendarIds = useMemo(
    () => new Set(calendars.filter((calendar) => calendar.isVisible).map((calendar) => calendar.id)),
    [calendars]
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => visibleCalendarIds.has(event.calendarId)),
    [events, visibleCalendarIds]
  );

  async function refreshCalendarData() {
    const [latestCalendars, latestEvents] = await Promise.all([
      listOrgCalendars(orgId),
      listOrgCalendarEvents(orgId),
    ]);
    setCalendars(latestCalendars as CalendarRecord[]);
    setEvents(latestEvents as CalendarEventRecord[]);
  }

  async function handleToggleCalendar(calendarId: string, isVisible: boolean) {
    const previous = calendars;
    setCalendars((current) =>
      current.map((calendar) =>
        calendar.id === calendarId ? { ...calendar, isVisible } : calendar
      )
    );

    if (!canManageCalendar) {
      return;
    }

    try {
      await updateOrgCalendar({
        orgId,
        actorRole,
        calendarId,
        isVisible,
      });
    } catch {
      setCalendars(previous);
      toast.error("Failed to toggle calendar visibility.");
    }
  }

  async function handleCreateCalendar(name: string, color: string) {
    if (!canManageCalendar) return;

    try {
      await createOrgCalendar({
        orgId,
        actorRole,
        name,
        color,
      });
      await refreshCalendarData();
      toast.success("Calendar created.");
    } catch {
      toast.error("Failed to create calendar.");
    }
  }

  function openDraftPopover(start: Date, end: Date) {
    setSelectedEvent(null);
    setDefaultStartDate(start);
    setDefaultEndDate(end);
    setPopoverOpen(true);
  }

  function handleEventClick(event: CalendarEventRecord) {
    setSelectedEvent(event);
    setDefaultStartDate(toDate(event.startTime));
    setDefaultEndDate(toDate(event.endTime));
    setPopoverOpen(true);
  }

  async function handleSave(draft: CalendarEventDraft) {
    if (!canManageCalendar) {
      return;
    }

    try {
      if (draft.id) {
        await updateOrgCalendarEvent({
          orgId,
          actorRole,
          eventId: draft.id,
          calendarId: draft.calendarId,
          title: draft.title,
          description: draft.description,
          location: draft.location,
          startTime: draft.startTime,
          endTime: draft.endTime,
          isAllDay: draft.isAllDay,
        });
      } else {
        await createOrgCalendarEvent({
          orgId,
          actorRole,
          calendarId: draft.calendarId,
          title: draft.title,
          description: draft.description,
          location: draft.location,
          startTime: draft.startTime,
          endTime: draft.endTime,
          isAllDay: draft.isAllDay,
        });
      }

      await refreshCalendarData();
      toast.success("Event saved.");
    } catch {
      toast.error("Failed to save event.");
    }
  }

  async function handleDelete(eventId: string) {
    if (!canManageCalendar) {
      return;
    }

    try {
      await deleteOrgCalendarEvent({
        orgId,
        actorRole,
        eventId,
      });
      await refreshCalendarData();
      toast.success("Event deleted.");
    } catch {
      toast.error("Failed to delete event.");
    }
  }

  async function handleEventDrop(event: CalendarEventRecord, start: Date, end: Date) {
    if (!canManageCalendar) {
      return;
    }

    try {
      await updateOrgCalendarEvent({
        orgId,
        actorRole,
        eventId: event.id,
        startTime: start,
        endTime: end,
      });
      await refreshCalendarData();
    } catch {
      toast.error("Failed to move event.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row">
      <CalendarSidebar
        calendars={calendars}
        canManageCalendar={canManageCalendar}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onToggleCalendar={handleToggleCalendar}
        onCreateCalendar={() => setCreateCalendarOpen(true)}
      />

      <div className="min-h-0 flex-1">
        <CalendarHeader
          view={view}
          selectedDate={selectedDate}
          canManageCalendar={canManageCalendar}
          onViewChange={setView}
          onToday={() => setSelectedDate(new Date())}
          onPrevious={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + (view === "week" ? -7 : -30));
            setSelectedDate(next);
          }}
          onNext={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + (view === "week" ? 7 : 30));
            setSelectedDate(next);
          }}
          onNewEvent={() => {
            const start = new Date(selectedDate);
            start.setHours(9, 0, 0, 0);
            const end = new Date(start);
            end.setHours(10, 0, 0, 0);
            openDraftPopover(start, end);
          }}
        />

        {view === "week" ? (
          <WeekView
            date={selectedDate}
            events={visibleEvents}
            calendars={calendars}
            canManageCalendar={canManageCalendar}
            onSlotClick={(start, end) => openDraftPopover(start, end)}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
          />
        ) : (
          <MonthView
            date={selectedDate}
            events={visibleEvents}
            calendars={calendars}
            canManageCalendar={canManageCalendar}
            onDayClick={setSelectedDate}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onSlotClick={(start, end) => openDraftPopover(start, end)}
          />
        )}

        <EntryPopover
          open={isPopoverOpen}
          event={selectedEvent}
          calendars={calendars}
          canManageCalendar={canManageCalendar}
          defaultDate={defaultStartDate}
          defaultEndDate={defaultEndDate}
          onOpenChange={setPopoverOpen}
          onSave={handleSave}
          onDelete={handleDelete}
        />

        <CreateCalendarDialog
          open={isCreateCalendarOpen}
          onOpenChange={setCreateCalendarOpen}
          onSubmit={handleCreateCalendar}
        />
      </div>
    </div>
  );
}
