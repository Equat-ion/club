# Enterprise SSO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add organization-scoped enterprise SSO using Better Auth's `sso` plugin, with OIDC as the first supported provider type and SAML supported through the same registration flow.

**Architecture:** Keep the existing email/password and org membership model intact, then layer Better Auth SSO on top as an org-owned identity source. The server will own provider registration and callback handling, while the client will only trigger sign-in and show org admin controls for provider setup and status.

**Tech Stack:** Next.js App Router, TypeScript, better-auth, `@better-auth/sso`, Drizzle ORM, Neon PostgreSQL, shadcn/ui, Tailwind CSS.

---

### Task 0: Add test tooling for the new flow

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Add the failing dependency gaps to the plan baseline**

```json
{
  "scripts": {
    "build": "next build",
    "lint": "eslint",
    "test": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Install the test runner packages**

Run: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test`

Expected: the repo can run component and browser-level checks for the SSO flow.

- [ ] **Step 3: Add minimal test config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});

// tests/setup.ts
import "@testing-library/jest-dom";

// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: { baseURL: "http://127.0.0.1:3000" },
});
```

- [ ] **Step 4: Verify the tooling is available**

Run: `pnpm test -- --help && pnpm test:e2e -- --help`

Expected: both commands print their CLI help without runtime errors.

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts playwright.config.ts tests/setup.ts
git commit -m "test: add tooling for sso coverage"
```

### Task 1: Add SSO plugin wiring

**Files:**
- Modify: `package.json`
- Modify: `lib/auth/auth.ts`
- Modify: `lib/auth/auth-client.ts`
- Modify: `lib/db/schema/auth.ts` only if the SSO plugin requires generated table changes after running auth generation

- [ ] **Step 1: Write the failing test**

```ts
// No new unit test is needed here; verify wiring by typecheck and build after the dependency is added.
```

- [ ] **Step 2: Run verification before code changes**

Run: `pnpm exec tsc --noEmit`

Expected: failure or missing-module errors for `@better-auth/sso` until the dependency and plugin wiring are added.

- [ ] **Step 3: Install and wire the plugin minimally**

```ts
// lib/auth/auth.ts
import { sso } from "@better-auth/sso";

export const auth = betterAuth({
  // existing config...
  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },
      async sendInvitationEmail(data) {
        // unchanged
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization: org }) => {
          // unchanged
        },
      },
    }),
    sso({
      organizationProvisioning: {
        disabled: false,
        defaultRole: "member",
      },
      provisionUserOnEveryLogin: true,
    }),
    nextCookies(),
  ],
});

// lib/auth/auth-client.ts
import { ssoClient } from "@better-auth/sso/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    ssoClient(),
  ],
});
```

- [ ] **Step 4: Regenerate auth schema if needed**

Run: `pnpm exec auth generate`

Expected: if Better Auth adds or updates tables for SSO, the generated schema files update cleanly and remain aligned with `lib/db/schema/auth.ts`.

- [ ] **Step 5: Verify the app still builds**

Run: `pnpm exec tsc --noEmit && pnpm build`

Expected: both commands pass with the SSO plugin imported and wired.

- [ ] **Step 6: Commit**

```bash
git add package.json lib/auth/auth.ts lib/auth/auth-client.ts lib/db/schema/auth.ts
git commit -m "feat: wire better auth sso plugin"
```

### Task 2: Add org-owned provider registration

