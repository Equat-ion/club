"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enableEnterpriseMode } from "@/actions/enterprise";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface EnterpriseModeCardProps {
  orgId: string;
  initialEnabled: boolean;
}

export function EnterpriseModeCard({ orgId, initialEnabled }: EnterpriseModeCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    if (confirmation !== "ENABLE ENTERPRISE") {
      toast.error("Confirmation text does not match");
      return;
    }

    setLoading(true);
    const result = await enableEnterpriseMode({ orgId, confirmationText: confirmation });
    setLoading(false);

    if (result.success) {
      setEnabled(true);
      toast.success("Enterprise mode enabled permanently");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to enable enterprise mode");
    }
  }

  return (
    <Card className={enabled ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {enabled ? (
            <ShieldCheck className="size-6 text-green-500" />
          ) : (
            <ShieldAlert className="size-6 text-amber-500" />
          )}
          <CardTitle>Enterprise mode</CardTitle>
        </div>
        <CardDescription>
          {enabled
            ? "Your organization is running in Enterprise mode. SCIM provisioning and SAML single sign-on are active."
            : "Convert this organization to a strict Enterprise-managed space."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <p className="text-sm text-muted-foreground">
            Enterprise mode is active. Members are provisioned and managed via SCIM directory sync.
            Non-admin members are locked to this organization.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-1">Warning: Irreversible action</p>
              <p className="leading-relaxed">
                Enabling enterprise mode is permanent. This locks non-admin users to this workspace, routes member management exclusively through SCIM directory synchronization, and enforces single SAML connections. You cannot disable it.
              </p>
            </div>
            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="enterpriseConfirm" className="text-muted-foreground text-xs">
                To confirm, type <span className="font-mono font-semibold text-foreground">ENABLE ENTERPRISE</span>
              </Label>
              <Input
                id="enterpriseConfirm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="ENABLE ENTERPRISE"
                disabled={loading}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant={enabled ? "secondary" : "destructive"}
          disabled={loading || enabled || confirmation !== "ENABLE ENTERPRISE"}
          onClick={handleEnable}
        >
          {enabled ? "Enabled permanently" : "Enable enterprise mode"}
        </Button>
      </CardFooter>
    </Card>
  );
}
