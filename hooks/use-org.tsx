"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";

export type OrgData = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  role: string; // internal role: "owner" | "admin" | "member"
  memberId: string;
};

const OrgContext = createContext<OrgData | null>(null);

export function OrgProvider({
  org,
  children,
}: {
  org: OrgData;
  children: ReactNode;
}) {
  return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
