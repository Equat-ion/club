"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrgName, updateOrgLogo } from "@/actions/settings";
import { DeleteOrgDialog } from "./delete-org-dialog";
import { toast } from "sonner";
import type { SSOProviderSummary } from "@/lib/auth/sso";
import { EnterpriseSettingsPanel } from "./enterprise-settings-panel";
import { pickActiveSectionId } from "./section-nav-state";
import { SettingsSectionNav } from "./settings-section-nav";
import { SETTINGS_SECTIONS } from "./settings-sections";

export function SettingsContent({
  orgId,
  orgSlug,
  orgName,
  orgLogo,
  initialSSOProviders,
  enterpriseModeEnabled,
  roles,
  initialMappings,
  initialReviewQueue,
  scimProviderId,
  scimTokenLastFour,
}: {
  orgId: string;
  orgSlug: string;
  orgName: string;
  orgLogo: string | null;
  initialSSOProviders: SSOProviderSummary[];
  enterpriseModeEnabled: boolean;
  roles: Array<{ id: string; name: string; key: string }>;
  initialMappings: Array<{ id: string; groupKey: string; roleId: string }>;
  initialReviewQueue: any[];
  scimProviderId?: string;
  scimTokenLastFour?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(orgName);
  const [logo, setLogo] = useState(orgLogo ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    SETTINGS_SECTIONS[0].id,
  );
  const orderedSectionIds = useMemo(
    () => SETTINGS_SECTIONS.map((section) => section.id),
    [],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setActiveSectionId((current) =>
          pickActiveSectionId(
            entries.map((entry) => ({
              id: entry.target.id,
              isIntersecting: entry.isIntersecting,
            })),
            current,
            orderedSectionIds,
          ),
        );
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    for (const id of orderedSectionIds) {
      const target = document.getElementById(id);
      if (target) {
        observer.observe(target);
      }
    }

    return () => observer.disconnect();
  }, [orderedSectionIds]);

  function navigateToSection(id: string) {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSectionId(id);
  }

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
    <div className="relative lg:pr-64">
      <div className="max-w-3xl space-y-10">
        <section id="org-name" className="scroll-mt-24 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Organization Name</h3>
            <p className="text-sm text-muted-foreground">
              This is the display name of your organization.
            </p>
          </div>
          <form onSubmit={handleSaveName} className="max-w-xl space-y-3">
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
            <div className="flex items-center justify-between">
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
            </div>
          </form>
        </section>

        <section id="logo" className="scroll-mt-24 space-y-4 border-t pt-8">
          <div>
            <h3 className="text-lg font-medium">Logo</h3>
            <p className="text-sm text-muted-foreground">
              Provide a URL for your organization&apos;s logo.
            </p>
          </div>
          <form onSubmit={handleSaveLogo} className="max-w-xl space-y-3">
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Use a square image for best results.
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={savingLogo || logo.trim() === (orgLogo ?? "")}
              >
                {savingLogo ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </section>

        <section id="enterprise" className="scroll-mt-24 space-y-4 border-t pt-8">
          <EnterpriseSettingsPanel
            orgId={orgId}
            orgSlug={orgSlug}
            enterpriseModeEnabled={enterpriseModeEnabled}
            initialSSOProviders={initialSSOProviders}
            roles={roles}
            initialMappings={initialMappings}
            initialReviewQueue={initialReviewQueue}
            scimProviderId={scimProviderId}
            scimTokenLastFour={scimTokenLastFour}
          />
        </section>

        <section id="danger" className="scroll-mt-24 border-t pt-8">
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
            <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanent actions for this workspace. Review carefully before
              continuing.
            </p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-md border bg-background p-4">
              <div>
                <p className="text-sm font-medium">Delete this organization</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This removes members, tasks, settings, and plugin data
                  permanently.
                </p>
              </div>
              <DeleteOrgDialog orgId={orgId} orgName={orgName} orgSlug={orgSlug} />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed right-8 top-24 hidden w-56 lg:block">
        <SettingsSectionNav
          sections={SETTINGS_SECTIONS}
          activeSectionId={activeSectionId}
          onNavigate={navigateToSection}
        />
      </div>
    </div>
  );
}
