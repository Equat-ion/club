"use client";

import { format, isSameMonth } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { eventOccursOnDay, getMonthGrid, toDate } from "./calendar-utils";
import type { CalendarEventDraft, CalendarEventRecord, CalendarRecord } from "./types";

type MonthViewProps = {
  date: Date;
  events: CalendarEventRecord[];
  calendars: CalendarRecord[];
  canManageCalendar: boolean;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEventRecord) => void;
  onEventDrop: (event: CalendarEventRecord, start: Date, end: Date) => void;
  onCreateAllDayEvent: (draft: CalendarEventDraft) => void;
};

export function MonthView({
  date,
  events,
  calendars,
  canManageCalendar,
  onDayClick,
  onEventClick,
  onEventDrop,
  onCreateAllDayEvent,
}: MonthViewProps) {
  const days = getMonthGrid(date);
  const calendarMap = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  return (
    <div className="grid h-full grid-cols-7 gap-px border-t bg-border">
      {days.map((day) => {
        const dayEvents = events.filter((event) => eventOccursOnDay(event, day));
        const visible = dayEvents.slice(0, 3);
        const overflow = Math.max(0, dayEvents.length - visible.length);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex min-h-[120px] flex-col gap-1 bg-background p-2",
              !isSameMonth(day, date) && "bg-muted/20",
              canManageCalendar && "cursor-pointer hover:bg-muted/30"
            )}
            onClick={() => onDayClick(day)}
            onDoubleClick={() => {
              if (!canManageCalendar) return;
              const defaultCalendar =
                calendars.find((calendar) => calendar.isDefault) ?? calendars[0];
              if (!defaultCalendar) return;

              const start = new Date(day);
              start.setHours(0, 0, 0, 0);
              const end = new Date(day);
              end.setHours(23, 59, 59, 999);

              onCreateAllDayEvent({
                title: "",
                calendarId: defaultCalendar.id,
                startTime: start,
                endTime: end,
                isAllDay: true,
              });
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold",
                  isSameMonth(day, date) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
            </div>

            <div className="space-y-1">
              {visible.map((event) => {
                const calendar = calendarMap.get(event.calendarId);
                const color = calendar?.color ?? "#f97316";
                return (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full overflow-hidden rounded-sm border px-1.5 py-0.5 text-left text-[10px]"
                    style={{
                      borderColor: `${color}55`,
                      backgroundColor: `${color}22`,
                      color,
                    }}
                    onClick={(mouseEvent) => {
                      mouseEvent.stopPropagation();
                      onEventClick(event);
                    }}
                    onMouseUp={(mouseEvent) => {
                      if (!canManageCalendar) return;
                      if (mouseEvent.button !== 0) return;
                      onEventDrop(event, toDate(event.startTime), toDate(event.endTime));
                    }}
                  >
                    <span className="truncate">{event.title}</span>
                  </button>
                );
              })}
              {overflow > 0 ? (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  +{overflow} more
                </Badge>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
