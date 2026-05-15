# Calendar Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an opt-in Calendar plugin inside the existing org workspace, with a simplified production Drizzle schema, admin-only writes, and a themed shadcn UI that reuses the useful calendar behavior from `ref` without copying its database design.

**Architecture:** Keep the plugin org-scoped and self-contained. Use Drizzle migrations for two tables only, server actions for mutations, and the existing plugin registry/sidebar flow to surface Calendar as a first-class plugin item. Split the UI into focused client components for the calendar shell, sidebar, timeline views, entry editor, and pure date helpers so the calendar math stays testable and the theme stays aligned with the current app tokens.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Postgres, shadcn/ui, Tailwind CSS v4, date-fns, sonner, Vitest.

---

### Task 0: Add the production Drizzle schema and migration

**Files:**
- Create: `lib/db/schema/calendar.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `drizzle/0004_calendar_plugin.sql`
- Create: `drizzle/meta/0004_snapshot.json`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Write the failing test**

```ts
// lib/db/schema/calendar.test.ts
import { describe, expect, it } from "vitest";
import { orgCalendars, orgCalendarEvents } from "@/lib/db/schema/calendar";

describe("calendar schema exports", () => {
  it("exports the org calendar tables", () => {
    expect(orgCalendars).toBeDefined();
    expect(orgCalendarEvents).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- lib/db/schema/calendar.test.ts`

Expected: FAIL because `lib/db/schema/calendar.ts` does not exist yet.

- [ ] **Step 3: Add the minimal schema and migration**

```ts
// lib/db/schema/calendar.ts
import { pgTable, text, boolean, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const orgCalendars = pgTable(
  "org_calendars",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#f97316"),
    isDefault: boolean("is_default").notNull().default(false),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("org_calendars_org_default_idx").on(table.orgId, table.isDefault),
    index("org_calendars_org_idx").on(table.orgId),
  ]
);

export const orgCalendarEvents = pgTable(
  "org_calendar_events",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    calendarId: text("calendar_id").notNull().references(() => orgCalendars.id, { onDelete: "cascade" }),
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
    index("org_calendar_events_calendar_start_idx").on(table.calendarId, table.startTime),
  ]
);
```

```sql
-- drizzle/0004_calendar_plugin.sql
CREATE TABLE org_calendars (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#f97316',
  is_default boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE org_calendar_events (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  calendar_id text NOT NULL REFERENCES org_calendars(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_all_day boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW(),
  CONSTRAINT org_calendar_events_title_len CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT org_calendar_events_desc_len CHECK (description IS NULL OR char_length(description) <= 2000),
  CONSTRAINT org_calendar_events_location_len CHECK (location IS NULL OR char_length(location) <= 200),
  CONSTRAINT org_calendar_events_time_order CHECK (end_time >= start_time)
);

CREATE INDEX org_calendars_org_idx ON org_calendars(org_id);
CREATE INDEX org_calendar_events_org_start_idx ON org_calendar_events(org_id, start_time);
CREATE INDEX org_calendar_events_calendar_start_idx ON org_calendar_events(calendar_id, start_time);
```

- [ ] **Step 4: Run the schema and migration checks**

Run: `pnpm test -- lib/db/schema/calendar.test.ts && pnpm exec tsc --noEmit`

Expected: The schema test passes and TypeScript resolves the new exports cleanly.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema/calendar.ts lib/db/schema/index.ts drizzle/0004_calendar_plugin.sql drizzle/meta/0004_snapshot.json drizzle/meta/_journal.json lib/db/schema/calendar.test.ts
git commit -m "feat: add org calendar schema for the calendar plugin"
```

### Task 1: Register the plugin, add permission gates, and wire hooks

**Files:**
- Modify: `lib/plugins/registry.ts`
- Modify: `lib/plugins/icon-resolver.tsx`
- Modify: `lib/auth/permissions.ts`
- Modify: `lib/hooks/registry.ts`
- Modify: `lib/hooks/index.ts`
- Create: `lib/hooks/plugins/calendar.ts`
- Modify: `actions/plugins.ts`
- Create: `lib/plugins/registry.test.ts`
- Create: `lib/auth/permissions.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/plugins/registry.test.ts
import { describe, expect, it } from "vitest";
import { getPluginBySlug } from "@/lib/plugins/registry";

describe("calendar plugin registry", () => {
  it("registers calendar as an opt-in plugin", () => {
    const plugin = getPluginBySlug("calendar");
    expect(plugin?.id).toBe("calendar");
    expect(plugin?.defaultEnabled).toBe(false);
  });
});
```

```ts
// lib/auth/permissions.test.ts
import { describe, expect, it } from "vitest";
import { canManageCalendar } from "@/lib/auth/permissions";

describe("canManageCalendar", () => {
  it("allows admins and owners to edit calendar data", () => {
    expect(canManageCalendar("admin")).toBe(true);
    expect(canManageCalendar("owner")).toBe(true);
    expect(canManageCalendar("member")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- lib/plugins/registry.test.ts lib/auth/permissions.test.ts`

Expected: FAIL because the calendar plugin and permission helper do not exist yet.

- [ ] **Step 3: Add the registry entry, permission helper, and hooks**

```ts
// lib/plugins/registry.ts (plugin entry only)
{
  id: "calendar",
  name: "Calendar",
  description: "Team calendar with week and month planning views",
  slug: "calendar",
  icon: "CalendarDays",
  plans: ["free", "plus", "enterprise"],
  defaultEnabled: false,
  category: "productivity",
  version: "1.0.0",
}
```

```ts
// lib/auth/permissions.ts (new helper)
export function canManageCalendar(role: string): boolean {
  return role === "owner" || role === "admin";
}
```

```ts
// lib/hooks/registry.ts (new events)
"calendar:created": { orgId: string; calendarId: string; name: string; actorId: string; }
"calendar:updated": { orgId: string; calendarId: string; changes: { name?: string; color?: string; isVisible?: boolean }; actorId: string; }
"calendar:deleted": { orgId: string; calendarId: string; actorId: string; }
"calendar:event_created": { orgId: string; eventId: string; calendarId: string; actorId: string; }
"calendar:event_updated": { orgId: string; eventId: string; calendarId: string; actorId: string; }
"calendar:event_deleted": { orgId: string; eventId: string; actorId: string; }
```

```ts
// lib/hooks/plugins/calendar.ts
import { hooksRegistry } from "../registry";

export function registerCalendarHooks(): void {
  hooksRegistry.on("calendar:created", (payload) => {
    console.log(`[calendar] Calendar \"${payload.name}\" created for org ${payload.orgId}`);
  });
  hooksRegistry.on("calendar:event_created", (payload) => {
    console.log(`[calendar] Event ${payload.eventId} created in org ${payload.orgId}`);
  });
}
```

```ts
// actions/plugins.ts (calendar bootstrap on enable)
if (pluginId === "calendar") {
  await ensureCalendarPluginSeed(orgId);
}
```

```ts
// lib/hooks/index.ts
registerCalendarHooks();
```

- [ ] **Step 4: Run the tests again**

Run: `pnpm test -- lib/plugins/registry.test.ts lib/auth/permissions.test.ts && pnpm exec tsc --noEmit`

Expected: PASS, and the new helper compiles everywhere it is imported.

- [ ] **Step 5: Commit**

```bash
git add lib/plugins/registry.ts lib/plugins/icon-resolver.tsx lib/auth/permissions.ts lib/hooks/registry.ts lib/hooks/index.ts lib/hooks/plugins/calendar.ts actions/plugins.ts lib/plugins/registry.test.ts lib/auth/permissions.test.ts
git commit -m "feat: register calendar plugin and admin-only permissions"
```

### Task 2: Build the calendar actions and bootstrap flow

**Files:**
- Create: `actions/calendar.ts`
- Create: `lib/plugins/calendar-validation.ts`
- Create: `lib/plugins/calendar-validation.test.ts`
- Modify: `lib/hooks/registry.ts` (emit the calendar hook events from mutations)

- [ ] **Step 1: Write the failing test**

```ts
// lib/plugins/calendar-validation.test.ts
import { describe, expect, it } from "vitest";
import { normalizeCalendarRange } from "@/lib/plugins/calendar-validation";

describe("normalizeCalendarRange", () => {
  it("keeps start before end and rejects empty ranges", () => {
    const result = normalizeCalendarRange(new Date("2026-04-18T10:00:00Z"), new Date("2026-04-18T11:00:00Z"));
    expect(result.start.toISOString()).toBe("2026-04-18T10:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-04-18T11:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- lib/plugins/calendar-validation.test.ts`

Expected: FAIL because the validation helper does not exist yet.

- [ ] **Step 3: Add the minimal validation helper and calendar actions**

```ts
// lib/plugins/calendar-validation.ts
export function normalizeCalendarRange(start: Date, end: Date) {
  if (end.getTime() < start.getTime()) {
    throw new Error("Calendar event end time must be after start time.");
  }
  return { start, end };
}
```

```ts
// actions/calendar.ts
"use server";

export async function ensureCalendarPluginSeed(orgId: string) {
  // Insert a single protected Primary calendar if the org has none.
}

export async function listOrgCalendars(orgId: string) {
  // Return all calendars for the org ordered by default first, then created_at.
}

export async function createOrgCalendar(input: {
  orgId: string;
  actorRole: string;
  name: string;
  color: string;
}) {
  // Reject non-admin roles, insert the new calendar, and emit calendar:created.
}

export async function updateOrgCalendar(input: {
  orgId: string;
  actorRole: string;
  calendarId: string;
  name?: string;
  color?: string;
  isVisible?: boolean;
}) {
  // Reject non-admin roles, update the row, and emit calendar:updated.
}

export async function deleteOrgCalendar(input: {
  orgId: string;
  actorRole: string;
  calendarId: string;
}) {
  // Reject non-admin roles, block default calendar deletion, and emit calendar:deleted.
}

export async function listOrgCalendarEvents(orgId: string) {
  // Return all events for the org, joined with calendar metadata.
}

export async function createOrgCalendarEvent(input: {
  orgId: string;
  actorRole: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
}) {
  // Reject non-admin roles, validate the range, insert the event, and emit calendar:event_created.
}

export async function updateOrgCalendarEvent(input: {
  orgId: string;
  actorRole: string;
  eventId: string;
  calendarId?: string;
  title?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  isAllDay?: boolean;
}) {
  // Reject non-admin roles, validate any new range, update the row, and emit calendar:event_updated.
}

export async function deleteOrgCalendarEvent(input: {
  orgId: string;
  actorRole: string;
  eventId: string;
}) {
  // Reject non-admin roles, delete the row, and emit calendar:event_deleted.
}
```

```ts
// actions/calendar.ts (bootstrap seed)
await db.insert(orgCalendars).values({
  id: createId(),
  orgId,
  name: "Primary",
  color: "#f97316",
  isDefault: true,
  isVisible: true,
});
```

- [ ] **Step 4: Run the validation test and typecheck**

Run: `pnpm test -- lib/plugins/calendar-validation.test.ts && pnpm exec tsc --noEmit`

Expected: PASS, and the action file compiles with the new schema imports.

- [ ] **Step 5: Commit**

```bash
git add actions/calendar.ts lib/plugins/calendar-validation.ts lib/plugins/calendar-validation.test.ts lib/hooks/registry.ts
git commit -m "feat: add calendar actions and range validation"
```

### Task 3: Add the calendar plugin route and server-side access control

**Files:**
- Create: `app/app/[slug]/calendar/page.tsx`
- Create: `app/app/[slug]/calendar/loading.tsx`
- Modify: `app/app/[slug]/plugins/page.tsx` (copy and status text only if needed)
- Create: `components/plugins/calendar/calendar-page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// lib/plugins/calendar-access.test.ts
import { describe, expect, it } from "vitest";
import { canManageCalendar } from "@/lib/auth/permissions";

describe("calendar access", () => {
  it("treats members as read-only", () => {
    expect(canManageCalendar("member")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- lib/plugins/calendar-access.test.ts`

Expected: FAIL before the permission helper exists or is exported.

- [ ] **Step 3: Add the route and page shell**

```tsx
// app/app/[slug]/calendar/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { orgPlugins } from "@/lib/db/schema/orgs";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { canManageCalendar } from "@/lib/auth/permissions";

export default async function CalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const org = await db.query.organization.findFirst({ where: eq(organization.slug, slug) });
  if (!org) redirect("/app");

  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, org.id), eq(member.userId, session.user.id)),
  });
  if (!membership) redirect("/app");

  const plugin = await db.query.orgPlugins.findFirst({
    where: and(eq(orgPlugins.orgId, org.id), eq(orgPlugins.pluginId, "calendar")),
  });
  if (!plugin?.enabled) redirect(`/app/${slug}/plugins`);

  return <CalendarPageClient orgId={org.id} orgSlug={slug} canManageCalendar={canManageCalendar(membership.role)} />;
}
```

```tsx
// components/plugins/calendar/calendar-page.tsx
export function CalendarPageClient({ orgId, orgSlug, canManageCalendar }: Props) {
  return <div className="min-h-0 flex-1">{/* shell goes here */}</div>;
}
```

- [ ] **Step 4: Run the access test and compile check**

Run: `pnpm test -- lib/plugins/calendar-access.test.ts && pnpm exec tsc --noEmit`

Expected: PASS, and the route resolves the new page without import errors.

- [ ] **Step 5: Commit**

```bash
git add app/app/[slug]/calendar/page.tsx app/app/[slug]/calendar/loading.tsx components/plugins/calendar/calendar-page.tsx lib/plugins/calendar-access.test.ts
git commit -m "feat: add calendar plugin route and access gate"
```

### Task 4: Build the shared calendar utilities and timeline views

**Files:**
- Create: `components/plugins/calendar/calendar-utils.ts`
- Create: `components/plugins/calendar/calendar-utils.test.ts`
- Create: `components/plugins/calendar/week-view.tsx`
- Create: `components/plugins/calendar/month-view.tsx`
- Create: `components/plugins/calendar/calendar-entry.tsx`
- Create: `components/plugins/calendar/calendar-header.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// components/plugins/calendar/calendar-utils.test.ts
import { describe, expect, it } from "vitest";
import { calculateOverlappingColumns } from "./calendar-utils";

describe("calculateOverlappingColumns", () => {
  it("places overlapping events in separate columns", () => {
    const events = [
      { id: "a", start: new Date("2026-04-18T10:00:00Z"), end: new Date("2026-04-18T11:00:00Z") },
      { id: "b", start: new Date("2026-04-18T10:30:00Z"), end: new Date("2026-04-18T11:30:00Z") },
    ];
    expect(calculateOverlappingColumns(events)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- components/plugins/calendar/calendar-utils.test.ts`

Expected: FAIL because the utility module does not exist yet.

- [ ] **Step 3: Implement the utilities and the two timeline views**

```ts
// components/plugins/calendar/calendar-utils.ts
export function getWeekRange(date: Date) { /* Sunday-start week range */ }
export function getMonthGrid(date: Date) { /* 6x7 month grid */ }
export function calculateOverlappingColumns(events: { id: string; start: Date; end: Date }[]) { /* compact overlap layout */ }
export function snapMinutes(minutes: number) { /* 15-minute snap */ }
```

```tsx
// components/plugins/calendar/week-view.tsx
export function WeekView({ date, events, calendars, onSlotClick, onEventClick, onEventDrop, onCreateEvent, canManageCalendar }: Props) {
  return <div className="flex-1 overflow-hidden">{/* sticky time grid, all-day row, drag previews */}</div>;
}
```

```tsx
// components/plugins/calendar/month-view.tsx
export function MonthView({ date, events, calendars, onDayClick, onEventClick, onEventDrop, onCreateAllDayEvent, canManageCalendar }: Props) {
  return <div className="flex-1 overflow-hidden">{/* month grid, overflow indicators, drag-select */}</div>;
}
```

```tsx
// components/plugins/calendar/calendar-entry.tsx
export function CalendarEntry({ event, style, color, onClick, onDragStart, onResizeStart, isDragging, isResizing }: Props) {
  return (
    <button
      type="button"
      className="absolute overflow-hidden rounded-sm border text-left"
      style={style}
      onClick={onClick}
    >
      <div className="flex h-full items-center gap-2 px-2">
        <span className="h-full w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate text-xs font-medium">{event.title}</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Run the helper test and typecheck**

Run: `pnpm test -- components/plugins/calendar/calendar-utils.test.ts && pnpm exec tsc --noEmit`

Expected: PASS, and the view files compile against the helper signatures.

- [ ] **Step 5: Commit**

```bash
git add components/plugins/calendar/calendar-utils.ts components/plugins/calendar/calendar-utils.test.ts components/plugins/calendar/week-view.tsx components/plugins/calendar/month-view.tsx components/plugins/calendar/calendar-entry.tsx components/plugins/calendar/calendar-header.tsx
git commit -m "feat: add calendar math and timeline views"
```

### Task 5: Build the calendar sidebar, entry editor, and theme-adherent shell

**Files:**
- Create: `components/plugins/calendar/calendar-sidebar.tsx`
- Create: `components/plugins/calendar/entry-popover.tsx`
- Modify: `components/plugins/calendar/calendar-page.tsx`
- Create: `components/plugins/calendar/entry-popover.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/plugins/calendar/entry-popover.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryPopover } from "./entry-popover";

describe("EntryPopover", () => {
  it("renders an all-day toggle and calendar selector", () => {
    render(<EntryPopover open event={null} calendars={[]} canManageCalendar />);
    expect(screen.getByLabelText("All day")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- components/plugins/calendar/entry-popover.test.tsx`

Expected: FAIL because the popover component does not exist yet.

- [ ] **Step 3: Add the sidebar, popover, and shell wiring**

```tsx
// components/plugins/calendar/calendar-sidebar.tsx
export function CalendarSidebar({ calendars, selectedDate, onDateChange, onToggleCalendar, onCreateCalendar, canManageCalendar }: Props) {
  return <aside className="w-full border-b bg-sidebar lg:w-72 lg:border-b-0 lg:border-r">{/* mini calendar + calendar list */}</aside>;
}
```

```tsx
// components/plugins/calendar/entry-popover.tsx
export function EntryPopover({ open, event, calendars, canManageCalendar, defaultDate, defaultEndDate, onOpenChange, onSave, onDelete }: Props) {
  return <Popover open={open} onOpenChange={onOpenChange}>{/* title, description, location, calendar select, all-day toggle */}</Popover>;
}
```

```tsx
// components/plugins/calendar/calendar-page.tsx (shell)
return (
  <div className="flex min-h-0 flex-1 flex-col bg-background lg:flex-row">
    <CalendarSidebar
      orgId={orgId}
      canManageCalendar={canManageCalendar}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      onToggleCalendar={handleToggleCalendar}
      onCreateCalendar={handleCreateCalendar}
    />
    <div className="min-h-0 flex-1">
      <CalendarHeader
        view={view}
        selectedDate={selectedDate}
        onViewChange={setView}
        onToday={() => setSelectedDate(new Date())}
        canManageCalendar={canManageCalendar}
      />
      {view === "week" ? (
        <WeekView
          date={selectedDate}
          events={events}
          calendars={calendars}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onCreateEvent={handleCreateEvent}
          canManageCalendar={canManageCalendar}
        />
      ) : (
        <MonthView
          date={selectedDate}
          events={events}
          calendars={calendars}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onCreateAllDayEvent={handleCreateAllDayEvent}
          canManageCalendar={canManageCalendar}
        />
      )}
      <EntryPopover
        open={isPopoverOpen}
        event={selectedEvent}
        calendars={calendars}
        canManageCalendar={canManageCalendar}
        defaultDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
        onOpenChange={setPopoverOpen}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  </div>
);
```

- [ ] **Step 4: Run the popover test and a focused build check**

Run: `pnpm test -- components/plugins/calendar/entry-popover.test.tsx && pnpm exec tsc --noEmit`

Expected: PASS, and the shell compiles with the new sidebar/popover components.

- [ ] **Step 5: Commit**

```bash
git add components/plugins/calendar/calendar-sidebar.tsx components/plugins/calendar/entry-popover.tsx components/plugins/calendar/calendar-page.tsx components/plugins/calendar/entry-popover.test.tsx
git commit -m "feat: add themed calendar sidebar and entry editor"
```

### Task 6: Wire the plugin into the marketplace and finalize org integration

**Files:**
- Modify: `components/settings/plugin-marketplace.tsx`
- Modify: `components/layout/app-sidebar.tsx` if the plugin ordering or section copy needs a small label update
- Modify: `actions/plugins.ts`
- Modify: `app/app/[slug]/layout.tsx` if needed for route breadcrumbs or active plugin handling

- [ ] **Step 1: Write the failing test**

```ts
// lib/plugins/plugin-marketplace.test.ts
import { describe, expect, it } from "vitest";
import { getPluginBySlug } from "@/lib/plugins/registry";

describe("plugin marketplace visibility", () => {
  it("exposes calendar as an installable plugin", () => {
    const plugin = getPluginBySlug("calendar");
    expect(plugin?.defaultEnabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- lib/plugins/plugin-marketplace.test.ts`

Expected: FAIL before the registry entry exists.

- [ ] **Step 3: Tighten the marketplace and enable flow**

```tsx
// components/settings/plugin-marketplace.tsx
// No custom Calendar special case; it should render from the registry like other plugins.
```

```ts
// actions/plugins.ts
if (pluginId === "calendar" && enabled) {
  await ensureCalendarPluginSeed(orgId);
}
```

```tsx
// components/layout/app-sidebar.tsx
// No special sidebar item needed beyond the plugin registry; Calendar appears under Plugins when enabled.
```

- [ ] **Step 4: Run the marketplace test plus end-to-end verification**

Run: `pnpm test -- lib/plugins/plugin-marketplace.test.ts && pnpm lint && pnpm exec tsc --noEmit && pnpm build`

Expected: PASS across test, lint, typecheck, and build.

- [ ] **Step 5: Commit**

```bash
git add components/settings/plugin-marketplace.tsx actions/plugins.ts app/app/[slug]/layout.tsx lib/plugins/plugin-marketplace.test.ts
git commit -m "feat: surface calendar in plugin marketplace and sidebar flow"
```

### Task 7: Final verification and production pass

**Files:**
- Modify: any calendar files discovered during verification only

- [ ] **Step 1: Run the full verification suite**

Run:
```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: all commands pass with no calendar-related TypeScript, lint, or build errors.

- [ ] **Step 2: Check the UI paths manually**

Verify in the browser:
```text
/app/[slug]/plugins -> enable Calendar
/app/[slug]/calendar -> week view loads
/app/[slug]/calendar -> switch to month view
/app/[slug]/calendar -> admin can create/edit/delete
/app/[slug]/calendar -> member can view but cannot mutate
```

Expected: plugin appears only after enable, the page matches the theme, and member actions stay read-only.

- [ ] **Step 3: Commit any final fixes**

```bash
git add .
git commit -m "chore: finish calendar plugin verification"
```
