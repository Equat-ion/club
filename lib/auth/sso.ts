export type SSOProviderType = "oidc" | "saml";

export type SSOProviderSummary = {
  providerId: string;
  type: "oidc" | "saml" | string;
  issuer: string;
  domain: string;
  organizationId: string | null;
  domainVerified: boolean;
  spMetadataUrl: string;
  samlConfig?: {
    callbackUrl?: string;
  };
};
