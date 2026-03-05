"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateOrgName, updateOrgLogo } from "@/actions/settings";
import { DeleteOrgDialog } from "./delete-org-dialog";
import { toast } from "sonner";

export function SettingsContent({
  orgId,
  orgSlug,
  orgName,
  orgLogo,
}: {
  orgId: string;
  orgSlug: string;
  orgName: string;
  orgLogo: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(orgName);
  const [logo, setLogo] = useState(orgLogo ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === orgName) return;

    setSavingName(true);
    const result = await updateOrgName(orgId, name.trim());
    setSavingName(false);

    if (result.success) {
      toast.success("Organization name updated");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update name");
    }
  }

  async function handleSaveLogo(e: React.FormEvent) {
    e.preventDefault();
    const logoValue = logo.trim() || null;
    if (logoValue === (orgLogo ?? "")) return;

    setSavingLogo(true);
    const result = await updateOrgLogo(orgId, logoValue);
    setSavingLogo(false);

    if (result.success) {
      toast.success("Organization logo updated");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update logo");
    }
  }

  return (
    <div className="space-y-6">
      {/* Org Name */}
      <Card>
        <form onSubmit={handleSaveName}>
          <CardHeader>
            <CardTitle>Organization Name</CardTitle>
            <CardDescription>
              This is the display name of your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="orgName">Name</Label>
              <Input
                id="orgName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Organization name"
                maxLength={100}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Maximum 100 characters.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={savingName || !name.trim() || name.trim() === orgName}
            >
              {savingName ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Org Logo */}
      <Card>
        <form onSubmit={handleSaveLogo}>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Provide a URL for your organization&apos;s logo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="orgLogo">Logo URL</Label>
              <Input
                id="orgLogo"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Use a square image for best results.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={
                savingLogo || logo.trim() === (orgLogo ?? "")
              }
            >
              {savingLogo ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium text-sm">Delete this organization</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, all data associated with this organization will be
                permanently removed. This action cannot be undone.
              </p>
            </div>
            <DeleteOrgDialog
              orgId={orgId}
              orgName={orgName}
              orgSlug={orgSlug}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
