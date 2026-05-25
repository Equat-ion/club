"use client";

import { useEffect } from "react";
import { setActiveOrg } from "@/actions/orgs";

type Props = {
  orgId: string;
  activeOrgId?: string | null;
};

export function SyncActiveOrg({ orgId, activeOrgId }: Props) {
  useEffect(() => {
    if (activeOrgId && orgId !== activeOrgId) {
      setActiveOrg(orgId).catch((err) => {
        console.error("Failed to sync active organization session:", err);
      });
    }
  }, [orgId, activeOrgId]);

  return null;
}
