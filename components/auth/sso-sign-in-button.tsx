"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function normalizeCallbackURL(callbackURL: string) {
  if (callbackURL.startsWith("/")) return callbackURL;
  return "/app";
}

export function SSOSignInButton({
  callbackURL,
  organizationSlug,
}: {
  callbackURL: string;
  organizationSlug?: string;
}) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = identifier.trim();
    if (!value) return;

    setLoading(true);
    const safeCallbackURL = normalizeCallbackURL(callbackURL);

    const isEmail = value.includes("@");

    const { error } = await authClient.signIn.sso({
      ...(isEmail ? { email: value } : { domain: value.toLowerCase() }),
      ...(organizationSlug ? { organizationSlug } : {}),
      callbackURL: safeCallbackURL,
      errorCallbackURL: "/sign-in",
    });

    if (error) {
      toast.error(error.message || "Failed to start SSO login");
      setLoading(false);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
        <Building2 className="h-4 w-4" />
        Enterprise SSO
      </div>

      <div className="space-y-2">
        <Label htmlFor="sso-identifier" className="text-[11px] uppercase font-bold tracking-wider">
          Work Email or Domain
        </Label>
        <Input
          id="sso-identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@company.com or company.com"
          autoComplete="email"
          required
        />
      </div>

      <Button
        type="submit"
        variant="outline"
        className="w-full h-11 font-bold uppercase tracking-wider"
        disabled={loading || !identifier.trim()}
      >
        {loading ? "Redirecting..." : "Sign In with SSO"}
      </Button>
    </form>
  );
}
