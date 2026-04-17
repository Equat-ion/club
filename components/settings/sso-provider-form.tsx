"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registerSAMLSSOProvider } from "@/actions/sso";

export function SSOProviderForm({
  orgId,
  onRegistered,
}: {
  orgId: string;
  onRegistered: () => Promise<void> | void;
}) {
  const [providerId, setProviderId] = useState("");
  const [issuer, setIssuer] = useState("");
  const [domain, setDomain] = useState("");

  const [entryPoint, setEntryPoint] = useState("");
  const [certificate, setCertificate] = useState("");
  const [audience, setAudience] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const baseMissing =
    !providerId.trim() || !issuer.trim() || !domain.trim();
  const samlMissing = !entryPoint.trim() || !certificate.trim();
  const disabled = submitting || baseMissing || samlMissing;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    setSubmitting(true);

    const result = await registerSAMLSSOProvider({
      orgId,
      providerId,
      issuer,
      domain,
      entryPoint,
      certificate,
      audience,
      callbackUrl,
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("SAML provider registered");

    setProviderId("");
    setIssuer("");
    setDomain("");
    setEntryPoint("");
    setCertificate("");
    setAudience("");
    setCallbackUrl("");

    await onRegistered();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="providerId">Provider ID</Label>
          <Input
            id="providerId"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            placeholder="acme-saml"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="domain">Email domain(s)</Label>
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com or example.com,sub.example.com"
            required
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="issuer">Issuer URL</Label>
          <Input
            id="issuer"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="https://idp.example.com"
            type="url"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="entryPoint">SAML entry point</Label>
        <Input
          id="entryPoint"
          value={entryPoint}
          onChange={(e) => setEntryPoint(e.target.value)}
          placeholder="https://idp.example.com/sso/saml"
          type="url"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="audience">Audience (optional)</Label>
        <Input
          id="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="https://app.example.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="callbackUrl">Callback URL (optional)</Label>
        <Input
          id="callbackUrl"
          value={callbackUrl}
          onChange={(e) => setCallbackUrl(e.target.value)}
          placeholder="https://app.example.com/api/auth/sso/saml2/sp/acs/acme-saml"
          type="url"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="certificate">X.509 certificate</Label>
        <Textarea
          id="certificate"
          value={certificate}
          onChange={(e) => setCertificate(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE-----"
          className="min-h-32 font-mono text-xs"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {submitting ? "Saving..." : "Register provider"}
        </Button>
      </div>
    </form>
  );
}
