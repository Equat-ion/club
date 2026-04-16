import { Badge } from "@/components/ui/badge";
import type { SSOProviderSummary } from "@/lib/auth/sso";

export function SSOStatusCard({
  providers,
}: {
  providers: SSOProviderSummary[];
}) {
  const providerCount = providers.length;
  const verifiedCount = providers.filter((provider) => provider.domainVerified).length;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider">Enterprise Login</h3>
          <p className="text-sm text-muted-foreground">
            Configure SSO providers for this organization.
          </p>
        </div>
        <Badge variant={providerCount > 0 ? "default" : "secondary"}>
          {providerCount > 0 ? "Configured" : "Not configured"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground">Providers</p>
          <p className="text-xl font-semibold">{providerCount}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground">Verified domains</p>
          <p className="text-xl font-semibold">{verifiedCount}</p>
        </div>
      </div>
    </div>
  );
}
