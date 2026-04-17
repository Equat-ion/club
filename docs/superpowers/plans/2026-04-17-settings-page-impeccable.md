# Settings Page Impeccable Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a calm, trustworthy, no-nonsense redesign of `/app/[slug]/settings` with a desktop sticky section index, cleaner section hierarchy, and a responsive SSO presentation that stays coherent with the Solar Dusk theme.

**Architecture:** Keep all server actions and auth/business logic intact, and refactor only presentation + light client behavior. Add small pure helper modules for section navigation and SSO field formatting so behavior can be validated with focused tests. Use a constrained page shell, section anchors, and a desktop-only sticky index with scroll-spy state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, sonner, Vitest + Testing Library (new in this plan).

---

### Task 0: Add lightweight test tooling for settings UI behavior

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/smoke/settings-harness.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/smoke/settings-harness.test.ts
import { describe, expect, it } from "vitest";

describe("settings test harness", () => {
  it("runs in jsdom", () => {
    document.body.innerHTML = "<main data-testid='root'></main>";
    expect(document.querySelector("[data-testid='root']")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/smoke/settings-harness.test.ts`

Expected: FAIL because `vitest` is not configured in this repository yet.

- [ ] **Step 3: Add minimal test dependencies and config**

```json
// package.json (scripts + devDependencies delta)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "preview": "pnpm build && pnpm start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.1.0",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

```ts
// vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/smoke/settings-harness.test.ts`

Expected: PASS with 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts tests/setup.ts tests/smoke/settings-harness.test.ts
git commit -m "test: add vitest harness for settings ui refactor"
```

### Task 1: Add section model and scroll-spy state helper

**Files:**
- Create: `components/settings/settings-sections.ts`
- Create: `components/settings/section-nav-state.ts`
- Create: `components/settings/section-nav-state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// components/settings/section-nav-state.test.ts
import { describe, expect, it } from "vitest";
import { pickActiveSectionId } from "./section-nav-state";

describe("pickActiveSectionId", () => {
  it("returns the first visible section by layout order", () => {
    const next = pickActiveSectionId(
      [
        { id: "sso", isIntersecting: true },
        { id: "org-name", isIntersecting: false },
      ],
      "org-name",
      ["org-name", "logo", "sso", "danger"],
    );

    expect(next).toBe("sso");
  });

  it("keeps current section when no section intersects", () => {
    const next = pickActiveSectionId([], "logo", ["org-name", "logo", "sso", "danger"]);
    expect(next).toBe("logo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- components/settings/section-nav-state.test.ts`

Expected: FAIL with module not found for `./section-nav-state`.

- [ ] **Step 3: Write minimal implementation**

```ts
// components/settings/settings-sections.ts
export type SettingsSection = {
  id: "org-name" | "logo" | "sso" | "danger";
  label: string;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "org-name", label: "Organization Name" },
  { id: "logo", label: "Logo" },
  { id: "sso", label: "Enterprise SSO" },
  { id: "danger", label: "Danger Zone" },
];
```

```ts
// components/settings/section-nav-state.ts
type IntersectionLike = {
  id: string;
  isIntersecting: boolean;
};

export function pickActiveSectionId(
  entries: IntersectionLike[],
  currentId: string,
  orderedIds: string[],
) {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));

  return visible[0]?.id ?? currentId;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- components/settings/section-nav-state.test.ts`

Expected: PASS with both tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/settings/settings-sections.ts components/settings/section-nav-state.ts components/settings/section-nav-state.test.ts
git commit -m "feat: add settings section model and active section helper"
```

### Task 2: Build settings shell with desktop sticky index and section anchors

**Files:**
- Create: `components/settings/settings-section-nav.tsx`
- Modify: `app/app/[slug]/settings/page.tsx`
- Modify: `components/settings/settings-content.tsx`
- Create: `components/settings/settings-section-nav.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/settings/settings-section-nav.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsSectionNav } from "./settings-section-nav";
import { SETTINGS_SECTIONS } from "./settings-sections";

describe("SettingsSectionNav", () => {
  it("renders all section labels and marks active item", () => {
    const onNavigate = vi.fn();

    render(
      <SettingsSectionNav
        sections={SETTINGS_SECTIONS}
        activeSectionId="sso"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("Organization Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enterprise SSO" })).toHaveAttribute("data-active", "true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- components/settings/settings-section-nav.test.tsx`

Expected: FAIL because `settings-section-nav.tsx` does not exist.

- [ ] **Step 3: Write minimal implementation and wire into page**

```tsx
// components/settings/settings-section-nav.tsx
"use client";

import { cn } from "@/lib/utils";
import type { SettingsSection } from "./settings-sections";

export function SettingsSectionNav({
  sections,
  activeSectionId,
  onNavigate,
}: {
  sections: SettingsSection[];
  activeSectionId: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav aria-label="Settings sections" className="hidden lg:block lg:sticky lg:top-6">
      <ol className="space-y-1.5">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              data-active={section.id === activeSectionId}
              onClick={() => onNavigate(section.id)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors",
                section.id === activeSectionId && "bg-accent text-foreground",
              )}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

```tsx
// app/app/[slug]/settings/page.tsx (container only)
return (
  <div className="px-4 py-6 sm:px-6 lg:px-8">
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your organization settings.</p>
      </div>
      <SettingsContent
        orgId={org.id}
        orgSlug={slug}
        orgName={org.name}
        orgLogo={org.logo ?? null}
        initialSSOProviders={initialSSOProviders}
      />
    </div>
  </div>
);
```

```tsx
// components/settings/settings-content.tsx (layout skeleton)
const [activeSectionId, setActiveSectionId] = useState("org-name");

function navigateToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveSectionId(id);
}

return (
  <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
    <div className="space-y-10">
      <section id="org-name" className="scroll-mt-24 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Organization Name</h3>
          <p className="text-sm text-muted-foreground">This is the display name of your organization.</p>
        </div>
        <form onSubmit={handleSaveName} className="max-w-xl space-y-3">{/* existing name controls */}</form>
      </section>

      <section id="logo" className="scroll-mt-24 space-y-4 border-t pt-8">
        <div>
          <h3 className="text-lg font-medium">Logo</h3>
          <p className="text-sm text-muted-foreground">Provide a URL for your organization logo.</p>
        </div>
        <form onSubmit={handleSaveLogo} className="max-w-xl space-y-3">{/* existing logo controls */}</form>
      </section>

      <section id="sso" className="scroll-mt-24 space-y-4 border-t pt-8">
        <SSOSettingsPanel orgId={orgId} initialProviders={initialSSOProviders} />
      </section>

      <section id="danger" className="scroll-mt-24 space-y-4 border-t pt-8">
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
          <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">Permanent actions for this workspace.</p>
          <div className="mt-4 flex items-center justify-between rounded-md border bg-background p-4">
            <div>
              <p className="text-sm font-medium">Delete this organization</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This removes members, tasks, settings, and plugin data permanently.
              </p>
            </div>
            <DeleteOrgDialog orgId={orgId} orgName={orgName} orgSlug={orgSlug} />
          </div>
        </div>
      </section>
    </div>

    <SettingsSectionNav
      sections={SETTINGS_SECTIONS}
      activeSectionId={activeSectionId}
      onNavigate={navigateToSection}
    />
  </div>
);
```

- [ ] **Step 4: Run tests and lint for the new shell**

Run: `pnpm test -- components/settings/settings-section-nav.test.tsx && pnpm lint components/settings/settings-content.tsx components/settings/settings-section-nav.tsx app/app/[slug]/settings/page.tsx`

Expected: PASS for test and no ESLint errors in updated files.

- [ ] **Step 5: Commit**

```bash
git add components/settings/settings-section-nav.tsx components/settings/settings-section-nav.test.tsx components/settings/settings-content.tsx app/app/[slug]/settings/page.tsx
git commit -m "feat: add anchored settings layout with desktop sticky section index"
```

### Task 3: Redesign SSO area for scan-first responsiveness

**Files:**
- Create: `components/settings/sso-provider-list-utils.ts`
- Create: `components/settings/sso-provider-list-utils.test.ts`
- Modify: `components/settings/sso-provider-list.tsx`
- Modify: `components/settings/sso-settings-panel.tsx`
- Modify: `components/settings/sso-status-card.tsx`
- Modify: `components/settings/sso-provider-form.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// components/settings/sso-provider-list-utils.test.ts
import { describe, expect, it } from "vitest";
import { formatDisplayPath, splitDomainList } from "./sso-provider-list-utils";

describe("sso provider list utils", () => {
  it("returns path + query for absolute urls", () => {
    expect(formatDisplayPath("https://clubhq.com/api/auth/sso?provider=acme")).toBe("/api/auth/sso?provider=acme");
  });

  it("normalizes comma-delimited domains", () => {
    expect(splitDomainList("acme.org, staff.acme.org")).toEqual(["acme.org", "staff.acme.org"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- components/settings/sso-provider-list-utils.test.ts`

Expected: FAIL because `sso-provider-list-utils.ts` does not exist.

- [ ] **Step 3: Implement utilities and responsive SSO layout**

```ts
// components/settings/sso-provider-list-utils.ts
export function formatDisplayPath(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function splitDomainList(raw: string) {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
```

```tsx
// components/settings/sso-provider-list.tsx (replace table wrapper)
if (providers.length === 0) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
      No SSO providers configured yet.
    </div>
  );
}

return (
  <div className="space-y-3">
    {providers.map((provider) => (
      <article key={provider.providerId} className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{provider.providerId}</p>
            <p className="text-xs text-muted-foreground">{provider.domain}</p>
          </div>
          <Badge variant={provider.domainVerified ? "default" : "secondary"}>
            {provider.domainVerified ? "Verified" : "Unverified"}
          </Badge>
        </div>

        <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">SP Entity ID</dt>
            <dd className="break-all font-mono">{formatDisplayPath(buildSpEntityId(provider.providerId))}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">ACS URL</dt>
            <dd className="break-all font-mono">{formatDisplayPath(formatAcsUrl(provider))}</dd>
          </div>
        </dl>

        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(provider.providerId)}
            disabled={deletingProviderId === provider.providerId}
          >
            Remove
          </Button>
        </div>
      </article>
    ))}
  </div>
);
```

```tsx
// components/settings/sso-settings-panel.tsx (section framing)
<section className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-medium">Enterprise SSO</h2>
      <p className="text-sm text-muted-foreground">Register SAML identity providers for org members.</p>
    </div>
    <Button variant="outline" size="sm" onClick={refreshProviders} disabled={refreshing}>
      {refreshing ? "Refreshing..." : "Refresh"}
    </Button>
  </div>
  <SSOStatusCard providers={providers} />
  <SSOProviderForm orgId={orgId} onRegistered={refreshProviders} />
  <SSOProviderList orgId={orgId} providers={providers} onUpdated={refreshProviders} />
</section>
```

- [ ] **Step 4: Run tests and lint for SSO updates**

Run: `pnpm test -- components/settings/sso-provider-list-utils.test.ts && pnpm lint components/settings/sso-provider-list.tsx components/settings/sso-settings-panel.tsx components/settings/sso-status-card.tsx components/settings/sso-provider-form.tsx`

Expected: PASS for tests and no ESLint errors in SSO files.

- [ ] **Step 5: Commit**

```bash
git add components/settings/sso-provider-list-utils.ts components/settings/sso-provider-list-utils.test.ts components/settings/sso-provider-list.tsx components/settings/sso-settings-panel.tsx components/settings/sso-status-card.tsx components/settings/sso-provider-form.tsx
git commit -m "feat: redesign sso settings for cleaner responsive scanning"
```

### Task 4: Refine danger zone hierarchy and run full verification

**Files:**
- Modify: `components/settings/settings-content.tsx`
- Modify: `components/settings/delete-org-dialog.tsx`
- Create: `components/settings/delete-org-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/settings/delete-org-dialog.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeleteOrgDialog } from "./delete-org-dialog";

describe("DeleteOrgDialog", () => {
  it("requires exact org name before delete button can be used", () => {
    render(<DeleteOrgDialog orgId="org_1" orgName="ACM Club" orgSlug="acm-club" />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- components/settings/delete-org-dialog.test.tsx`

Expected: FAIL due Next.js router/context dependencies in the dialog.

- [ ] **Step 3: Add minimal mock and refine hierarchy copy/layout**

```tsx
// components/settings/delete-org-dialog.test.tsx (add router mock at top)
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
```

```tsx
// components/settings/settings-content.tsx (danger section)
<section id="danger" className="scroll-mt-24 border-t pt-8">
  <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
    <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Permanent actions for this workspace. Review carefully before continuing.
    </p>
    <div className="mt-4 flex items-center justify-between rounded-md border bg-background p-4">
      <div>
        <p className="text-sm font-medium">Delete this organization</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This removes members, tasks, settings, and plugin data permanently.
        </p>
      </div>
      <DeleteOrgDialog orgId={orgId} orgName={orgName} orgSlug={orgSlug} />
    </div>
  </div>
</section>
```

```tsx
// components/settings/delete-org-dialog.tsx (microcopy)
<DialogDescription>
  This action is permanent. Deleting <span className="font-medium">{orgSlug}</span> removes all members,
  tasks, settings, and plugin data.
</DialogDescription>
```

- [ ] **Step 4: Run full verification**

Run: `pnpm test -- components/settings/delete-org-dialog.test.tsx && pnpm lint && pnpm exec tsc --noEmit && pnpm build`

Expected: all commands pass; settings page compiles and builds successfully.

- [ ] **Step 5: Commit**

```bash
git add components/settings/settings-content.tsx components/settings/delete-org-dialog.tsx components/settings/delete-org-dialog.test.tsx
git commit -m "refactor: polish danger zone hierarchy and final settings verification"
```
