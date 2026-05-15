import {
  addDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { CalendarEventRecord } from "./types";

export type OverlapInput = {
  id: string;
  start: Date;
  end: Date;
};

export type OverlapColumn = OverlapInput & {
  column: number;
  totalColumns: number;
};

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  return { start, end, days };
}

export function getMonthGrid(date: Date) {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  if (days.length >= 42) {
    return days.slice(0, 42);
  }

  const padded = [...days];
  while (padded.length < 42) {
    padded.push(addDays(padded[padded.length - 1], 1));
  }

  return padded;
}

export function snapMinutes(minutes: number): number {
  const step = 15;
  return Math.round(minutes / step) * step;
}

export function calculateOverlappingColumns(
  events: OverlapInput[]
): OverlapColumn[] {
  if (events.length === 0) {
    return [];
  }

  const sorted = [...events].sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime();
    if (diff !== 0) {
      return diff;
    }

    const aDuration = a.end.getTime() - a.start.getTime();
    const bDuration = b.end.getTime() - b.start.getTime();
    return bDuration - aDuration;
  });

  const groups: OverlapInput[][] = [];
  let currentGroup: OverlapInput[] = [];
  let currentEnd = new Date(0);

  for (const event of sorted) {
    if (event.start >= currentEnd) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [event];
      currentEnd = event.end;
      continue;
    }

    currentGroup.push(event);
    if (event.end > currentEnd) {
      currentEnd = event.end;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const positioned: OverlapColumn[] = [];

  for (const group of groups) {
    const columns: OverlapInput[][] = [];

    for (const event of group) {
      let columnIndex = 0;
      let assigned = false;

      while (columnIndex < columns.length) {
        const last = columns[columnIndex][columns[columnIndex].length - 1];
        if (event.start >= last.end) {
          columns[columnIndex].push(event);
          assigned = true;
          break;
        }
        columnIndex += 1;
      }

      if (!assigned) {
        columns.push([event]);
      }
    }

    const totalColumns = columns.length;

    columns.forEach((columnEvents, column) => {
      columnEvents.forEach((event) => {
        positioned.push({
          ...event,
          column,
          totalColumns,
        });
      });
    });
  }

  return positioned;
}

export function eventOccursOnDay(event: CalendarEventRecord, day: Date): boolean {
  const eventStart = toDate(event.startTime);
  const eventEnd = toDate(event.endTime);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

export function getEventMinutesForDay(event: CalendarEventRecord, day: Date) {
  const start = toDate(event.startTime);
  const end = toDate(event.endTime);

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const effectiveStart = isSameDay(start, day) ? start : dayStart;
  const effectiveEnd = isSameDay(end, day) ? end : dayEnd;

  const startMinutes =
    effectiveStart.getHours() * 60 + effectiveStart.getMinutes();
  const endMinutes =
    effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes();

  return { startMinutes, endMinutes };
}

export function formatDayLabel(date: Date) {
  return format(date, "EEE d");
}

export function getDurationMinutes(start: Date, end: Date): number {
  return Math.max(15, differenceInMinutes(end, start));
}