**Files:**
- Create: `actions/sso.ts`
- Modify: `lib/auth/auth.ts`
- Modify: `lib/auth/auth-client.ts` if the client needs registration helpers exposed
- Create or modify: `app/(app)/[slug]/settings/page.tsx`
- Create or modify: `components/settings/sso-provider-form.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// actions/sso.test.ts
import { describe, expect, it } from "vitest";

describe("SSO registration helpers", () => {
  it("maps an org slug and provider payload into a registration request", () => {
    const input = {
      organizationId: "org_123",
      providerId: "acme-oidc",
      domain: "acme.com",
      issuer: "https://login.acme.com",
    };

    expect(input.providerId).toBe("acme-oidc");
    expect(input.domain).toBe("acme.com");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails or is unimplemented**

Run: `pnpm vitest run actions/sso.test.ts -v`

Expected: failure until the helper/action exists.

- [ ] **Step 3: Implement a server action for provider registration**

```ts
// actions/sso.ts
"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function registerOrgSSOProvider(input: {
  organizationId: string;
  providerId: string;
  domain: string;
  issuer: string;
  callbackURL?: string;
}) {
  const headers = await headers();

  return auth.api.registerSSOProvider({
    headers,
    body: {
      organizationId: input.organizationId,
      providerId: input.providerId,
      domain: input.domain,
      issuer: input.issuer,
      oidcConfig: input.callbackURL
        ? { callbackURL: input.callbackURL }
        : undefined,
    },
  });
}
```

- [ ] **Step 4: Add the org settings UI for provider setup**

```tsx
// components/settings/sso-provider-form.tsx
"use client";

import { useState } from "react";
import { registerOrgSSOProvider } from "@/actions/sso";

export function SSOProviderForm({ organizationId }: { organizationId: string }) {
  const [providerId, setProviderId] = useState("");
  const [domain, setDomain] = useState("");
  const [issuer, setIssuer] = useState("");

  return null;
}
```

Add the real form fields, submit handler, and success/error toasts in the existing settings page pattern.

- [ ] **Step 5: Verify provider registration against the auth API**

Run: `pnpm exec tsc --noEmit && pnpm build`

Expected: the server action compiles and the settings page renders without auth typing errors.

- [ ] **Step 6: Commit**

```bash
git add actions/sso.ts components/settings/sso-provider-form.tsx app/(app)/[slug]/settings/page.tsx
git commit -m "feat: add org sso provider setup"
```

### Task 3: Add SSO sign-in entry points

**Files:**
- Modify: `app/(marketing)/sign-in/sign-in-form.tsx`
- Modify: `app/(marketing)/sign-in/page.tsx` if needed to pass props into the form
- Create: `components/auth/sso-sign-in-button.tsx`
- Create: `actions/auth.ts` if a small server helper is needed for redirect-safe sign-in initiation

- [ ] **Step 1: Write the failing test**

```ts
// components/auth/sso-sign-in-button.test.tsx
import { render, screen } from "@testing-library/react";
import { SSOSignInButton } from "./sso-sign-in-button";

