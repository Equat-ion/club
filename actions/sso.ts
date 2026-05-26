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

import { requireOrgPermission } from "@/lib/authz/guards";

async function ensureOrgAdmin(orgId: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { ok: false as const, error: "Not authenticated" };
  }

  try {
    await requireOrgPermission(orgId, "enterprise.manage");
  } catch (err: any) {
    return {
      ok: false as const,
      error: err.message || "Unauthorized",
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

type ParsedSamlMetadata = {
  issuer: string;
  entryPoint: string;
  certificate: string;
};

type UnknownRecord = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getRecordValue(record: UnknownRecord, key: string) {
  return record[key];
}

function formatCertificate(rawCert: string) {
  const normalized = rawCert
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  const wrapped = normalized.match(/.{1,64}/g)?.join("\n") ?? normalized;
  return `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----`;
}

function pickMetadataEntityDescriptor(parsed: unknown) {
  if (!isRecord(parsed)) return null;
  const entityDescriptor = getRecordValue(parsed, "EntityDescriptor");
  if (entityDescriptor) {
    return (asArray(entityDescriptor)[0] as UnknownRecord) ?? null;
  }
  const entitiesDescriptor = getRecordValue(parsed, "EntitiesDescriptor");
  if (isRecord(entitiesDescriptor)) {
    const nestedDescriptor = getRecordValue(entitiesDescriptor, "EntityDescriptor");
    if (nestedDescriptor) {
      return (asArray(nestedDescriptor)[0] as UnknownRecord) ?? null;
    }
  }
  return null;
}

function pickMetadataEntryPoint(idpDescriptor: unknown) {
  if (!isRecord(idpDescriptor)) return null;
  const services = asArray(getRecordValue(idpDescriptor, "SingleSignOnService"));
  const redirectService = services.find((service) => {
    if (!isRecord(service)) return false;
    const binding = getRecordValue(service, "Binding") ?? getRecordValue(service, "binding");
    return typeof binding === "string" && binding.includes("HTTP-Redirect");
  });
  const target = redirectService ?? services[0];
  if (!isRecord(target)) return null;
  const location = getRecordValue(target, "Location") ?? getRecordValue(target, "location");
  return typeof location === "string" ? location : null;
}

function pickMetadataCertificate(idpDescriptor: unknown) {
  if (!isRecord(idpDescriptor)) return null;
  const keyDescriptors = asArray(getRecordValue(idpDescriptor, "KeyDescriptor"));
  const signingKey = keyDescriptors.find((key) => {
    if (!isRecord(key)) return false;
    const use =
      (getRecordValue(key, "use") ?? getRecordValue(key, "Use") ?? "")
        .toString()
        .toLowerCase();
    return use === "signing";
  });
  const candidate = signingKey ?? keyDescriptors[0];
  if (!isRecord(candidate)) return null;
  const keyInfo =
    getRecordValue(candidate, "KeyInfo") ??
    getRecordValue(candidate, "keyInfo") ??
    getRecordValue(candidate, "keyinfo");
  if (!isRecord(keyInfo)) return null;
  const x509Data =
    getRecordValue(keyInfo, "X509Data") ??
    getRecordValue(keyInfo, "x509Data") ??
    getRecordValue(keyInfo, "x509data");
  if (!isRecord(x509Data)) return null;
  const certValue = asArray(getRecordValue(x509Data, "X509Certificate"))[0];
  if (!certValue) return null;
  if (typeof certValue === "string") return certValue;
  if (isRecord(certValue)) {
    const textValue = getRecordValue(certValue, "#text");
    if (typeof textValue === "string") return textValue;
  }
  return null;
}

async function parseSamlMetadataXml(xml: string): Promise<ParsedSamlMetadata | null> {
  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    removeNSPrefix: true,
    trimValues: true,
  });
  const parsed = parser.parse(xml) as unknown;
  const entityDescriptor = pickMetadataEntityDescriptor(parsed);
  if (!entityDescriptor) return null;
  const issuerValue =
    getRecordValue(entityDescriptor, "entityID") ??
    getRecordValue(entityDescriptor, "EntityID");
  const issuer = typeof issuerValue === "string" ? issuerValue : "";
  const idpDescriptor = asArray(getRecordValue(entityDescriptor, "IDPSSODescriptor"))[0];
  const entryPoint = pickMetadataEntryPoint(idpDescriptor);
  const certificate = pickMetadataCertificate(idpDescriptor);
  if (!issuer || !entryPoint || !certificate) return null;
  return {
    issuer,
    entryPoint,
    certificate: formatCertificate(certificate),
  };
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

export async function parseSAMLMetadataUrl(input: {
  orgId: string;
  metadataUrl: string;
}): Promise<ActionResult<ParsedSamlMetadata>> {
  const adminCheck = await ensureOrgAdmin(input.orgId);
  if (!adminCheck.ok) {
    return { success: false, error: adminCheck.error };
  }

  const metadataUrl = input.metadataUrl.trim();
  if (!metadataUrl) {
    return { success: false, error: "Metadata URL is required" };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(metadataUrl);
  } catch {
    return { success: false, error: "Metadata URL is invalid" };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { success: false, error: "Metadata URL must use http or https" };
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/xml,text/xml,*/*",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch metadata (HTTP ${response.status})`,
      };
    }

    const xml = await response.text();
    const parsedMetadata = await parseSamlMetadataXml(xml);
    if (!parsedMetadata) {
      return {
        success: false,
        error: "Metadata missing issuer, SSO entry point, or certificate",
      };
    }

    return { success: true, ...parsedMetadata };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse metadata URL";
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

  try {
    const existingProviders = await auth.api.listSSOProviders({ headers: adminCheck.headers });
    const existingForOrg = existingProviders.providers.filter(
      (provider) => provider.organizationId === input.orgId,
    );
    if (existingForOrg.length > 0) {
      return { success: false, error: "Only one SAML provider is allowed per organization" };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to check existing providers" };
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
