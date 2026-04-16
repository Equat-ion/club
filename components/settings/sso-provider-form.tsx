"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  registerOIDCSSOProvider,
  registerSAMLSSOProvider,
} from "@/actions/sso";
import type { SSOProviderType } from "@/lib/auth/sso";

export function SSOProviderForm({
  orgId,
  onRegistered,
}: {
  orgId: string;
  onRegistered: () => Promise<void> | void;
}) {
  const [providerType, setProviderType] = useState<SSOProviderType>("oidc");
  const [providerId, setProviderId] = useState("");
  const [issuer, setIssuer] = useState("");
  const [domain, setDomain] = useState("");

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const [entryPoint, setEntryPoint] = useState("");
  const [certificate, setCertificate] = useState("");
  const [audience, setAudience] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const baseMissing =
    !providerId.trim() || !issuer.trim() || !domain.trim();
  const oidcMissing = !clientId.trim() || !clientSecret.trim();
  const samlMissing = !entryPoint.trim() || !certificate.trim();
  const disabled =
    submitting || baseMissing || (providerType === "oidc" ? oidcMissing : samlMissing);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    setSubmitting(true);

    const result =
      providerType === "oidc"
        ? await registerOIDCSSOProvider({
            orgId,
            providerId,
            issuer,
            domain,
            clientId,
            clientSecret,
          })
        : await registerSAMLSSOProvider({
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

    toast.success(
      providerType === "oidc"
        ? "OIDC provider registered"
        : "SAML provider registered",
    );

    setProviderId("");
    setIssuer("");
    setDomain("");
    setClientId("");
    setClientSecret("");
    setEntryPoint("");
    setCertificate("");
    setAudience("");
    setCallbackUrl("");

    await onRegistered();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-2">
        <Label htmlFor="providerType">Provider type</Label>
        <Select
          value={providerType}
          onValueChange={(value) => setProviderType(value as SSOProviderType)}
        >
          <SelectTrigger id="providerType" className="w-full">
            <SelectValue placeholder="Choose type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oidc">OIDC</SelectItem>
            <SelectItem value="saml">SAML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="providerId">Provider ID</Label>
        <Input
          id="providerId"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          placeholder="acme-oidc"
          required
        />
      </div>

      <div className="grid gap-2">
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

      {providerType === "oidc" ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clientSecret">Client secret</Label>
            <Input
              id="clientSecret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              type="password"
              required
            />
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {submitting ? "Saving..." : "Register provider"}
        </Button>
      </div>
    </form>
  );
}
