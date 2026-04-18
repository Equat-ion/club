"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { CalendarEventDraft, CalendarEventRecord, CalendarRecord } from "./types";

type EntryPopoverProps = {
  open: boolean;
  event: CalendarEventRecord | null;
  calendars: CalendarRecord[];
  canManageCalendar: boolean;
  defaultDate: Date;
  defaultEndDate: Date;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CalendarEventDraft) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
};

function toInputDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
}

function toInputTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(
    2,
    "0"
  )}`;
}

function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function EntryPopover({
  open,
  event,
  calendars,
  canManageCalendar,
  defaultDate,
  defaultEndDate,
  onOpenChange,
  onSave,
  onDelete,
}: EntryPopoverProps) {
  const defaultCalendarId = useMemo(() => {
    return calendars.find((calendar) => calendar.isDefault)?.id ?? calendars[0]?.id ?? "";
  }, [calendars]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [calendarId, setCalendarId] = useState(defaultCalendarId);
  const [startDate, setStartDate] = useState(toInputDate(defaultDate));
  const [startTime, setStartTime] = useState(toInputTime(defaultDate));
  const [endDate, setEndDate] = useState(toInputDate(defaultEndDate));
  const [endTime, setEndTime] = useState(toInputTime(defaultEndDate));
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (event) {
      const start = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const end = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

      setTitle(event.title);
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      setCalendarId(event.calendarId);
      setStartDate(toInputDate(start));
      setStartTime(toInputTime(start));
      setEndDate(toInputDate(end));
      setEndTime(toInputTime(end));
      setIsAllDay(event.isAllDay);
      return;
    }

    setTitle("");
    setDescription("");
    setLocation("");
    setCalendarId(defaultCalendarId);
    setStartDate(toInputDate(defaultDate));
    setStartTime(toInputTime(defaultDate));
    setEndDate(toInputDate(defaultEndDate));
    setEndTime(toInputTime(defaultEndDate));
    setIsAllDay(false);
  }, [open, event, defaultCalendarId, defaultDate, defaultEndDate]);

  async function handleSave(): Promise<void> {
    if (!canManageCalendar) {
      return;
    }
    if (!title.trim() || !calendarId) {
      return;
    }

    const start = isAllDay
      ? new Date(`${startDate}T00:00:00`)
      : combineDateTime(startDate, startTime);
    const end = isAllDay
      ? new Date(`${endDate}T23:59:59`)
      : combineDateTime(endDate, endTime);

    setIsSubmitting(true);
    try {
      await onSave({
        id: event?.id,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        calendarId,
        startTime: start,
        endTime: end,
        isAllDay,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!event || !canManageCalendar) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onDelete(event.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent side="right" align="start" className="w-[360px] space-y-4">
        <PopoverHeader>
          <PopoverTitle>{event ? "Edit event" : "Create event"}</PopoverTitle>
          <PopoverDescription>
            {canManageCalendar
              ? "Update event details and calendar assignment."
              : "Read-only view for this event."}
          </PopoverDescription>
        </PopoverHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="calendar-title">Title</Label>
            <Input
              id="calendar-title"
              value={title}
              onChange={(evt) => setTitle(evt.target.value)}
              disabled={!canManageCalendar || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendar-description">Description</Label>
            <Textarea
              id="calendar-description"
              value={description}
              onChange={(evt) => setDescription(evt.target.value)}
              rows={3}
              disabled={!canManageCalendar || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendar-location">Location</Label>
            <Input
              id="calendar-location"
              value={location}
              onChange={(evt) => setLocation(evt.target.value)}
              disabled={!canManageCalendar || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendar-select">Calendar</Label>
            <Select
              value={calendarId}
              onValueChange={setCalendarId}
              disabled={!canManageCalendar || isSubmitting}
            >
              <SelectTrigger id="calendar-select">
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      {calendar.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border p-2">
            <Label htmlFor="all-day-toggle">All day</Label>
            <Switch
              id="all-day-toggle"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
              disabled={!canManageCalendar || isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(evt) => setStartDate(evt.target.value)}
                disabled={!canManageCalendar || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(evt) => setStartTime(evt.target.value)}
                disabled={!canManageCalendar || isSubmitting || isAllDay}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(evt) => setEndDate(evt.target.value)}
                disabled={!canManageCalendar || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(evt) => setEndTime(evt.target.value)}
                disabled={!canManageCalendar || isSubmitting || isAllDay}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {event ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                void handleDelete();
              }}
              disabled={!canManageCalendar || isSubmitting}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={!canManageCalendar || isSubmitting || !title.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
