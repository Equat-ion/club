import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { organization } from "./auth";

export const orgCalendars = pgTable(
  "org_calendars",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#f97316"),
    isDefault: boolean("is_default").notNull().default(false),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("org_calendars_org_default_idx")
      .on(table.orgId)
      .where(sql`${table.isDefault} = true`),
    index("org_calendars_org_idx").on(table.orgId),
  ]
);

export const orgCalendarEvents = pgTable(
  "org_calendar_events",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    calendarId: text("calendar_id")
      .notNull()
      .references(() => orgCalendars.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    isAllDay: boolean("is_all_day").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("org_calendar_events_org_start_idx").on(table.orgId, table.startTime),
    index("org_calendar_events_calendar_start_idx").on(
      table.calendarId,
      table.startTime
    ),
    check("org_calendar_events_title_len", sql`char_length(${table.title}) between 1 and 200`),
    check(
      "org_calendar_events_desc_len",
      sql`${table.description} is null or char_length(${table.description}) <= 2000`
    ),
    check(
      "org_calendar_events_location_len",
      sql`${table.location} is null or char_length(${table.location}) <= 200`
    ),
    check("org_calendar_events_time_order", sql`${table.endTime} >= ${table.startTime}`),
  ]
);
