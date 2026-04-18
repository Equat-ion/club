export type CalendarViewMode = "week" | "month";

export type CalendarRecord = {
  id: string;
  orgId: string;
  name: string;
  color: string;
  isDefault: boolean;
  isVisible: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type CalendarEventRecord = {
  id: string;
  orgId: string;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date | string;
  endTime: Date | string;
  isAllDay: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  calendarName?: string;
  calendarColor?: string;
  calendarVisible?: boolean;
};

export type CalendarEventDraft = {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  calendarId: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
};
