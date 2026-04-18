"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

import type { CalendarRecord } from "./types";

type CalendarSidebarProps = {
  calendars: CalendarRecord[];
  selectedDate: Date;
  canManageCalendar: boolean;
  onDateChange: (date: Date) => void;
  onToggleCalendar: (calendarId: string, isVisible: boolean) => void;
  onCreateCalendar: () => void;
};

export function CalendarSidebar({
  calendars,
  selectedDate,
  canManageCalendar,
  onDateChange,
  onToggleCalendar,
  onCreateCalendar,
}: CalendarSidebarProps) {
  const sorted = useMemo(
    () =>
      [...calendars].sort((a, b) => {
        if (a.isDefault === b.isDefault) {
          return a.name.localeCompare(b.name);
        }
        return a.isDefault ? -1 : 1;
      }),
    [calendars]
  );

  return (
    <aside className="w-full border-b bg-sidebar lg:w-72 lg:border-r lg:border-b-0">
      <div className="p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onDateChange(date);
            }
          }}
          className="w-full rounded-md border bg-background"
        />
      </div>

      <div className="flex items-center justify-between px-3 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Calendars
        </p>
        {canManageCalendar ? (
          <Button type="button" size="icon-xs" variant="outline" onClick={onCreateCalendar}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <ScrollArea className="h-[220px] px-3 pb-3">
        <div className="space-y-2">
          {sorted.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between rounded-md border bg-background px-2 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: calendar.color }}
                />
                <span className="truncate text-sm">{calendar.name}</span>
              </div>

              <Switch
                checked={calendar.isVisible}
                onCheckedChange={(visible) => onToggleCalendar(calendar.id, visible)}
                disabled={!canManageCalendar && !calendar.isVisible}
                aria-label={`Toggle ${calendar.name}`}
              />
            </div>
          ))}
          {sorted.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              No calendars yet.
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
}
