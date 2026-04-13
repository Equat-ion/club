ALTER TABLE "issues" DROP CONSTRAINT "issues_assignee_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_assignee_id_member_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_issues_team_id" ON "issues" USING btree ("team_id");