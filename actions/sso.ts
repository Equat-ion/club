"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema/auth";
import type { SSOProviderSummary } from "@/lib/auth/sso";

type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string };

async function ensureOrgAdmin(orgId: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { ok: false as const, error: "Not authenticated" };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id),
    ),
  });

  if (!membership || membership.role !== "owner") {
    return {
      ok: false as const,
      error: "Only the Admin can manage enterprise login",
    };
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (!org) {
    return { ok: false as const, error: "Organization not found" };
  }

  return {
    ok: true as const,
    headers: requestHeaders,
    org,
  };
}

function parseDomains(rawDomain: string) {
  return rawDomain
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeCertificate(cert: string) {
  return cert
    .replace("-----BEGIN CERTIFICATE-----", "")
    .replace("-----END CERTIFICATE-----", "")
    .replace(/\s+/g, "")
    .trim();
}

function buildIdPMetadataXml(input: {
  issuer: string;
  entryPoint: string;
  certificate: string;
}) {
  const cert = normalizeCertificate(input.certificate);
  return `<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(input.issuer)}"><IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>${escapeXml(cert)}</ds:X509Certificate></ds:X509Data></ds:KeyInfo></KeyDescriptor><SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(input.entryPoint)}"/><SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(input.entryPoint)}"/></IDPSSODescriptor></EntityDescriptor>`;
}

export async function getOrgSSOProviders(
  orgId: string,
): Promise<ActionResult<{ providers: SSOProviderSummary[] }>> {
  const adminCheck = await ensureOrgAdmin(orgId);
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  try {
    const response = await auth.api.listSSOProviders({
      headers: adminCheck.headers,
    });

    const providers = response.providers.filter(
      (provider) => provider.organizationId === orgId,
    );

    return { success: true, providers };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load SSO providers";
    return { success: false, error: message };
  }
}

export async function registerOIDCSSOProvider(input: {
  orgId: string;
  providerId: string;
  issuer: string;
  domain: string;
  clientId: string;
  clientSecret: string;
}): Promise<ActionResult<{ providerId: string }>> {
  const adminCheck = await ensureOrgAdmin(input.orgId);
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  const providerId = input.providerId.trim();
  const issuer = input.issuer.trim();
  const domain = parseDomains(input.domain);
  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret.trim();

  if (!providerId || !issuer || !domain || !clientId || !clientSecret) {
    return { success: false, error: "All OIDC fields are required" };
  }

  try {
    await auth.api.registerSSOProvider({
      headers: adminCheck.headers,
      body: {
        providerId,
        issuer,
        domain,
        organizationId: input.orgId,
        oidcConfig: {
          clientId,
          clientSecret,
        },
      },
    });

    revalidatePath(`/app/${adminCheck.org.slug}/settings`);

    return { success: true, providerId };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to register OIDC provider";
    return { success: false, error: message };
  }
}

export async function registerSAMLSSOProvider(input: {
  orgId: string;
  providerId: string;
  issuer: string;
  domain: string;
  entryPoint: string;
  certificate: string;
  callbackUrl?: string;
  audience?: string;
}): Promise<ActionResult<{ providerId: string }>> {
  const adminCheck = await ensureOrgAdmin(input.orgId);
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  const providerId = input.providerId.trim();
  const issuer = input.issuer.trim();
  const domain = parseDomains(input.domain);
  const entryPoint = input.entryPoint.trim();
  const cert = input.certificate.trim();
  const callbackUrl = input.callbackUrl?.trim() || undefined;
  const audience = input.audience?.trim() || undefined;
  const resolvedCallbackUrl =
    callbackUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml2/sp/acs/${providerId}`;
  const idpMetadataXml = buildIdPMetadataXml({
    issuer,
    entryPoint,
    certificate: cert,
  });

  if (!providerId || !issuer || !domain || !entryPoint || !cert) {
    return { success: false, error: "All required SAML fields must be filled" };
  }

  try {
    await auth.api.registerSSOProvider({
      headers: adminCheck.headers,
      body: {
        providerId,
        issuer,
        domain,
        organizationId: input.orgId,
        samlConfig: {
          entryPoint,
          cert,
          callbackUrl: resolvedCallbackUrl,
          idpMetadata: {
            metadata: idpMetadataXml,
            singleSignOnService: [
              {
                Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                Location: entryPoint,
              },
            ],
          },
          spMetadata: {
            entityID: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/saml2/sp/metadata?providerId=${providerId}`,
          },
          ...(audience ? { audience } : {}),
        },
      },
    });

    revalidatePath(`/app/${adminCheck.org.slug}/settings`);

    return { success: true, providerId };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to register SAML provider";
    return { success: false, error: message };
  }
}

export async function deleteOrgSSOProvider(input: {
  orgId: string;
  providerId: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminCheck = await ensureOrgAdmin(input.orgId);
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  try {
    await auth.api.deleteSSOProvider({
      headers: adminCheck.headers,
      body: {
        providerId: input.providerId,
      },
    });

    revalidatePath(`/app/${adminCheck.org.slug}/settings`);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete SSO provider";
    return { success: false, error: message };
  }
}
