CREATE TABLE "member_permission_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"permission_key" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_role_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"role_id" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"plugin_id" text,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"depends_on" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permission_definitions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "enterprise_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"saml_provider_id" text,
	"scim_provider_id" text,
	"scim_token_hash" text,
	"scim_token_last_four" text,
	"scim_token_last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_group_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"group_key" text NOT NULL,
	"role_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_member_state" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"provision_source" text DEFAULT 'manual' NOT NULL,
	"scim_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"saml_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alignment_state" text DEFAULT 'unknown' NOT NULL,
	"last_scim_sync_at" timestamp,
	"last_saml_login_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_profiles" ADD COLUMN "enterprise_mode_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "org_profiles" ADD COLUMN "enterprise_mode_enabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "member_permission_grants" ADD CONSTRAINT "member_permission_grants_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_role_assignments" ADD CONSTRAINT "member_role_assignments_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_role_assignments" ADD CONSTRAINT "member_role_assignments_role_id_org_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."org_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_role_permissions" ADD CONSTRAINT "org_role_permissions_role_id_org_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."org_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_roles" ADD CONSTRAINT "org_roles_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_connections" ADD CONSTRAINT "enterprise_connections_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_group_mappings" ADD CONSTRAINT "enterprise_group_mappings_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_member_state" ADD CONSTRAINT "enterprise_member_state_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_member_state" ADD CONSTRAINT "enterprise_member_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_member_state" ADD CONSTRAINT "enterprise_member_state_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_roles_org_key_idx" ON "org_roles" USING btree ("org_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "enterprise_connections_org_idx" ON "enterprise_connections" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enterprise_group_mappings_org_group_idx" ON "enterprise_group_mappings" USING btree ("org_id","group_key");