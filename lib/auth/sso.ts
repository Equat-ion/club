export type SSOProviderType = "oidc" | "saml";

export type SSOProviderSummary = {
  providerId: string;
  type: string;
  issuer: string;
  domain: string;
  organizationId: string | null;
  domainVerified: boolean;
  spMetadataUrl: string;
};
