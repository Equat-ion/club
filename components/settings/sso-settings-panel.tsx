"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrgSSOProviders } from "@/actions/sso";
import type { SSOProviderSummary } from "@/lib/auth/sso";
import { SSOStatusCard } from "./sso-status-card";
import { SSOProviderForm } from "./sso-provider-form";
import { SSOProviderList } from "./sso-provider-list";

export function SSOSettingsPanel({
  orgId,
  initialProviders,
}: {
  orgId: string;
  initialProviders: SSOProviderSummary[];
}) {
  const [providers, setProviders] = useState(initialProviders);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshProviders() {
    setRefreshing(true);
    const result = await getOrgSSOProviders(orgId);
    setRefreshing(false);
    if (result.success) {
      setProviders(result.providers);
    }
  }

  return (
    <section className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Enterprise SSO</h2>
          <p className="text-sm text-muted-foreground">
            Register OIDC or SAML identity providers for org members.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshProviders} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <SSOStatusCard providers={providers} />

      <SSOProviderForm orgId={orgId} onRegistered={refreshProviders} />

      <SSOProviderList orgId={orgId} providers={providers} onUpdated={refreshProviders} />
    </section>
  );
}
