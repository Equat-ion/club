CREATE TABLE "org_calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"calendar_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_calendar_events_title_len" CHECK (char_length("org_calendar_events"."title") between 1 and 200),
	CONSTRAINT "org_calendar_events_desc_len" CHECK ("org_calendar_events"."description" is null or char_length("org_calendar_events"."description") <= 2000),
	CONSTRAINT "org_calendar_events_location_len" CHECK ("org_calendar_events"."location" is null or char_length("org_calendar_events"."location") <= 200),
	CONSTRAINT "org_calendar_events_time_order" CHECK ("org_calendar_events"."end_time" >= "org_calendar_events"."start_time")
);
--> statement-breakpoint
CREATE TABLE "org_calendars" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#f97316' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_calendar_events" ADD CONSTRAINT "org_calendar_events_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_calendar_events" ADD CONSTRAINT "org_calendar_events_calendar_id_org_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."org_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_calendars" ADD CONSTRAINT "org_calendars_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_calendar_events_org_start_idx" ON "org_calendar_events" USING btree ("org_id","start_time");--> statement-breakpoint
CREATE INDEX "org_calendar_events_calendar_start_idx" ON "org_calendar_events" USING btree ("calendar_id","start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "org_calendars_org_default_idx" ON "org_calendars" USING btree ("org_id") WHERE "org_calendars"."is_default" = true;--> statement-breakpoint
CREATE INDEX "org_calendars_org_idx" ON "org_calendars" USING btree ("org_id");
