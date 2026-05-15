"use client";

import { format, isSameMonth, isWithinInterval, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";
import { useState } from "react";

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
  onSlotClick: (start: Date, end: Date) => void;
};

export function MonthView({
  date,
  events,
  calendars,
  canManageCalendar,
  onDayClick,
  onEventClick,
  onEventDrop,
  onSlotClick,
}: MonthViewProps) {
  const days = getMonthGrid(date);
  const calendarMap = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  const [dragState, setDragState] = useState<{ startDay: Date; currentDay: Date } | null>(null);

  const handleMouseDown = (day: Date, mouseEvent: React.MouseEvent<HTMLDivElement>) => {
    if (!canManageCalendar) return;
    if (mouseEvent.button !== 0) return; // Only left click
    // Optional: avoid starting drag if clicking on an event
    if ((mouseEvent.target as HTMLElement).closest("button")) return;
    setDragState({ startDay: day, currentDay: day });
  };

  const handleMouseEnter = (day: Date) => {
    if (!dragState) return;
    setDragState((prev) => prev ? { ...prev, currentDay: day } : null);
  };

  const handleMouseUp = () => {
    if (!dragState) return;
    const defaultCalendar = calendars.find((calendar) => calendar.isDefault) ?? calendars[0];
    if (!defaultCalendar) {
      setDragState(null);
      return;
    }

    const start = isBefore(dragState.startDay, dragState.currentDay) ? dragState.startDay : dragState.currentDay;
    const end = isAfter(dragState.currentDay, dragState.startDay) ? dragState.currentDay : dragState.startDay;

    const startTime = startOfDay(start);
    const endTime = endOfDay(end);

    onSlotClick(startTime, endTime);

    setDragState(null);
  };

  return (
    <div
      className="grid h-full grid-cols-7 gap-px border-t bg-border select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {days.map((day) => {
        const dayEvents = events.filter((event) => eventOccursOnDay(event, day));
        const visible = dayEvents.slice(0, 3);
        const overflow = Math.max(0, dayEvents.length - visible.length);

        const isSelected = dragState && isWithinInterval(day, {
          start: isBefore(dragState.startDay, dragState.currentDay) ? dragState.startDay : dragState.currentDay,
          end: isAfter(dragState.currentDay, dragState.startDay) ? dragState.currentDay : dragState.startDay,
        });

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex min-h-[120px] flex-col gap-1 p-2",
              !isSameMonth(day, date) ? "bg-muted/20" : "bg-background",
              canManageCalendar && "cursor-pointer hover:bg-muted/30",
              isSelected && "bg-primary/20"
            )}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              onDayClick(day);
            }}
            onMouseDown={(e) => handleMouseDown(day, e)}
            onMouseEnter={() => handleMouseEnter(day)}
            onDragOver={(e) => {
              if (!canManageCalendar) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              if (!canManageCalendar) return;
              e.preventDefault();
              const eventData = e.dataTransfer.getData("application/json");
              if (!eventData) return;
              
              try {
                const droppedEvent = JSON.parse(eventData) as CalendarEventRecord;
                const oldStart = toDate(droppedEvent.startTime);
                const oldEnd = toDate(droppedEvent.endTime);
                
                // Keep the same duration, just move the start day
                const duration = oldEnd.getTime() - oldStart.getTime();
                const newStart = new Date(day);
                newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds(), oldStart.getMilliseconds());
                const newEnd = new Date(newStart.getTime() + duration);
                
                onEventDrop(droppedEvent, newStart, newEnd);
              } catch (err) {
                console.error("Failed to parse dropped event", err);
              }
            }}
          >
            <div className="flex items-center justify-between pointer-events-none">
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
                    draggable={canManageCalendar}
                    onDragStart={(e) => {
                      if (!canManageCalendar) return;
                      e.dataTransfer.setData("application/json", JSON.stringify(event));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="w-full overflow-hidden rounded-sm border px-1.5 py-0.5 text-left text-[10px] cursor-grab active:cursor-grabbing"
                    style={{
                      borderColor: `${color}55`,
                      backgroundColor: `${color}22`,
                      color,
                    }}
                    onClick={(mouseEvent) => {
                      mouseEvent.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <span className="truncate pointer-events-none">{event.title}</span>
                  </button>
                );
              })}
              {overflow > 0 ? (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] pointer-events-none">
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
