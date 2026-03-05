"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOrgDialog } from "@/components/layout/create-org-dialog";
import { setActiveOrg } from "@/actions/orgs";

type OrgItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  roleLabel: string;
  plan: string;
};

export function OrgSwitcherGrid({ orgs }: { orgs: OrgItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  // Open create dialog if ?create=true is in the URL
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  async function handleSelectOrg(org: OrgItem) {
    await setActiveOrg(org.id);
    router.push(`/app/${org.slug}/home`);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {orgs.map((org) => (
          <Card
            key={org.id}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => handleSelectOrg(org)}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="size-12 rounded-lg">
                {org.logo && <AvatarImage src={org.logo} alt={org.name} />}
                <AvatarFallback className="rounded-lg">
                  {org.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <CardTitle className="text-base">{org.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>/{org.slug}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {org.roleLabel}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {org.plan}
                  </Badge>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}

        {/* Create new org card */}
        <Card
          className="cursor-pointer border-dashed transition-colors hover:bg-accent/50"
          onClick={() => setCreateOpen(true)}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-base">Create organisation</CardTitle>
              <CardDescription>
                Set up a new club or team
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
