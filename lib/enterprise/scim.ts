import { db } from "@/lib/db";
import { enterpriseMemberState } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function recordScimGroups(memberId: string, groups: string[]) {
  await db.update(enterpriseMemberState)
    .set({
      scimGroups: groups,
      lastScimSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(enterpriseMemberState.memberId, memberId));
}
