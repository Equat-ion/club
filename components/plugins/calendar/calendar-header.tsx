"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { CalendarViewMode } from "./types";

type CalendarHeaderProps = {
  view: CalendarViewMode;
  selectedDate: Date;
  canManageCalendar: boolean;
  onViewChange: (view: CalendarViewMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onNewEvent: () => void;
};

export function CalendarHeader({
  view,
  selectedDate,
  canManageCalendar,
  onViewChange,
  onToday,
  onPrevious,
  onNext,
  onNewEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon-sm" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button type="button" variant="outline" size="icon-sm" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="ml-2 text-sm font-semibold">{format(selectedDate, "MMMM yyyy")}</p>
      </div>

      <div className="flex items-center gap-2">
        <Tabs
          value={view}
          onValueChange={(value) => onViewChange(value as CalendarViewMode)}
          className="w-auto"
        >
          <TabsList variant="line" className="h-8 gap-1 p-0">
            <TabsTrigger value="week" className="px-2 py-1 text-xs">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="px-2 py-1 text-xs">
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {canManageCalendar ? (
          <Button type="button" size="sm" onClick={onNewEvent}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        ) : null}
      </div>
    </div>
  );
}
