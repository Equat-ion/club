"use client";

import { isSameDay } from "date-fns";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  calculateOverlappingColumns,
  getEventMinutesForDay,
  getWeekRange,
  toDate,
} from "./calendar-utils";
import { CalendarEntry } from "./calendar-entry";
import type { CalendarEventDraft, CalendarEventRecord, CalendarRecord } from "./types";

const HOUR_HEIGHT = 56;
const DAY_START_MINUTES = 0;
const DAY_END_MINUTES = 24 * 60;

type WeekViewProps = {
  date: Date;
  events: CalendarEventRecord[];
  calendars: CalendarRecord[];
  canManageCalendar: boolean;
  onSlotClick: (start: Date, end: Date) => void;
  onEventClick: (event: CalendarEventRecord) => void;
  onEventDrop: (event: CalendarEventRecord, start: Date, end: Date) => void;
  onCreateEvent: (draft: CalendarEventDraft) => void;
};

function minutesToPixels(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function WeekView({
  date,
  events,
  calendars,
  canManageCalendar,
  onSlotClick,
  onEventClick,
  onEventDrop,
  onCreateEvent,
}: WeekViewProps) {
  const { days } = getWeekRange(date);

  const calendarMap = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b bg-background px-2 py-2">
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="px-2 text-center text-xs font-semibold text-muted-foreground">
            {day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
          </div>
        ))}
      </div>

      <ScrollArea className="h-full">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] px-2">
          <div className="border-r">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className="relative border-b text-right text-[10px] text-muted-foreground"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2 right-2 bg-background px-1">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = events.filter((event) => {
              const eventStart = toDate(event.startTime);
              return isSameDay(eventStart, day);
            });

            const overlapInput = dayEvents.map((event) => ({
              id: event.id,
              start: toDate(event.startTime),
              end: toDate(event.endTime),
            }));

            const columns = calculateOverlappingColumns(overlapInput);

            return (
              <div
                key={day.toISOString()}
                className="relative border-r"
                style={{ height: `${24 * HOUR_HEIGHT}px` }}
                onDoubleClick={(mouseEvent) => {
                  if (!canManageCalendar) return;
                  const target = mouseEvent.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const y = mouseEvent.clientY - rect.top;
                  const rawMinutes = (y / HOUR_HEIGHT) * 60;
                  const snappedMinutes = clamp(Math.round(rawMinutes / 15) * 15, 0, 23 * 60 + 45);

                  const start = new Date(day);
                  start.setHours(0, snappedMinutes, 0, 0);
                  const end = new Date(start);
                  end.setMinutes(end.getMinutes() + 60);
                  onSlotClick(start, end);
                }}
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border-b"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {columns.map((column) => {
                  const event = dayEvents.find((item) => item.id === column.id);
                  if (!event) return null;

                  const { startMinutes, endMinutes } = getEventMinutesForDay(event, day);
                  const top = minutesToPixels(clamp(startMinutes, DAY_START_MINUTES, DAY_END_MINUTES));
                  const bottom = minutesToPixels(
                    clamp(endMinutes, DAY_START_MINUTES + 15, DAY_END_MINUTES)
                  );
                  const height = Math.max(18, bottom - top);

                  const widthPercent = 100 / column.totalColumns;
                  const leftPercent = column.column * widthPercent;

                  const calendar = calendarMap.get(event.calendarId);
                  const color = calendar?.color ?? "#f97316";

                  return (
                    <CalendarEntry
                      key={event.id}
                      event={event}
                      color={color}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                      }}
                      onClick={() => onEventClick(event)}
                      onDragStart={canManageCalendar ? () => onEventDrop(event, toDate(event.startTime), toDate(event.endTime)) : undefined}
                      onResizeStart={undefined}
                      isDragging={false}
                      isResizing={false}
                    />
                  );
                })}

                {!canManageCalendar ? (
                  <div className={cn("pointer-events-none absolute inset-0 bg-transparent")} />
                ) : null}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
