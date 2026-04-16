"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { deleteOrgSSOProvider } from "@/actions/sso";
import type { SSOProviderSummary } from "@/lib/auth/sso";

export function SSOProviderList({
  orgId,
  providers,
  onUpdated,
}: {
  orgId: string;
  providers: SSOProviderSummary[];
  onUpdated: () => Promise<void> | void;
}) {
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(null);

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
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No SSO providers configured yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Issuer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.providerId}>
              <TableCell className="font-medium">{provider.providerId}</TableCell>
              <TableCell className="uppercase text-xs tracking-wider text-muted-foreground">
                {provider.type}
              </TableCell>
              <TableCell>{provider.domain}</TableCell>
              <TableCell className="max-w-[280px] truncate">{provider.issuer}</TableCell>
              <TableCell>
                {provider.domainVerified ? (
                  <Badge variant="default">Verified</Badge>
                ) : (
                  <Badge variant="secondary">Unverified</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(provider.providerId)}
                  disabled={deletingProviderId === provider.providerId}
                  aria-label={`Delete ${provider.providerId}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
