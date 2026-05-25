"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

import { getSessionOrgAccess } from "@/lib/auth/session";

/**
 * Create a new organization.
 * The creator becomes the owner (Admin in UI).
 * better-auth's afterCreateOrganization hook handles:
 *   - Creating org_profile with plan="free"
 *   - Enabling default plugins
 */
export async function createOrg(data: { name: string; slug: string }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  const activeOrgId = session.session.activeOrganizationId;
  if (activeOrgId) {
    const access = await getSessionOrgAccess(activeOrgId);
    if (access.orgSwitchingLocked) {
      throw new Error("Enterprise-managed members cannot create or switch organizations");
    }
  }

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

export async function setActiveOrg(orgId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (session?.session.activeOrganizationId) {
    const access = await getSessionOrgAccess(session.session.activeOrganizationId);
    if (access.orgSwitchingLocked && orgId !== session.session.activeOrganizationId) {
      throw new Error("Enterprise-managed members cannot create or switch organizations");
    }
  }

  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
    },
  });
}
