"use client";

import { useState } from "react";
import { EnterpriseModeCard } from "./enterprise-mode-card";
import { ScimSettingsCard } from "./scim-settings-card";
import { GroupMappingCard } from "./group-mapping-card";
import { EnterpriseReviewQueue } from "./enterprise-review-queue";
import { SSOSettingsPanel } from "./sso-settings-panel";
import type { SSOProviderSummary } from "@/lib/auth/sso";

interface RoleOption {
  id: string;
  name: string;
  key: string;
}

interface MappingItem {
  id: string;
  groupKey: string;
  roleId: string;
}

interface ReviewEntry {
  id: string;
  memberId: string;
  userId: string;
  status: string;
  scimGroups: any;
  samlGroups: any;
  alignmentState: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

interface EnterpriseSettingsPanelProps {
  orgId: string;
  orgSlug: string;
  enterpriseModeEnabled: boolean;
  initialSSOProviders: SSOProviderSummary[];
  roles: RoleOption[];
  initialMappings: MappingItem[];
  initialReviewQueue: ReviewEntry[];
  scimProviderId?: string;
  scimTokenLastFour?: string;
}

export function EnterpriseSettingsPanel({
  orgId,
  orgSlug,
  enterpriseModeEnabled,
  initialSSOProviders,
  roles,
  initialMappings,
  initialReviewQueue,
  scimProviderId,
  scimTokenLastFour,
}: EnterpriseSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <EnterpriseModeCard orgId={orgId} initialEnabled={enterpriseModeEnabled} />
      
      {enterpriseModeEnabled && (
        <>
          <SSOSettingsPanel orgId={orgId} initialProviders={initialSSOProviders} />
          <ScimSettingsCard
            orgId={orgId}
            initialProviderId={scimProviderId}
            initialTokenLastFour={scimTokenLastFour}
          />
          <GroupMappingCard orgId={orgId} roles={roles} initialMappings={initialMappings} />
          <EnterpriseReviewQueue orgId={orgId} roles={roles} initialQueue={initialReviewQueue} />
        </>
      )}
    </div>
  );
}
