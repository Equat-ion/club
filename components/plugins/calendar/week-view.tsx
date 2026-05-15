"use client";

import { isSameDay } from "date-fns";
import { useRef, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

import {
  calculateOverlappingColumns,
  getEventMinutesForDay,
  getWeekRange,
  toDate,
} from "./calendar-utils";
import { CalendarEntry } from "./calendar-entry";
import type { CalendarEventRecord, CalendarRecord } from "./types";

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
};

function minutesToPixels(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function WeekView({
  date,
  events,
  calendars,
  canManageCalendar,
  onSlotClick,
  onEventClick,
  onEventDrop,
}: WeekViewProps) {
  const { days } = getWeekRange(date);
  const calendarMap = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  const [dragState, setDragState] = useState<{ day: Date; startMinutes: number; currentMinutes: number } | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<{ event: CalendarEventRecord; offsetMinutes: number } | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{
    event: CalendarEventRecord;
    day: Date;
    edge: "top" | "bottom";
    anchorMinutes: number;
    currentMinutes: number;
  } | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [hoveredMinutes, setHoveredMinutes] = useState<number | null>(null);
  const suppressEventClickRef = useRef(false);

  const suppressNextEventClick = () => {
    suppressEventClickRef.current = true;
    window.setTimeout(() => {
      suppressEventClickRef.current = false;
    }, 0);
  };

  const getMinutesFromPointer = (
    mouseEvent: React.MouseEvent<HTMLDivElement>,
    maxMinutes: number
  ) => {
    const rect = mouseEvent.currentTarget.getBoundingClientRect();
    const y = mouseEvent.clientY - rect.top;
    return clamp(snapToQuarterHour((y / HOUR_HEIGHT) * 60), 0, maxMinutes);
  };

  const handleMouseDown = (day: Date, mouseEvent: React.MouseEvent<HTMLDivElement>) => {
    if (!canManageCalendar) return;
    if (mouseEvent.button !== 0) return;
    
    if (!draggedEvent) {
      const snapped = getMinutesFromPointer(mouseEvent, 23 * 60 + 45);
      setDragState({ day, startMinutes: snapped, currentMinutes: snapped });
    }
  };

  const handleMouseMove = (day: Date, mouseEvent: React.MouseEvent<HTMLDivElement>) => {
    if (draggedEvent) {
      const snapped = getMinutesFromPointer(mouseEvent, 23 * 60 + 45);
      setHoveredDay(day);
      setHoveredMinutes(snapped);
      return;
    }

    if (resizingEvent) {
      if (resizingEvent.day.getTime() === day.getTime()) {
        const snapped = getMinutesFromPointer(mouseEvent, DAY_END_MINUTES);
        setResizingEvent((prev) => (prev ? { ...prev, currentMinutes: snapped } : null));
      }
      return;
    }

    if (dragState && dragState.day.getTime() === day.getTime()) {
      const snapped = getMinutesFromPointer(mouseEvent, 23 * 60 + 45);
      setDragState((prev) => prev ? { ...prev, currentMinutes: snapped } : null);
    }
  };

  const handleMouseUp = () => {
    if (resizingEvent) {
      const { event, day, edge, anchorMinutes, currentMinutes } = resizingEvent;
      const nextStartMinutes =
        edge === "top"
          ? clamp(Math.min(currentMinutes, anchorMinutes - 15), DAY_START_MINUTES, anchorMinutes - 15)
          : anchorMinutes;
      const nextEndMinutes =
        edge === "bottom"
          ? clamp(Math.max(currentMinutes, anchorMinutes + 15), anchorMinutes + 15, DAY_END_MINUTES)
          : anchorMinutes;

      const nextStart = new Date(day);
      nextStart.setHours(0, nextStartMinutes, 0, 0);
      const nextEnd = new Date(day);
      nextEnd.setHours(0, nextEndMinutes, 0, 0);

      onEventDrop(event, nextStart, nextEnd);
      suppressNextEventClick();
    } else if (draggedEvent && hoveredDay && hoveredMinutes !== null) {
      const { event, offsetMinutes } = draggedEvent;
      const duration = toDate(event.endTime).getTime() - toDate(event.startTime).getTime();
      const newStart = new Date(hoveredDay);
      newStart.setHours(0, hoveredMinutes - offsetMinutes, 0, 0);
      onEventDrop(event, newStart, new Date(newStart.getTime() + duration));
      suppressNextEventClick();
    } else if (dragState) {
      const s = Math.min(dragState.startMinutes, dragState.currentMinutes);
      const e = Math.max(dragState.startMinutes, dragState.currentMinutes);
      const start = new Date(dragState.day); start.setHours(0, s, 0, 0);
      const end = new Date(dragState.day); end.setHours(0, s === e ? s + 60 : e, 0, 0);
      onSlotClick(start, end);
    }

    setDragState(null);
    setDraggedEvent(null);
    setResizingEvent(null);
    setHoveredDay(null);
    setHoveredMinutes(null);
  };

  return (
    <div className="flex h-full flex-col" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b bg-background px-2 py-2">
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="px-2 text-center text-xs font-semibold text-muted-foreground">
            {day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
          </div>
        ))}
      </div>

      <ScrollArea className="h-full">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] px-2 mt-2">
          <div className="border-r">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="relative border-b text-right text-[10px] text-muted-foreground" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className="absolute -top-2 right-2 bg-background px-1">{hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(toDate(e.startTime), day));
            const columns = calculateOverlappingColumns(dayEvents.map(e => ({ id: e.id, start: toDate(e.startTime), end: toDate(e.endTime) })));

            return (
              <div key={day.toISOString()} className="relative border-r select-none" style={{ height: `${24 * HOUR_HEIGHT}px` }}
                onMouseDown={(e) => handleMouseDown(day, e)}
                onMouseMove={(e) => handleMouseMove(day, e)}
              >
                {Array.from({ length: 24 }).map((_, h) => <div key={h} className="border-b" style={{ height: `${HOUR_HEIGHT}px` }} />)}

                {columns.map((col) => {
                  const event = dayEvents.find((e) => e.id === col.id)!;
                  const { startMinutes, endMinutes } = getEventMinutesForDay(event, day);
                  const calendar = calendarMap.get(event.calendarId);
                  const isResizingThisEvent = resizingEvent?.event.id === event.id;
                  const previewStartMinutes =
                    isResizingThisEvent && resizingEvent.edge === "top"
                      ? clamp(
                          Math.min(resizingEvent.currentMinutes, resizingEvent.anchorMinutes - 15),
                          DAY_START_MINUTES,
                          resizingEvent.anchorMinutes - 15
                        )
                      : startMinutes;
                  const previewEndMinutes =
                    isResizingThisEvent && resizingEvent.edge === "bottom"
                      ? clamp(
                          Math.max(resizingEvent.currentMinutes, resizingEvent.anchorMinutes + 15),
                          resizingEvent.anchorMinutes + 15,
                          DAY_END_MINUTES
                        )
                      : endMinutes;
                  
                  return (
                    <CalendarEntry
                      key={event.id}
                      event={event}
                      color={calendar?.color ?? "#f97316"}
                      style={{
                        top: minutesToPixels(previewStartMinutes),
                        height: minutesToPixels(previewEndMinutes - previewStartMinutes),
                        left: `${(col.column * 100) / col.totalColumns}%`,
                        width: `${100 / col.totalColumns}%`,
                        opacity: draggedEvent?.event.id === event.id ? 0.3 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (suppressEventClickRef.current) {
                          suppressEventClickRef.current = false;
                          return;
                        }
                        onEventClick(event);
                      }}
                      onDragStart={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDraggedEvent({ event, offsetMinutes: Math.round((e.clientY - rect.top) / (HOUR_HEIGHT / 4)) * 15 });
                      }}
                      onResizeStart={(mouseEvent, edge) => {
                        if (!canManageCalendar) return;
                        if (mouseEvent.button !== 0) return;
                        const minutes = getEventMinutesForDay(event, day);
                        setResizingEvent({
                          event,
                          day,
                          edge,
                          anchorMinutes: edge === "top" ? minutes.endMinutes : minutes.startMinutes,
                          currentMinutes: edge === "top" ? minutes.startMinutes : minutes.endMinutes,
                        });
                      }}
                      isResizing={isResizingThisEvent}
                    />
                  );
                })}

                {draggedEvent && hoveredDay && hoveredDay.getTime() === day.getTime() && hoveredMinutes !== null && (
                  <div className="absolute bg-primary/30 border border-primary rounded-md pointer-events-none" style={{
                    top: minutesToPixels(hoveredMinutes - draggedEvent.offsetMinutes),
                    height: minutesToPixels(toDate(draggedEvent.event.endTime).getTime() - toDate(draggedEvent.event.startTime).getTime()) / 60000 / 60 * HOUR_HEIGHT,
                    left: '2px', right: '2px', zIndex: 100
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
