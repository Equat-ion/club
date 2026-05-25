import { db } from "@/lib/db";
import { enterpriseMemberState } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function recordSamlGroups(memberId: string, groups: string[]) {
  await db.update(enterpriseMemberState)
    .set({
      samlGroups: groups,
      lastSamlLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(enterpriseMemberState.memberId, memberId));
}
