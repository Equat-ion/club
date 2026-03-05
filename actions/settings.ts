"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Update org name.
 * Only the owner (Admin) can update org settings.
 */
export async function updateOrgName(
  orgId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is the owner of this org
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only the Admin can update org settings" };
  }

  if (!name.trim()) {
    return { success: false, error: "Name is required" };
  }

  // Update via better-auth API
  const result = await auth.api.updateOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
      data: { name: name.trim() },
    },
  });

  if (!result) {
    return { success: false, error: "Failed to update organization" };
  }

  // Get the org slug for revalidation
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (org) {
    revalidatePath(`/app/${org.slug}/settings`);
    revalidatePath(`/app/${org.slug}`);
    revalidatePath("/app");
  }

  return { success: true };
}

/**
 * Update org logo URL.
 * Only the owner (Admin) can update org settings.
 */
export async function updateOrgLogo(
  orgId: string,
  logo: string | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only the Admin can update org settings" };
  }

  const result = await auth.api.updateOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
      data: { logo: logo ?? undefined },
    },
  });

  if (!result) {
    return { success: false, error: "Failed to update logo" };
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (org) {
    revalidatePath(`/app/${org.slug}/settings`);
    revalidatePath(`/app/${org.slug}`);
    revalidatePath("/app");
  }

  return { success: true };
}

/**
 * Delete an organization.
 * Only the owner (Admin) can delete.
 */
export async function deleteOrg(
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only the Admin can delete the organization" };
  }

  // Delete via better-auth API (cascades handle related data)
  try {
    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: orgId },
    });
  } catch {
    return { success: false, error: "Failed to delete organization" };
  }

  revalidatePath("/app");
  return { success: true };
}
