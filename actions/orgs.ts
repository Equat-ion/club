"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

/**
 * Create a new organization.
 * The creator becomes the owner (Admin in UI).
 * better-auth's afterCreateOrganization hook handles:
 *   - Creating org_profile with plan="free"
 *   - Enabling default plugins
 */
export async function createOrg(data: { name: string; slug: string }) {
  const response = await auth.api.createOrganization({
    headers: await headers(),
    body: {
      name: data.name,
      slug: data.slug,
    },
  });

  revalidatePath("/app");

  return { slug: response.slug };
}

/**
 * Set the active organization for the current session.
 */
export async function setActiveOrg(orgId: string) {
  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
    },
  });
}
