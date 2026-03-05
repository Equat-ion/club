import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { member } from "./auth";

// ============================================================
// member_profiles — Member display name override
// Supplements better-auth's member table. 1:1 relation.
// id = memberId.
// ============================================================

export const memberProfiles = pgTable("member_profiles", {
  id: text("id")
    .primaryKey()
    .references(() => member.id, { onDelete: "cascade" }),
  displayName: text("display_name"), // nullable, falls back to user.name
  avatarUrl: text("avatar_url"), // nullable, falls back to user.image
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
