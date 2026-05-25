"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateScimToken } from "@/actions/enterprise";
import { CopyableValue } from "./copyable-value";
import { toast } from "sonner";
import { KeyRound, ShieldAlert } from "lucide-react";

interface ScimSettingsCardProps {
  orgId: string;
  initialProviderId?: string;
  initialTokenLastFour?: string;
}

export function ScimSettingsCard({ orgId, initialProviderId = "", initialTokenLastFour = "" }: ScimSettingsCardProps) {
  const [providerId, setProviderId] = useState(initialProviderId);
  const [lastFour, setLastFour] = useState(initialTokenLastFour);
  const [loading, setLoading] = useState(false);
  const [scimUrl, setScimUrl] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScimUrl(`${window.location.origin}/api/auth/scim/v2`);
    }
  }, []);

  async function handleGenerateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId.trim()) {
      toast.error("Directory Provider ID is required");
      return;
    }

    setLoading(true);
    const result = await generateScimToken({ orgId, providerId: providerId.trim() });
    setLoading(false);

    if (result.success && result.token) {
      setGeneratedToken(result.token);
      setLastFour(result.token.slice(-4));
      toast.success("SCIM Directory token generated");
    } else {
      toast.error(result.error ?? "Failed to generate token");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <KeyRound className="size-6 text-primary" />
          <CardTitle>SCIM Directory Provisioning</CardTitle>
        </div>
        <CardDescription>
          Sync users and groups automatically from Okta, Azure AD, or JumpCloud.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scimUrl && (
          <CopyableValue label="SCIM Base URL" value={scimUrl} />
        )}

        {generatedToken && (
          <div className="space-y-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">SCIM Bearer Token Generated</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Copy this token now. It will not be shown again for security reasons.
                </p>
              </div>
            </div>
            <CopyableValue label="Bearer Token" value={generatedToken} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGeneratedToken(null)}
            >
              Done copying
            </Button>
          </div>
        )}

        <form onSubmit={handleGenerateToken} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="providerId">Directory Provider ID</Label>
            <Input
              id="providerId"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="e.g. okta-directory"
              disabled={loading || !!lastFour}
            />
            <p className="text-xs text-muted-foreground">
              A unique identifier for this SCIM connection.
            </p>
          </div>

          {lastFour && !generatedToken && (
            <div className="rounded-lg border bg-muted/20 p-3.5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SCIM Connection Status:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider ID:</span>
                <span className="font-mono">{providerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Secret:</span>
                <span className="font-mono text-muted-foreground">••••••••••••••••{lastFour}</span>
              </div>
            </div>
          )}

          {!lastFour && (
            <Button type="submit" disabled={loading || !providerId.trim()}>
              {loading ? "Generating..." : "Generate SCIM Directory Token"}
            </Button>
          )}

          {lastFour && !generatedToken && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                if (confirm("Are you sure you want to rotate the SCIM token? The old token will stop working immediately.")) {
                  setLastFour("");
                  setGeneratedToken(null);
                }
              }}
            >
              Rotate Directory Token
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