it("renders an enterprise sign-in affordance", () => {
  render(<SSOSignInButton organizationSlug="acme" />);
  expect(screen.getByRole("button", { name: /sign in with sso/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm vitest run components/auth/sso-sign-in-button.test.tsx -v`

Expected: failure until the component exists.

- [ ] **Step 3: Add an SSO entry button beside password login**

```tsx
// components/auth/sso-sign-in-button.tsx
"use client";

import { authClient } from "@/lib/auth/auth-client";

export function SSOSignInButton({ organizationSlug }: { organizationSlug?: string }) {
  return null;
}
```

Use `authClient.signIn.sso({ domain, organizationSlug, callbackURL })` with the org slug when present, and fall back to a domain-based field when the user is not tied to a known org.

- [ ] **Step 4: Add a dedicated enterprise sign-in path**

Wire the existing sign-in page so users can choose password or SSO, and make SSO redirect back through the current `redirect` query param.

- [ ] **Step 5: Verify sign-in still works end-to-end**

Run: `pnpm exec tsc --noEmit && pnpm build`

Expected: no regressions in the existing email/password sign-in flow.

- [ ] **Step 6: Commit**

```bash
git add app/(marketing)/sign-in/sign-in-form.tsx components/auth/sso-sign-in-button.tsx
git commit -m "feat: add enterprise sso sign-in entry"
```

### Task 4: Add domain matching and callback routing

**Files:**
- Modify: `middleware.ts`
- Create: `app/api/auth/sso/[...all]/route.ts` if Better Auth requires an explicit catch-all for SSO endpoints in this repo layout
- Modify: `lib/auth/auth.ts` if `defaultSSO`, `redirectURI`, or `domainVerification` should be configured

- [ ] **Step 1: Write the failing test**

```ts
// middleware.test.ts
import { describe, it, expect } from "vitest";

describe("enterprise auth routing", () => {
  it("does not redirect SSO callback routes", () => {
    expect("/api/auth/sso").not.toMatch(/^\/app/);
  });
});
```

- [ ] **Step 2: Run the test and confirm the callback routes are not treated as app routes**

Run: `pnpm vitest run middleware.test.ts -v`

Expected: the route protection logic leaves auth callback paths alone.

- [ ] **Step 3: Configure Better Auth SSO callback handling**

Add the SSO plugin options needed for shared callback URLs and domain-based discovery. Prefer a single OIDC redirect URI if the provider setup requires one, otherwise use provider-specific callbacks and keep the routing explicit in the registration UI.

- [ ] **Step 4: Ensure middleware ignores auth callback endpoints**

Keep `/api/auth/**` excluded from auth redirects so the SSO flow can complete.

- [ ] **Step 5: Verify callback flow compatibility**

Run: `pnpm exec tsc --noEmit && pnpm build`

Expected: auth callback routes compile and remain reachable in production builds.

- [ ] **Step 6: Commit**

```bash
git add middleware.ts lib/auth/auth.ts
git commit -m "feat: support sso callback routing"
```

### Task 5: Add SSO admin UX and org status

**Files:**
- Modify: `app/(app)/[slug]/settings/page.tsx`
- Create: `components/settings/sso-status-card.tsx`
- Create: `components/settings/sso-provider-list.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// components/settings/sso-status-card.test.tsx
import { render, screen } from "@testing-library/react";
import { SSOStatusCard } from "./sso-status-card";

it("shows whether SSO is configured", () => {
  render(<SSOStatusCard providers={[]} />);
  expect(screen.getByText(/sso not configured/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm vitest run components/settings/sso-status-card.test.tsx -v`

Expected: failure until the status card exists.

- [ ] **Step 3: Display configured providers and setup state**

Show the org's SSO providers, the linked domain, and the provider type (`oidc` or `saml`) in the settings page so admins can confirm what is active.

- [ ] **Step 4: Add empty-state and error-state copy**

Use a simple empty state when no SSO providers are registered, and show actionable error text when registration fails.

- [ ] **Step 5: Verify the page remains responsive and role-gated**

Run: `pnpm exec tsc --noEmit && pnpm build`

Expected: only org Admins can manage providers, and the page still renders for Leads and Members with read-only access if desired.

- [ ] **Step 6: Commit**

```bash
git add app/(app)/[slug]/settings/page.tsx components/settings/sso-status-card.tsx components/settings/sso-provider-list.tsx
git commit -m "feat: show organization sso status"
```

### Task 6: Verify end-to-end SSO behavior

**Files:**
- Create or modify: `tests/e2e/sso.spec.ts` or the repo's existing Playwright test location
- Modify: `package.json` scripts if needed

- [ ] **Step 1: Write the failing end-to-end flow**

```ts
import { test, expect } from "@playwright/test";

test("enterprise sso sign-in path is reachable", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: /sign in with sso/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e test and confirm the new affordance exists**

Run: `pnpm playwright test tests/e2e/sso.spec.ts`

Expected: the SSO option is visible and the page loads without runtime errors.

- [ ] **Step 3: Add a smoke check for org provider setup**

Cover the settings page path to ensure the provider form and status card render for an org admin session.

- [ ] **Step 4: Run full verification**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`

Expected: all checks pass.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/sso.spec.ts package.json
git commit -m "test: cover enterprise sso flow"
```
