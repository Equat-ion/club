"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus, Layers, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateOrgDialog } from "@/components/layout/create-org-dialog";
import { setActiveOrg } from "@/actions/orgs";
import { signOut } from "@/lib/auth/auth-client";

type OrgItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  roleLabel: string;
  plan: string;
};

const MAX_VISIBLE_ORGS = 6;

export function OrgSwitcherGrid({ 
  orgs,
  user
}: { 
  orgs: OrgItem[];
  user: { name: string; image?: string | null; email: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "true");
  const [showAll, setShowAll] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMore = orgs.length > MAX_VISIBLE_ORGS;
  const visibleOrgs = showAll ? orgs : orgs.slice(0, MAX_VISIBLE_ORGS);

  // Track scroll position to show/hide top and bottom fades
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setShowTopFade(el.scrollTop > 8);
      setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [showAll]);

  async function handleSelectOrg(org: OrgItem) {
    await setActiveOrg(org.id);
    router.push(`/app/${org.slug}/home`);
  }

  async function handleLogout() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <>
      {/* Left Column */}
      <div className="w-full md:w-5/12 p-8 md:p-16 flex flex-col border-b md:border-b-0 md:border-r border-border bg-card/20">
        {/* Top: branding + welcome + create button */}
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="size-10 bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Layers className="size-6" />
            </div>
            <span className="text-foreground text-xl font-bold tracking-tight uppercase">thinkraft labs</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight tracking-tighter uppercase">
              Welcome<br />back
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-md">
              Select an organization to continue or create a new workspace for your team.
            </p>
          </div>

          <div className="mt-16">
            <button 
              onClick={() => setCreateOpen(true)}
              className="w-full max-w-xs flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 transition-all shadow-lg shadow-primary/25 uppercase tracking-wider text-sm"
            >
              <Plus className="size-5" />
              <span>Create new organization</span>
            </button>
          </div>
        </div>

        {/* Spacer pushes account info to bottom */}
        <div className="flex-1" />

        {/* Account info + logout pinned to bottom */}
        <div className="pt-12 flex items-center gap-3">
          <Avatar className="size-10 rounded-none border border-border shrink-0">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="ml-auto shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-7/12 flex flex-col overflow-hidden bg-background/60">
        {/* Header — never scrolls */}
        <div className="px-8 md:px-16 pt-8 md:pt-16 pb-6 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Your Organizations</h2>
            <span className="px-4 py-1.5 bg-muted text-muted-foreground text-[10px] font-bold border border-border">
              {orgs.length} ACTIVE
            </span>
          </div>
        </div>

        {/* Org list — only this section scrolls, with top/bottom fades */}
        <div className="relative flex-1 min-h-0">
          {/* Top fade */}
          <div
            className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10 transition-opacity duration-200"
            style={{ opacity: showTopFade ? 1 : 0 }}
          />

          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/90 to-transparent pointer-events-none z-10 transition-opacity duration-200"
            style={{ opacity: showBottomFade ? 1 : 0 }}
          />

          <div ref={scrollRef} className="h-full overflow-y-auto px-8 md:px-16 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleOrgs.map((org) => (
                <button
                  key={org.id}
                  className="group cursor-pointer flex items-center gap-4 p-4 border border-border bg-muted/30 hover:border-primary/50 hover:bg-background transition-all shadow-sm hover:shadow-md text-left"
                  onClick={() => handleSelectOrg(org)}
                >
                  <Avatar className="size-12 shrink-0 rounded-none">
                    {org.logo && <AvatarImage src={org.logo} alt={org.name} />}
                    <AvatarFallback className="rounded-none bg-primary text-primary-foreground font-bold">
                      {org.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-foreground font-bold text-sm truncate group-hover:text-primary transition-colors uppercase tracking-tight">
                      {org.name}
                    </span>
                    <span className="text-muted-foreground text-[10px] flex items-center gap-1 uppercase font-bold tracking-wider">
                      {org.roleLabel}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}

              {orgs.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-border flex flex-col items-center justify-center space-y-4">
                  <p className="text-muted-foreground text-sm uppercase tracking-widest">No organizations found</p>
                </div>
              )}
            </div>

            {/* View more — borderless with fade */}
            {hasMore && !showAll && (
              <div className="relative mt-2">
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  <ChevronDown className="size-4" />
                  View {orgs.length - MAX_VISIBLE_ORGS} more
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer — never scrolls, pinned to bottom */}
        <div className="px-8 md:px-16 py-8 shrink-0 border-t border-border flex flex-col xl:flex-row items-center justify-between gap-6">
          <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
            © 2024 thinkraft labs.
          </p>
          <div className="flex gap-6">
            <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase">Terms</button>
            <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase">Security</button>
            <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase">Help</button>
          </div>
        </div>
      </div>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
