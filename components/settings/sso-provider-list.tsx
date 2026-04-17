"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteOrgSSOProvider } from "@/actions/sso";
import type { SSOProviderSummary } from "@/lib/auth/sso";
import { formatDisplayPath, splitDomainList } from "./sso-provider-list-utils";

function buildMetadataPath(providerId: string) {
  return `/api/auth/sso/saml2/sp/metadata?providerId=${encodeURIComponent(providerId)}`;
}

function buildAcsPath(providerId: string) {
  return `/api/auth/sso/saml2/sp/acs/${encodeURIComponent(providerId)}`;
}

function buildSpEntityId(providerId: string) {
  return `/api/auth/sso/saml2/sp/metadata?providerId=${encodeURIComponent(providerId)}`;
}

function formatAcsUrl(provider: SSOProviderSummary) {
  return provider.samlConfig?.callbackUrl || buildAcsPath(provider.providerId);
}

export function SSOProviderList({
  orgId,
  providers,
  onUpdated,
}: {
  orgId: string;
  providers: SSOProviderSummary[];
  onUpdated: () => Promise<void> | void;
}) {
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(
    null,
  );

  async function handleDelete(providerId: string) {
    setDeletingProviderId(providerId);
    const result = await deleteOrgSSOProvider({ orgId, providerId });
    setDeletingProviderId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Provider removed");
    await onUpdated();
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        No SSO providers configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <article key={provider.providerId} className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{provider.providerId}</p>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {provider.type}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                {splitDomainList(provider.domain).map((domain) => (
                  <span
                    key={`${provider.providerId}-${domain}`}
                    className="rounded-sm bg-muted px-1.5 py-0.5"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
            <Badge variant={provider.domainVerified ? "default" : "secondary"}>
              {provider.domainVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>

          <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">SP Entity ID</dt>
              <dd className="break-all font-mono">
                {provider.type === "saml"
                  ? formatDisplayPath(buildSpEntityId(provider.providerId))
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">ACS URL</dt>
              <dd className="break-all font-mono">
                {provider.type === "saml"
                  ? formatDisplayPath(formatAcsUrl(provider))
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Issuer</dt>
              <dd className="break-all">{provider.issuer}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Metadata</dt>
              <dd>
                {provider.type === "saml" ? (
                  <a
                    href={buildMetadataPath(provider.providerId)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    Open metadata
                  </a>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(provider.providerId)}
              disabled={deletingProviderId === provider.providerId}
              aria-label={`Delete ${provider.providerId}`}
            >
              {deletingProviderId === provider.providerId ? "Removing..." : "Remove"}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
