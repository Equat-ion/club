export function normalizeCalendarRange(start: Date, end: Date) {
  if (end.getTime() < start.getTime()) {
    throw new Error("Calendar event end time must be after start time.");
  }

  return { start, end };
}
