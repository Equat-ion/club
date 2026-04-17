import { Badge } from "@/components/ui/badge";
import type { SSOProviderSummary } from "@/lib/auth/sso";

export function SSOStatusCard({
  providers,
}: {
  providers: SSOProviderSummary[];
}) {
  const providerCount = providers.length;
  const verifiedCount = providers.filter((provider) => provider.domainVerified).length;
  const samlCount = providers.filter((provider) => provider.type === "saml").length;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Enterprise Login
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure SSO providers for this organization.
          </p>
        </div>
        <Badge variant={providerCount > 0 ? "default" : "secondary"}>
          {providerCount > 0 ? "Configured" : "Not configured"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-md border bg-background p-3">
          <p className="text-muted-foreground">Providers</p>
          <p className="text-xl font-semibold">{providerCount}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-muted-foreground">Verified domains</p>
          <p className="text-xl font-semibold">{verifiedCount}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-muted-foreground">SAML providers</p>
          <p className="text-xl font-semibold">{samlCount}</p>
        </div>
      </div>
    </div>
  );
}
