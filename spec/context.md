# Club — Full Context Dump

> Generated: 2026-03-05
> Purpose: Complete state snapshot for LLM session continuity

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Progress](#2-current-progress)
3. [Discoveries & Gotchas](#3-discoveries--gotchas)
4. [File Tree](#4-file-tree)
5. [Full File Contents](#5-full-file-contents)
   - [Root Config](#51-root-config)
   - [Auth & Permissions](#52-auth--permissions)
   - [Database](#53-database)
   - [Plugins](#54-plugins)
   - [Server Actions](#55-server-actions)
   - [Hooks](#56-hooks)
   - [App Routes](#57-app-routes)
   - [Layout Components](#58-layout-components)
   - [Member Components](#59-member-components)
   - [Task Components](#510-task-components)
   - [Styles](#511-styles)
   - [Settings Components](#512-settings-components)
   - [Billing Components](#513-billing-components)
   - [Phase 6: Polish](#514-phase-6-polish)
6. [What's Next](#6-whats-next)

---

## 1. Project Overview

Club is a multi-tenant SaaS platform for student organizations. The full product spec lives at `spec/product.md` (911 lines). It defines 6 implementation phases (Phase 0-6).

**Tech stack:** Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4, shadcn/ui (new-york style), better-auth + organization plugin + stripe plugin, Drizzle ORM, Neon PostgreSQL, Stripe.

**Key conventions:**
- Package manager: `pnpm` only (no npm/npx)
- IDs: cuid2
- Slugs: URL-safe lowercase unique strings
- Data fetching: Server Components + Server Actions (no tRPC, no React Query)
- Client components only for interactive UI (forms, dropdowns, modals)
- better-auth client imports from `better-auth/react` for Next.js
- Role mapping: `owner` → "Admin" (UI), `admin` → "Lead" (UI), `member` → "Member" (UI)
- Plugin system: first-party only, plan-gated (free plan gets Task Management)

---

## 2. Current Progress

### Phase 0 — Foundation ✅ COMPLETE
All tasks done: dependencies, env config, Drizzle+Neon setup, all schema files (auth, orgs, members, tasks), permissions/access control, better-auth server+client config with org plugin hooks and stripe plugin, auth API route, middleware, plugin registry.

### Phase 1 — Auth & Onboarding 🔄 PARTIALLY COMPLETE
- ✅ Sign in page (`app/(marketing)/sign-in/page.tsx`)
- ✅ Sign up page (`app/(marketing)/sign-up/page.tsx`)
- ✅ Marketing landing page (`app/(marketing)/page.tsx`)
- ✅ Root layout with Toaster (`app/layout.tsx`)
- ⬜ Email verification flow (TODO — console.log placeholder in auth.ts)
- ⬜ Password reset flow
- ⬜ Post-sign-up redirect logic (currently redirects to /app)

### Phase 2 — Org Shell ✅ COMPLETE
- ✅ App layout with SidebarProvider (`app/app/layout.tsx`)
- ✅ Org context provider (`hooks/use-org.tsx`) + `[slug]/layout.tsx`
- ✅ Org switcher full-screen page (`app/app/page.tsx` + `app/app/org-switcher-grid.tsx`)
- ✅ Sidebar org switcher dropdown (`components/layout/org-switcher.tsx`)
- ✅ Full sidebar with core nav + plugin nav, role-gated items (`components/layout/app-sidebar.tsx`)
- ✅ User nav in sidebar footer (`components/layout/user-nav.tsx`)
- ✅ Org creation flow via dialog (`components/layout/create-org-dialog.tsx`)
- ✅ Server actions for org creation + setActive (`actions/orgs.ts`)
- ✅ Server-side session helpers (`lib/auth/session.ts`)
- ✅ Accept invitation page with all states (`app/accept-invitation/[invitationId]/page.tsx` + `accept-invitation-client.tsx`)
- ✅ Placeholder pages for all [slug] routes (home, members, settings, billing, tasks)
- ✅ Route conflict fixed (`(app)` → `app` directory)
- ✅ TypeScript passes with 0 errors

### Phase 3 — Member Management ✅ COMPLETE
- ✅ Server actions for member management (`actions/members.ts`): `getMembers`, `getPendingInvitations`, `getOrgMemberInfo`, `inviteMember`, `cancelInvitation`, `removeMember`, `updateMemberRole`
- ✅ Members page server component (`app/app/[slug]/members/page.tsx`) — fetches session, org, membership, loads data in parallel
- ✅ Members content with tabs (`components/members/members-content.tsx`) — Members / Pending Invitations tabs, member count/limit/plan badge, Invite button (role-gated)
- ✅ Members table (`components/members/members-table.tsx`) — avatar, name, email, role badge with icons, joined date, actions dropdown (owner-only)
- ✅ Invite member dialog (`components/members/invite-member-dialog.tsx`) — email + role selector, Leads can only invite Members, Admins can invite Members or Leads
- ✅ Pending invitations table (`components/members/pending-invitations.tsx`) — email, role, invited by, expiry date, cancel button
- ✅ Change role dialog (`components/members/change-role-dialog.tsx`) — owner-only, can assign Lead or Member roles
- ✅ Remove member dialog (`components/members/remove-member-dialog.tsx`) — owner-only confirmation
- ✅ TypeScript passes with 0 errors
- ⬜ Invite link generation (shareable invite links) — not implemented (secondary feature)

### Phase 4 — Task Management Plugin ✅ COMPLETE
- ✅ Plugin registry + `org_plugins` table integration (done in Phase 0)
- ✅ Shared types and constants (`lib/plugins/tasks-types.ts`)
- ✅ Server actions (`actions/tasks.ts`): `getIssues`, `getIssue`, `getIssueComments`, `getIssueActivity`, `getOrgMembers`, `createIssue` (atomic identifier generation), `updateIssue` (with activity logging), `deleteIssue`, `addComment`, `deleteComment`
- ✅ Issues list page (`/:slug/tasks`) — grouped by status with collapsible sections
- ✅ Create issue dialog — title, description, status, priority, assignee, due date
- ✅ Issue detail page (`/:slug/tasks/[issueId]`) — inline-editable title/description, sidebar metadata panel
- ✅ Status, priority, assignee, due date fields — dedicated select components with icons
- ✅ Issue activity log — tracks created/status_change/priority_change/assignment/comment events
- ✅ Comments — add/delete with role-gated permissions
- ✅ Issue identifier generation (e.g. `ACM-1`, `ACM-2`, ...) — atomic counter via `orgProfiles.issueCounter`
- ✅ TypeScript passes with 0 errors

### Phase 5 — Settings & Billing ✅ COMPLETE
- ✅ Server actions (`actions/settings.ts`): `updateOrgName`, `updateOrgLogo`, `deleteOrg` — all owner-only with auth checks
- ✅ Settings page (`app/app/[slug]/settings/page.tsx`) — server component with auth + ownership verification, renders `SettingsContent`
- ✅ Settings content (`components/settings/settings-content.tsx`) — org name form, logo URL form, danger zone with delete dialog
- ✅ Delete org dialog (`components/settings/delete-org-dialog.tsx`) — type-to-confirm pattern, blocks if paid subscription active
- ✅ Billing page (`app/app/[slug]/billing/page.tsx`) — server component with auth + ownership verification, fetches subscription data, renders `BillingContent`
- ✅ Billing content (`components/billing/billing-content.tsx`) — current plan display, manage billing portal, plan comparison grid (Free/Plus/Enterprise), upgrade via Stripe Checkout, Enterprise "Contact Us" mailto
- ✅ No custom billing server actions needed — billing operations go through better-auth's Stripe plugin client endpoints
- ✅ TypeScript passes with 0 errors

### Phase 6 — Polish ✅ COMPLETE
- ✅ Home dashboard (`app/app/[slug]/home/page.tsx`) — server component with 4 stat cards (Total Tasks, To Do, In Progress, Done), Members card, Quick Actions card, Recent Activity feed (last 10 activities with actor, description, time ago). Parallel DB queries.
- ✅ Loading skeletons (7 files): `app/app/loading.tsx`, `[slug]/home/loading.tsx`, `[slug]/members/loading.tsx`, `[slug]/settings/loading.tsx`, `[slug]/billing/loading.tsx`, `[slug]/tasks/loading.tsx`, `[slug]/tasks/[issueId]/loading.tsx`
- ✅ Error boundaries (2 files): `app/error.tsx` (global), `app/app/[slug]/error.tsx` (org workspace — catches all child route errors)
- ✅ Not-found pages (2 files): `app/not-found.tsx` (global 404), `app/app/[slug]/not-found.tsx` (org-scoped 404)
- ✅ Empty states — already handled: issues board has empty state, dashboard activity has empty state, members always has ≥1 member
- ✅ SEO metadata: root layout enhanced with Open Graph + Twitter Card defaults + title template, landing page metadata, sign-in/sign-up layout metadata wrappers
- ✅ TypeScript passes with 0 errors

### shadcn/ui Components Installed (22)
avatar, badge, button, card, collapsible, command, dialog, dropdown-menu, input, label, popover, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, table, tabs, textarea, tooltip

---

## 3. Discoveries & Gotchas

- better-auth v1.5.3 requires `@better-auth/drizzle-adapter` as a separate package (installed)
- The `stripe()` plugin requires `stripeWebhookSecret` as a required field — was missing initially, fixed
- better-auth's Drizzle schema uses snake_case column names in PostgreSQL (e.g., `email_verified`, `created_at`, `user_id`)
- The organization plugin adds `activeOrganizationId` to the session table
- The stripe plugin adds `stripeCustomerId` to both `user` and `organization` tables, and creates a `subscription` table
- `node_modules` LSP errors about `@better-auth/core`, `better-call`, `zod` are benign — they're internal better-auth type issues, not our code
- **Route groups like `(app)` do NOT create URL segments in Next.js** — so `app/(app)/page.tsx` resolves to `/`, not `/app`. This caused a build conflict with `app/(marketing)/page.tsx`. Fixed by renaming `(app)` to literal `app` directory, so `app/app/` maps to URL `/app`.
- Tailwind CSS v4 has no `tailwind.config.ts` — configuration is done purely via `postcss.config.mjs` and CSS (`app/globals.css` with `@import "tailwindcss"` and `@theme inline`)
- `pnpm tsc --noEmit` passes with 0 errors
- Next.js 16 shows a deprecation warning: `"middleware" file convention is deprecated. Please use "proxy" instead` — we kept middleware.ts per the spec for now
- JSX files in `hooks/` need `.tsx` extension, not `.ts` (discovered with `use-org`)
- better-auth's `removeMember` API uses `memberIdOrEmail` not `memberId` as the parameter name
- better-auth's `createInvitation` and `updateMemberRole` APIs require role typed as `"member" | "admin" | "owner"` (not generic `string`). The `OrgRole` type in `actions/members.ts` enforces this.
- better-auth server-side API signatures:
  - `auth.api.createInvitation({ headers, body: { email, role, organizationId } })`
  - `auth.api.removeMember({ headers, body: { memberIdOrEmail, organizationId } })`
  - `auth.api.updateMemberRole({ headers, body: { memberId, role, organizationId } })`
  - `auth.api.cancelInvitation({ headers, body: { invitationId } })`
  - `auth.api.listInvitations({ headers, query: { organizationId } })` — returns all statuses, filter client-side for pending
- **`"use server"` files in Next.js can ONLY export async functions**. Non-async exports (constants, types) cause build errors. Solution: extracted `ISSUE_STATUSES`, `ISSUE_PRIORITIES`, and all shared types to `lib/plugins/tasks-types.ts`
- **Drizzle ORM atomic increment pattern**: `sql\`${orgProfiles.issueCounter} + 1\`` in `.set()` with `.returning()` to get the new value
- **Issue identifier format**: `ORG_SLUG_UPPER-COUNTER` with dashes stripped from slug (e.g., slug `acm-club` → `ACMCLUB-1`)
- For joining user table twice (assignee + creator), used a two-query approach: main query joins creator, then batch-fetches assignees via `IN` clause to avoid aliased self-join complexity
- The `collapsible` shadcn component was installed for the grouped-by-status view
- **better-auth Stripe plugin provides full client-side API** for billing: `authClient.subscription.upgrade()`, `.list()`, `.cancel()`, `.billingPortal()`, `.restore()` — no custom server actions needed for billing operations
- **better-auth org plugin server-side API**: `auth.api.updateOrganization({ headers, body: { organizationId, data: { name, slug, logo, metadata } } })`, `auth.api.deleteOrganization({ headers, body: { organizationId } })` — used for settings actions
- Org deletion must check for active paid Stripe subscription before proceeding — query `subscription` table where `referenceId = orgId` and `status = 'active'` and `plan !== 'free'`
- Settings and billing pages are owner-only — sidebar already gates visibility, but server components also enforce ownership via `membership.role !== "owner"` redirect
- **Error boundaries must be `"use client"` components** — they receive `error` and `reset` props from Next.js
- **Not-found pages** are server components by default in Next.js
- **One error boundary at `[slug]/error.tsx`** catches errors from ALL child routes (home, members, tasks, settings, billing) — no need for per-page error files
- **The org workspace layout** (`app/app/[slug]/layout.tsx`) already calls `notFound()` for invalid slugs, which triggers `not-found.tsx`
- **Sign-in/sign-up are `"use client"` components** and cannot export `metadata` — solved by creating `layout.tsx` wrappers in each route that export metadata and pass children through
- **Next.js title template**: setting `title: { default: "...", template: "%s | Club" }` in root layout allows child routes to set just `title: "Sign In"` and it renders as "Sign In | Club"
- **`metadataBase`** is needed in root layout for Open Graph URLs to resolve correctly — uses `NEXT_PUBLIC_APP_URL` env var

---

## 4. File Tree

```
club/
├── .env.example
├── .gitignore
├── components.json
├── drizzle.config.ts
├── eslint.config.mjs
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── tsconfig.json
│
├── spec/
│   ├── product.md              # Full product specification (911 lines, source of truth)
│   └── context.md              # This file
│
├── actions/
│   ├── orgs.ts                 # createOrg(), setActiveOrg()
│   ├── members.ts              # getMembers(), getPendingInvitations(), getOrgMemberInfo(), inviteMember(), cancelInvitation(), removeMember(), updateMemberRole()
│   ├── settings.ts             # updateOrgName(), updateOrgLogo(), deleteOrg()
│   └── tasks.ts                # getIssues(), getIssue(), getIssueComments(), getIssueActivity(), getOrgMembers(), createIssue(), updateIssue(), deleteIssue(), addComment(), deleteComment()
│
├── app/
│   ├── globals.css             # Tailwind v4 theme + CSS variables
│   ├── error.tsx              # Global error boundary (client component)
│   ├── not-found.tsx          # Global 404 page
│   ├── layout.tsx              # Root layout (fonts + Toaster + SEO metadata)
│   │
│   ├── (marketing)/
│   │   ├── page.tsx            # Landing page (with SEO metadata)
│   │   ├── sign-in/
│   │   │   ├── layout.tsx      # Sign-in metadata wrapper
│   │   │   └── page.tsx        # Sign in (client component)
│   │   └── sign-up/
│   │       ├── layout.tsx      # Sign-up metadata wrapper
│   │       └── page.tsx        # Sign up (client component)
│   │
│   ├── api/auth/[...all]/
│   │   └── route.ts            # better-auth handler
│   │
│   ├── app/
│   │   ├── layout.tsx          # Authenticated shell (session check, SidebarProvider)
│   │   ├── loading.tsx         # Org switcher loading skeleton
│   │   ├── page.tsx            # Org switcher full-screen page (server component)
│   │   ├── org-switcher-grid.tsx  # Org grid (client component)
│   │   │
│   │   └── [slug]/
│   │       ├── layout.tsx      # Org workspace layout (OrgProvider + sidebar)
│   │       ├── error.tsx       # Org workspace error boundary (catches all child routes)
│   │       ├── not-found.tsx   # Org-scoped 404 page
│   │       ├── page.tsx        # Redirect to /home
│   │       ├── home/
│   │       │   ├── page.tsx    # Dashboard (stats, members, activity) — Phase 6
│   │       │   └── loading.tsx # Dashboard loading skeleton
│   │       ├── members/
│   │       │   ├── page.tsx    # Member management (Phase 3)
│   │       │   └── loading.tsx # Members loading skeleton
│   │       ├── settings/
│   │       │   ├── page.tsx    # Org settings — name, logo, delete (Phase 5)
│   │       │   └── loading.tsx # Settings loading skeleton
│   │       ├── billing/
│   │       │   ├── page.tsx    # Plan management + Stripe billing (Phase 5)
│   │       │   └── loading.tsx # Billing loading skeleton
│   │       └── tasks/
│   │           ├── page.tsx      # Task list page (Phase 4)
│   │           ├── loading.tsx   # Tasks loading skeleton
│   │           └── [issueId]/
│   │               ├── page.tsx  # Issue detail page (Phase 4)
│   │               └── loading.tsx # Issue detail loading skeleton
│   │
│   └── accept-invitation/[invitationId]/
│       ├── page.tsx            # Accept invitation (server component)
│       └── accept-invitation-client.tsx  # Accept invitation (client component)
│
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx     # Full sidebar (core nav + plugin nav, role-gated)
│   │   ├── create-org-dialog.tsx # Create org modal dialog
│   │   ├── org-switcher.tsx    # Sidebar org switcher dropdown
│   │   └── user-nav.tsx        # User avatar dropdown with sign out
│   │
│   ├── members/
│   │   ├── members-content.tsx    # Main members page client component (tabs, header)
│   │   ├── members-table.tsx      # Members table with role badges, actions dropdown
│   │   ├── invite-member-dialog.tsx # Email + role invite dialog
│   │   ├── pending-invitations.tsx  # Pending invitations table
│   │   ├── change-role-dialog.tsx   # Change member role dialog (owner-only)
│   │   └── remove-member-dialog.tsx # Remove member confirmation dialog
│   │
│   ├── settings/
│   │   ├── settings-content.tsx   # Settings page client component (name, logo, danger zone)
│   │   └── delete-org-dialog.tsx  # Delete org confirmation dialog (type-to-confirm)
│   │
│   ├── billing/
│   │   └── billing-content.tsx    # Billing page client component (plan display, upgrade, portal)
│   │
│   ├── plugins/
│   │   └── tasks/
│   │       ├── status-select.tsx      # Status selector with icons + helpers
│   │       ├── priority-select.tsx    # Priority selector with icons + helpers
│   │       ├── assignee-select.tsx    # Assignee selector with avatars
│   │       ├── create-issue-dialog.tsx # Full create issue dialog
│   │       ├── issues-board.tsx       # Issues grouped by status, collapsible
│   │       ├── issue-activity.tsx     # Activity log component
│   │       ├── issue-comments.tsx     # Comments list + add comment form
│   │       └── issue-detail.tsx       # Full issue detail page component
│   │
│   └── ui/                     # 22 shadcn/ui components (do not hand-edit)
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── popover.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── hooks/
│   ├── use-mobile.ts           # Mobile detection hook (shadcn)
│   └── use-org.tsx             # OrgProvider context + useOrg() hook
│
└── lib/
    ├── utils.ts                # cn() helper
    ├── auth/
    │   ├── auth.ts             # better-auth server config
    │   ├── auth-client.ts      # better-auth client config
    │   ├── permissions.ts      # Access control + role mappings
    │   └── session.ts          # getSession() + getOptionalSession()
    ├── db/
    │   ├── index.ts            # Drizzle + Neon client
    │   └── schema/
    │       ├── index.ts        # Barrel export
    │       ├── auth.ts         # better-auth tables
    │       ├── members.ts      # member_profiles
    │       ├── orgs.ts         # org_profiles, org_plugins
    │       └── tasks.ts        # issues, issue_comments, issue_activity
    └── plugins/
        ├── registry.ts         # Plugin registry
        └── tasks-types.ts      # Shared types & constants for Task Management plugin
```

---

## 5. Full File Contents

### 5.1 Root Config

#### `package.json`
```json
{
  "name": "club",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@better-auth/drizzle-adapter": "^1.5.3",
    "@better-auth/stripe": "^1.5.3",
    "@neondatabase/serverless": "^1.0.2",
    "@paralleldrive/cuid2": "^3.3.0",
    "better-auth": "^1.5.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "drizzle-orm": "^0.45.1",
    "lucide-react": "^0.577.0",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "resend": "^6.9.3",
    "sonner": "^2.0.7",
    "stripe": "^20.4.0",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "drizzle-kit": "^0.31.9",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "shadcn": "^3.8.5",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

#### `next.config.ts`
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

#### `drizzle.config.ts`
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### `postcss.config.mjs`
```mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

#### `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

#### `.env.example`
```
# Database
DATABASE_URL=                        # Neon connection string (postgresql://...)

# Auth
BETTER_AUTH_SECRET=                  # Random 32+ char secret
BETTER_AUTH_URL=                     # = NEXT_PUBLIC_APP_URL

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PLUS_MONTHLY_PRICE_ID=
STRIPE_PLUS_ANNUAL_PRICE_ID=

# Email
RESEND_API_KEY=                      # Transactional email (invitations, verification, reset)
```

#### `middleware.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /app routes
  // Do NOT protect: /, /sign-in, /sign-up, /accept-invitation/**
  if (!pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
```

#### `eslint.config.mjs`
```mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

---

### 5.2 Auth & Permissions

#### `lib/auth/auth.ts`
```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { stripe } from "@better-auth/stripe";
import { db } from "@/lib/db";
import { ac, owner, admin, member } from "./permissions";
import { orgProfiles, orgPlugins } from "@/lib/db/schema/orgs";
import { getPluginsForPlan } from "@/lib/plugins/registry";
import { createId } from "@paralleldrive/cuid2";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: { enabled: true },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: Implement with Resend
      console.log(`[DEV] Verification email for ${user.email}: ${url}`);
    },
  },

  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },

      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;
        // TODO: Implement with Resend
        console.log(
          `[DEV] Invitation email to ${data.email}: ${inviteLink}`
        );
      },

      organizationHooks: {
        beforeAddMember: async ({ organization: org }) => {
          // Enforce member limit based on org plan
          const profile = await db.query.orgProfiles.findFirst({
            where: eq(orgProfiles.id, org.id),
          });
          const plan = profile?.plan ?? "free";
          const limits: Record<string, number> = {
            free: 6,
            plus: 30,
            enterprise: Infinity,
          };
          const limit = limits[plan] ?? 6;

          // Count current members via the member table
          const { member: memberTable } = await import("@/lib/db/schema/auth");
          const { count } = await import("drizzle-orm");
          const result = await db
            .select({ count: count() })
            .from(memberTable)
            .where(eq(memberTable.organizationId, org.id));
          const currentCount = result[0]?.count ?? 0;

          if (currentCount >= limit) {
            throw new Error(
              `This organization has reached its member limit (${limit}). Upgrade to add more members.`
            );
          }
        },

        beforeCreateInvitation: async ({ organization: org }) => {
          // Enforce member limit before sending invite
          const profile = await db.query.orgProfiles.findFirst({
            where: eq(orgProfiles.id, org.id),
          });
          const plan = profile?.plan ?? "free";
          const limits: Record<string, number> = {
            free: 6,
            plus: 30,
            enterprise: Infinity,
          };
          const limit = limits[plan] ?? 6;

          const { member: memberTable } = await import("@/lib/db/schema/auth");
          const { count } = await import("drizzle-orm");
          const result = await db
            .select({ count: count() })
            .from(memberTable)
            .where(eq(memberTable.organizationId, org.id));
          const currentCount = result[0]?.count ?? 0;

          if (currentCount >= limit) {
            throw new Error(
              `This organization has reached its member limit (${limit}). Upgrade your plan to invite more members.`
            );
          }
        },

        afterCreateOrganization: async ({ organization: org }) => {
          // Create org_profile row
          await db.insert(orgProfiles).values({
            id: org.id,
            plan: "free",
            issueCounter: 0,
          });

          // Enable default plugins for the org's plan
          const plugins = getPluginsForPlan("free");
          for (const plugin of plugins) {
            if (plugin.defaultEnabled) {
              await db.insert(orgPlugins).values({
                id: createId(),
                orgId: org.id,
                pluginId: plugin.id,
                enabled: true,
                settings: {},
              });
            }
          }
        },
      },
    }),

    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "free",
            limits: { members: 6 },
          },
          {
            name: "plus",
            priceId: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID!,
            annualDiscountPriceId: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID,
            limits: { members: 30 },
          },
        ],
        onSubscriptionComplete: async ({ subscription, plan }) => {
          // Update org_profiles.plan when subscription completes
          const orgId = subscription.referenceId;
          await db
            .update(orgProfiles)
            .set({ plan: plan.name, updatedAt: new Date() })
            .where(eq(orgProfiles.id, orgId));

          // Enable any newly available plugins
          if (plan.name !== "free") {
            const plugins = getPluginsForPlan(
              plan.name as "free" | "plus" | "enterprise"
            );
            for (const plugin of plugins) {
              // Upsert — only insert if not already present
              await db
                .insert(orgPlugins)
                .values({
                  id: createId(),
                  orgId,
                  pluginId: plugin.id,
                  enabled: true,
                  settings: {},
                })
                .onConflictDoNothing();
            }
          }
        },
        onSubscriptionCancel: async ({ subscription }) => {
          // Downgrade to free
          const orgId = subscription.referenceId;
          await db
            .update(orgProfiles)
            .set({ plan: "free", updatedAt: new Date() })
            .where(eq(orgProfiles.id, orgId));
        },
      },
      organization: { enabled: true },
    }),

    // Must be last — enables cookie setting in server actions
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
```

#### `lib/auth/auth-client.ts`
```ts
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { ac, owner, admin, member } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    stripeClient({ subscription: true }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
  organization: organizationApi,
} = authClient;
```

#### `lib/auth/permissions.ts`
```ts
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/organization/access";

// Extend the default statements with plugin-level resources
const statement = {
  ...defaultStatements,
  issue: [
    "create",
    "update",
    "update_own",
    "delete",
    "comment",
    "delete_own_comment",
    "delete_any_comment",
  ],
} as const;

export const ac = createAccessControl(statement);

// owner = "Admin" in UI — full control including billing and org deletion
export const owner = ac.newRole({
  issue: [
    "create",
    "update",
    "update_own",
    "delete",
    "comment",
    "delete_own_comment",
    "delete_any_comment",
  ],
  ...adminAc.statements,
  organization: ["update", "delete"],
});

// admin = "Lead" in UI — officer-level, manages members and content
export const admin = ac.newRole({
  issue: [
    "create",
    "update",
    "update_own",
    "delete",
    "comment",
    "delete_own_comment",
    "delete_any_comment",
  ],
  ...adminAc.statements,
});

// member = "Member" in UI — contributor, limited write access
export const member = ac.newRole({
  issue: ["create", "update_own", "comment", "delete_own_comment"],
});

/**
 * Maps internal better-auth role names to UI-facing labels.
 * The UI should never reference internal role names directly.
 */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: "Admin",
  admin: "Lead",
  member: "Member",
} as const;

/**
 * Maps UI-facing role labels back to internal better-auth role names.
 */
export const DISPLAY_NAME_TO_ROLE: Record<string, string> = {
  Admin: "owner",
  Lead: "admin",
  Member: "member",
} as const;
```

#### `lib/auth/session.ts`
```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Get the current session in a Server Component or Server Action.
 * Redirects to /sign-in if no session is found.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

/**
 * Get the current session without redirecting.
 * Returns null if no session.
 */
export async function getOptionalSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
```

---

### 5.3 Database

#### `lib/db/index.ts`
```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

#### `lib/db/schema/index.ts`
```ts
// better-auth managed tables
export {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  subscription,
} from "./auth";

// Custom application tables
export { orgProfiles, orgPlugins } from "./orgs";
export { memberProfiles } from "./members";
export { issues, issueComments, issueActivity } from "./tasks";
```

#### `lib/db/schema/auth.ts`
```ts
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

// ============================================================
// better-auth managed tables
// These match the schema expected by better-auth v1.5.3
// with organization plugin + stripe plugin (subscription + org enabled)
// DO NOT hand-edit column names or types.
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Added by stripe plugin
  stripeCustomerId: text("stripe_customer_id"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Added by organization plugin
  activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Added by stripe plugin (organization.enabled: true)
  stripeCustomerId: text("stripe_customer_id"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id),
});

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("reference_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("incomplete"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  seats: integer("seats"),
  billingInterval: text("billing_interval"),
  stripeScheduleId: text("stripe_schedule_id"),
});
```

#### `lib/db/schema/orgs.ts`
```ts
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

// ============================================================
// org_profiles -- Extended org data (supplements better-auth's organization table)
// 1:1 relation with organization. id = organizationId.
// ============================================================

export const orgProfiles = pgTable("org_profiles", {
  id: text("id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"), // 'free' | 'plus' | 'enterprise'
  stripeCustomerId: text("stripe_customer_id"),
  issueCounter: integer("issue_counter").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// org_plugins -- Per-org plugin state
// ============================================================

export const orgPlugins = pgTable(
  "org_plugins",
  {
    id: text("id").primaryKey(), // cuid2
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pluginId: text("plugin_id").notNull(), // matches Plugin.id in registry
    enabled: boolean("enabled").notNull().default(true),
    settings: jsonb("settings").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("org_plugins_org_plugin_idx").on(table.orgId, table.pluginId)]
);
```

#### `lib/db/schema/members.ts`
```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { member } from "./auth";

// ============================================================
// member_profiles -- Member display name override
// Supplements better-auth's member table. 1:1 relation.
// id = memberId.
// ============================================================

export const memberProfiles = pgTable("member_profiles", {
  id: text("id")
    .primaryKey()
    .references(() => member.id, { onDelete: "cascade" }),
  displayName: text("display_name"), // nullable, falls back to user.name
  avatarUrl: text("avatar_url"), // nullable, falls back to user.image
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

#### `lib/db/schema/tasks.ts`
```ts
import {
  pgTable,
  text,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

// ============================================================
// issues -- Linear-inspired issue tracker, scoped per org
// ============================================================

export const issues = pgTable(
  "issues",
  {
    id: text("id").primaryKey(), // cuid2
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(), // e.g. "ACM-42"
    title: text("title").notNull(),
    description: text("description"), // markdown
    status: text("status").notNull().default("backlog"),
    // 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
    priority: text("priority").notNull().default("no_priority"),
    // 'no_priority' | 'urgent' | 'high' | 'medium' | 'low'
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("issues_org_identifier_idx").on(table.orgId, table.identifier),
    index("idx_issues_org_id").on(table.orgId),
    index("idx_issues_org_status").on(table.orgId, table.status),
    index("idx_issues_assignee").on(table.assigneeId),
  ]
);

// ============================================================
// issue_comments
// ============================================================

export const issueComments = pgTable(
  "issue_comments",
  {
    id: text("id").primaryKey(), // cuid2
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(), // markdown
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_comments_issue_id").on(table.issueId)]
);

// ============================================================
// issue_activity -- Audit log for issue changes
// ============================================================

export const issueActivity = pgTable(
  "issue_activity",
  {
    id: text("id").primaryKey(), // cuid2
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    type: text("type").notNull(),
    // 'created' | 'status_change' | 'priority_change' | 'assignment' | 'comment'
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_activity_issue_id").on(table.issueId)]
);
```

---

### 5.4 Plugins

#### `lib/plugins/registry.ts`
```ts
import { CheckSquare, type LucideIcon } from "lucide-react";

export type Plugin = {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: LucideIcon;
  plans: ("free" | "plus" | "enterprise")[];
  defaultEnabled: boolean;
};

export const PLUGINS: Plugin[] = [
  {
    id: "tasks",
    name: "Task Management",
    description: "Linear-inspired issue tracker for your org",
    slug: "tasks",
    icon: CheckSquare,
    plans: ["free", "plus", "enterprise"],
    defaultEnabled: true,
  },
  // future: chat, storage, notes, whiteboards, recruitment, finances
];

/**
 * Get all plugins available on a given plan.
 */
export function getPluginsForPlan(
  plan: "free" | "plus" | "enterprise"
): Plugin[] {
  return PLUGINS.filter((p) => p.plans.includes(plan));
}

/**
 * Get a plugin by its ID.
 */
export function getPluginById(id: string): Plugin | undefined {
  return PLUGINS.find((p) => p.id === id);
}
```

#### `lib/plugins/tasks-types.ts`
```ts
// ============================================================
// Shared types and constants for the Task Management plugin
// ============================================================

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "cancelled";

export type IssuePriority =
  | "no_priority"
  | "urgent"
  | "high"
  | "medium"
  | "low";

export const ISSUE_STATUSES: {
  value: IssueStatus;
  label: string;
  order: number;
}[] = [
  { value: "backlog", label: "Backlog", order: 0 },
  { value: "todo", label: "Todo", order: 1 },
  { value: "in_progress", label: "In Progress", order: 2 },
  { value: "done", label: "Done", order: 3 },
  { value: "cancelled", label: "Cancelled", order: 4 },
];

export const ISSUE_PRIORITIES: {
  value: IssuePriority;
  label: string;
  order: number;
}[] = [
  { value: "urgent", label: "Urgent", order: 0 },
  { value: "high", label: "High", order: 1 },
  { value: "medium", label: "Medium", order: 2 },
  { value: "low", label: "Low", order: 3 },
  { value: "no_priority", label: "No Priority", order: 4 },
];

export type IssueWithAssignee = {
  id: string;
  orgId: string;
  identifier: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  creatorId: string;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  creator: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type IssueComment = {
  id: string;
  issueId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type IssueActivityEntry = {
  id: string;
  issueId: string;
  type: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type OrgMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};
```

---

### 5.5 Server Actions

#### `actions/orgs.ts`
```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

/**
 * Create a new organization.
 * The creator becomes the owner (Admin in UI).
 * better-auth's afterCreateOrganization hook handles:
 *   - Creating org_profile with plan="free"
 *   - Enabling default plugins
 */
export async function createOrg(data: { name: string; slug: string }) {
  const response = await auth.api.createOrganization({
    headers: await headers(),
    body: {
      name: data.name,
      slug: data.slug,
    },
  });

  revalidatePath("/app");

  return { slug: response.slug };
}

/**
 * Set the active organization for the current session.
 */
export async function setActiveOrg(orgId: string) {
  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
    },
  });
}
```

**`actions/tasks.ts` — Task Management Server Actions**

#### `actions/tasks.ts`
```ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import {
  issues,
  issueComments,
  issueActivity,
} from "@/lib/db/schema/tasks";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { member, user, organization } from "@/lib/db/schema/auth";
import { eq, and, asc, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type {
  IssueStatus,
  IssuePriority,
  IssueWithAssignee,
  IssueComment,
  IssueActivityEntry,
  OrgMember,
} from "@/lib/plugins/tasks-types";

// ============================================================
// Helpers
// ============================================================

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Not authenticated");
  return session;
}

async function verifyMembership(orgId: string, userId: string) {
  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, orgId), eq(member.userId, userId)),
  });
  if (!membership) throw new Error("Not a member of this organization");
  return membership;
}

/**
 * Atomically increment the org's issue counter and return the new identifier.
 * Format: ORG_SLUG_UPPER-COUNTER (e.g. "ACM-42")
 */
async function generateIssueIdentifier(orgId: string): Promise<string> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });
  if (!org) throw new Error("Organization not found");

  const result = await db
    .update(orgProfiles)
    .set({
      issueCounter: sql`${orgProfiles.issueCounter} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(orgProfiles.id, orgId))
    .returning({ issueCounter: orgProfiles.issueCounter });

  const counter = result[0]?.issueCounter;
  if (counter === undefined)
    throw new Error("Failed to generate issue identifier");

  const prefix = org.slug.toUpperCase().replace(/-/g, "");
  return `${prefix}-${counter}`;
}

// ============================================================
// Queries
// ============================================================

/**
 * Get all issues for an org, optionally filtered.
 */
export async function getIssues(
  orgId: string,
  filters?: {
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string;
  }
): Promise<IssueWithAssignee[]> {
  const conditions = [eq(issues.orgId, orgId)];
  if (filters?.status) conditions.push(eq(issues.status, filters.status));
  if (filters?.priority)
    conditions.push(eq(issues.priority, filters.priority));
  if (filters?.assigneeId)
    conditions.push(eq(issues.assigneeId, filters.assigneeId));

  const rows = await db
    .select({
      id: issues.id,
      orgId: issues.orgId,
      identifier: issues.identifier,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      creatorId: issues.creatorId,
      dueDate: issues.dueDate,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      creatorName: user.name,
      creatorImage: user.image,
    })
    .from(issues)
    .innerJoin(user, eq(issues.creatorId, user.id))
    .where(and(...conditions))
    .orderBy(asc(issues.createdAt));

  // Fetch assignee info for issues that have one
  const assigneeIds = [
    ...new Set(rows.filter((r) => r.assigneeId).map((r) => r.assigneeId!)),
  ];
  const assigneeMap = new Map<
    string,
    { id: string; name: string; image: string | null }
  >();

  if (assigneeIds.length > 0) {
    const assignees = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(
        sql`${user.id} IN (${sql.join(
          assigneeIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    for (const a of assignees) {
      assigneeMap.set(a.id, a);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    orgId: r.orgId,
    identifier: r.identifier,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    assigneeId: r.assigneeId,
    creatorId: r.creatorId,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignee: r.assigneeId ? assigneeMap.get(r.assigneeId) ?? null : null,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      image: r.creatorImage,
    },
  }));
}

/**
 * Get a single issue by ID with full details.
 */
export async function getIssue(
  issueId: string
): Promise<IssueWithAssignee | null> {
  const rows = await db
    .select({
      id: issues.id,
      orgId: issues.orgId,
      identifier: issues.identifier,
      title: issues.title,
      description: issues.description,
      status: issues.status,
      priority: issues.priority,
      assigneeId: issues.assigneeId,
      creatorId: issues.creatorId,
      dueDate: issues.dueDate,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      creatorName: user.name,
      creatorImage: user.image,
    })
    .from(issues)
    .innerJoin(user, eq(issues.creatorId, user.id))
    .where(eq(issues.id, issueId))
    .limit(1);

  if (rows.length === 0) return null;

  const r = rows[0];

  let assignee: { id: string; name: string; image: string | null } | null =
    null;
  if (r.assigneeId) {
    const assigneeRows = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, r.assigneeId))
      .limit(1);
    assignee = assigneeRows[0] ?? null;
  }

  return {
    id: r.id,
    orgId: r.orgId,
    identifier: r.identifier,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    assigneeId: r.assigneeId,
    creatorId: r.creatorId,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignee,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      image: r.creatorImage,
    },
  };
}

/**
 * Get issue comments.
 */
export async function getIssueComments(
  issueId: string
): Promise<IssueComment[]> {
  const rows = await db
    .select({
      id: issueComments.id,
      issueId: issueComments.issueId,
      body: issueComments.body,
      createdAt: issueComments.createdAt,
      updatedAt: issueComments.updatedAt,
      authorId: issueComments.authorId,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(issueComments)
    .innerJoin(user, eq(issueComments.authorId, user.id))
    .where(eq(issueComments.issueId, issueId))
    .orderBy(asc(issueComments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    issueId: r.issueId,
    body: r.body,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    author: {
      id: r.authorId,
      name: r.authorName,
      image: r.authorImage,
    },
  }));
}

/**
 * Get issue activity log.
 */
export async function getIssueActivity(
  issueId: string
): Promise<IssueActivityEntry[]> {
  const rows = await db
    .select({
      id: issueActivity.id,
      issueId: issueActivity.issueId,
      type: issueActivity.type,
      fromValue: issueActivity.fromValue,
      toValue: issueActivity.toValue,
      createdAt: issueActivity.createdAt,
      actorId: issueActivity.actorId,
      actorName: user.name,
      actorImage: user.image,
    })
    .from(issueActivity)
    .innerJoin(user, eq(issueActivity.actorId, user.id))
    .where(eq(issueActivity.issueId, issueId))
    .orderBy(asc(issueActivity.createdAt));

  return rows.map((r) => ({
    id: r.id,
    issueId: r.issueId,
    type: r.type,
    fromValue: r.fromValue,
    toValue: r.toValue,
    createdAt: r.createdAt,
    actor: {
      id: r.actorId,
      name: r.actorName,
      image: r.actorImage,
    },
  }));
}

/**
 * Get all members of an org (for assignee picker).
 */
export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const rows = await db
    .select({
      userId: member.userId,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId))
    .orderBy(asc(user.name));

  return rows.map((r) => ({
    id: r.userId,
    name: r.name,
    email: r.email,
    image: r.image,
  }));
}

// ============================================================
// Mutations
// ============================================================

/**
 * Create a new issue.
 */
export async function createIssue(
  orgId: string,
  data: {
    title: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string;
    dueDate?: string;
  }
) {
  try {
    const session = await getAuthenticatedUser();
    await verifyMembership(orgId, session.user.id);

    const identifier = await generateIssueIdentifier(orgId);
    const issueId = createId();

    await db.insert(issues).values({
      id: issueId,
      orgId,
      identifier,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "backlog",
      priority: data.priority ?? "no_priority",
      assigneeId: data.assigneeId ?? null,
      creatorId: session.user.id,
      dueDate: data.dueDate ?? null,
    });

    // Log creation activity
    await db.insert(issueActivity).values({
      id: createId(),
      issueId,
      actorId: session.user.id,
      type: "created",
      toValue: data.title,
    });

    revalidatePath("/app");
    return { success: true, issueId, identifier };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create issue";
    return { success: false, error: message };
  }
}

/**
 * Update an issue's fields.
 */
export async function updateIssue(
  issueId: string,
  data: {
    title?: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string | null;
    dueDate?: string | null;
  }
) {
  try {
    const session = await getAuthenticatedUser();

    const current = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });
    if (!current) throw new Error("Issue not found");

    const membership = await verifyMembership(current.orgId, session.user.id);

    // Permission check: members can only update own issues
    const isOwnerOrAdmin =
      membership.role === "owner" || membership.role === "admin";
    if (!isOwnerOrAdmin && current.creatorId !== session.user.id) {
      throw new Error("You don't have permission to edit this issue");
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.assigneeId !== undefined) updates.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;

    await db.update(issues).set(updates).where(eq(issues.id, issueId));

    // Log activity for trackable field changes
    const activityEntries: {
      type: string;
      fromValue: string | null;
      toValue: string | null;
    }[] = [];

    if (data.status !== undefined && data.status !== current.status) {
      activityEntries.push({
        type: "status_change",
        fromValue: current.status,
        toValue: data.status,
      });
    }
    if (data.priority !== undefined && data.priority !== current.priority) {
      activityEntries.push({
        type: "priority_change",
        fromValue: current.priority,
        toValue: data.priority,
      });
    }
    if (
      data.assigneeId !== undefined &&
      data.assigneeId !== current.assigneeId
    ) {
      activityEntries.push({
        type: "assignment",
        fromValue: current.assigneeId,
        toValue: data.assigneeId,
      });
    }

    if (activityEntries.length > 0) {
      await db.insert(issueActivity).values(
        activityEntries.map((entry) => ({
          id: createId(),
          issueId,
          actorId: session.user.id,
          type: entry.type,
          fromValue: entry.fromValue,
          toValue: entry.toValue,
        }))
      );
    }

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update issue";
    return { success: false, error: message };
  }
}

/**
 * Delete an issue.
 * Only Admin (owner) and Lead (admin) can delete.
 */
export async function deleteIssue(issueId: string) {
  try {
    const session = await getAuthenticatedUser();

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });
    if (!issue) throw new Error("Issue not found");

    const membership = await verifyMembership(issue.orgId, session.user.id);

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("You don't have permission to delete issues");
    }

    await db.delete(issues).where(eq(issues.id, issueId));

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete issue";
    return { success: false, error: message };
  }
}

/**
 * Add a comment to an issue.
 */
export async function addComment(issueId: string, body: string) {
  try {
    const session = await getAuthenticatedUser();

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
    });
    if (!issue) throw new Error("Issue not found");

    await verifyMembership(issue.orgId, session.user.id);

    const commentId = createId();

    await db.insert(issueComments).values({
      id: commentId,
      issueId,
      authorId: session.user.id,
      body,
    });

    // Log comment activity
    await db.insert(issueActivity).values({
      id: createId(),
      issueId,
      actorId: session.user.id,
      type: "comment",
      toValue: commentId,
    });

    revalidatePath("/app");
    return { success: true, commentId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add comment";
    return { success: false, error: message };
  }
}

/**
 * Delete a comment.
 * Admin/Lead can delete any comment. Members can only delete own.
 */
export async function deleteComment(commentId: string) {
  try {
    const session = await getAuthenticatedUser();

    const comment = await db.query.issueComments.findFirst({
      where: eq(issueComments.id, commentId),
    });
    if (!comment) throw new Error("Comment not found");

    const issue = await db.query.issues.findFirst({
      where: eq(issues.id, comment.issueId),
    });
    if (!issue) throw new Error("Issue not found");

    const membership = await verifyMembership(issue.orgId, session.user.id);

    const isOwnerOrAdmin =
      membership.role === "owner" || membership.role === "admin";
    if (!isOwnerOrAdmin && comment.authorId !== session.user.id) {
      throw new Error("You don't have permission to delete this comment");
    }

    await db.delete(issueComments).where(eq(issueComments.id, commentId));

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete comment";
    return { success: false, error: message };
  }
}
```

#### `actions/members.ts`
```ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { member, user, invitation, organization } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and, desc } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export type MemberWithUser = {
  id: string;
  role: string;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
};

// ============================================================
// Queries
// ============================================================

/**
 * Get all members of an organization with their user data.
 */
export async function getMembers(orgId: string): Promise<MemberWithUser[]> {
  const memberships = await db
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId))
    .orderBy(desc(member.createdAt));

  return memberships.map((m) => ({
    id: m.id,
    role: m.role,
    createdAt: m.createdAt,
    userId: m.userId,
    user: {
      id: m.userId,
      name: m.userName,
      email: m.userEmail,
      image: m.userImage,
    },
  }));
}

/**
 * Get all pending invitations for an organization.
 */
export async function getPendingInvitations(
  orgId: string
): Promise<PendingInvitation[]> {
  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      inviterId: invitation.inviterId,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(
      and(
        eq(invitation.organizationId, orgId),
        eq(invitation.status, "pending")
      )
    )
    .orderBy(desc(invitation.createdAt));

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    inviterName: inv.inviterName,
  }));
}

/**
 * Get org plan and member count info for limit display.
 */
export async function getOrgMemberInfo(orgId: string) {
  const profile = await db.query.orgProfiles.findFirst({
    where: eq(orgProfiles.id, orgId),
  });

  const members = await db
    .select({ id: member.id })
    .from(member)
    .where(eq(member.organizationId, orgId));

  const plan = profile?.plan ?? "free";
  const limits: Record<string, number> = {
    free: 6,
    plus: 30,
    enterprise: Infinity,
  };

  return {
    plan,
    memberCount: members.length,
    memberLimit: limits[plan] ?? 6,
  };
}

// ============================================================
// Mutations
// ============================================================

/**
 * Invite a member to the organization.
 * Uses better-auth's createInvitation API which handles:
 * - Permission checks (caller must be admin/owner or admin role)
 * - Sending invitation email
 * - Plan limit enforcement (via beforeCreateInvitation hook)
 */
export type OrgRole = "member" | "admin" | "owner";

export async function inviteMember(
  orgId: string,
  email: string,
  role: OrgRole
) {
  try {
    await auth.api.createInvitation({
      headers: await headers(),
      body: {
        email,
        role,
        organizationId: orgId,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invitation";
    return { success: false, error: message };
  }
}

/**
 * Cancel a pending invitation.
 */
export async function cancelInvitation(invitationId: string) {
  try {
    await auth.api.cancelInvitation({
      headers: await headers(),
      body: {
        invitationId,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel invitation";
    return { success: false, error: message };
  }
}

/**
 * Remove a member from the organization.
 * Only Admins (owner role) can remove members.
 */
export async function removeMember(orgId: string, memberIdOrEmail: string) {
  try {
    await auth.api.removeMember({
      headers: await headers(),
      body: {
        memberIdOrEmail,
        organizationId: orgId,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove member";
    return { success: false, error: message };
  }
}

/**
 * Update a member's role.
 * Only Admins (owner role) can change roles.
 */
export async function updateMemberRole(
  orgId: string,
  memberId: string,
  role: OrgRole
) {
  try {
    await auth.api.updateMemberRole({
      headers: await headers(),
      body: {
        memberId,
        role,
        organizationId: orgId,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update role";
    return { success: false, error: message };
  }
}
```

#### `actions/settings.ts`
```ts
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member, subscription } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Update org name.
 * Only the owner (Admin) can update org settings.
 */
export async function updateOrgName(
  orgId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is the owner of this org
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only the Admin can update org settings" };
  }

  if (!name.trim()) {
    return { success: false, error: "Name is required" };
  }

  // Update via better-auth API
  const result = await auth.api.updateOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
      data: { name: name.trim() },
    },
  });

  if (!result) {
    return { success: false, error: "Failed to update organization" };
  }

  // Get the org slug for revalidation
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (org) {
    revalidatePath(`/app/${org.slug}/settings`);
    revalidatePath(`/app/${org.slug}`);
    revalidatePath("/app");
  }

  return { success: true };
}

/**
 * Update org logo URL.
 * Only the owner (Admin) can update org settings.
 */
export async function updateOrgLogo(
  orgId: string,
  logo: string | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only the Admin can update org settings" };
  }

  const result = await auth.api.updateOrganization({
    headers: await headers(),
    body: {
      organizationId: orgId,
      data: { logo: logo ?? undefined },
    },
  });

  if (!result) {
    return { success: false, error: "Failed to update logo" };
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (org) {
    revalidatePath(`/app/${org.slug}/settings`);
    revalidatePath(`/app/${org.slug}`);
    revalidatePath("/app");
  }

  return { success: true };
}

/**
 * Delete an organization.
 * Only the owner (Admin) can delete. Blocked if there's an active Stripe subscription.
 */
export async function deleteOrg(
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, orgId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only the Admin can delete the organization" };
  }

  // Check for active subscription — block deletion if paid plan is active
  const activeSubscription = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.referenceId, orgId),
      eq(subscription.status, "active")
    ),
  });

  if (activeSubscription && activeSubscription.plan !== "free") {
    return {
      success: false,
      error:
        "Cannot delete an organization with an active paid subscription. Please cancel your subscription first.",
    };
  }

  // Delete via better-auth API (cascades handle related data)
  try {
    await auth.api.deleteOrganization({
      headers: await headers(),
      body: { organizationId: orgId },
    });
  } catch {
    return { success: false, error: "Failed to delete organization" };
  }

  revalidatePath("/app");
  return { success: true };
}
```

---

### 5.6 Hooks

#### `hooks/use-org.tsx`
```tsx
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
```

#### `hooks/use-mobile.ts`
```ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

---

### 5.7 App Routes

#### `app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Club - Student Org Management",
  description:
    "Modular platform for student-led organisations to organise their work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

#### `app/(marketing)/page.tsx`
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Club
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your student org,
            <br />
            all in one place.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Club gives student-led organisations a shared home to organise their
            work. Manage tasks, coordinate teams, and grow your community — all
            from one modular platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">Start for Free</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built for student communities.
        </div>
      </footer>
    </div>
  );
}
```

#### `app/(marketing)/sign-in/page.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Failed to sign in");
      setLoading(false);
      return;
    }

    router.push(redirect);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to Club</CardTitle>
          <CardDescription>
            Enter your credentials to access your workspace
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

#### `app/(marketing)/sign-up/page.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Failed to create account");
      setLoading(false);
      return;
    }

    toast.success("Account created! Redirecting...");
    router.push("/app");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Get started with Club for your student org
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

#### `app/api/auth/[...all]/route.ts`
```ts
import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

#### `app/app/layout.tsx`
```tsx
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated (redirects to /sign-in if not)
  await getSession();

  // Read sidebar state from cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {children}
    </SidebarProvider>
  );
}
```

#### `app/app/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { member, organization } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq } from "drizzle-orm";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import { OrgSwitcherGrid } from "./org-switcher-grid";

async function getUserOrgsWithPlans(userId: string) {
  const memberships = await db.query.member.findMany({
    where: eq(member.userId, userId),
  });

  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organizationId);
  const orgs = await db.query.organization.findMany();
  const profiles = await db.query.orgProfiles.findMany();

  return orgs
    .filter((o) => orgIds.includes(o.id))
    .map((o) => {
      const m = memberships.find((m) => m.organizationId === o.id)!;
      const profile = profiles.find((p) => p.id === o.id);
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo: o.logo,
        role: m.role,
        roleLabel: ROLE_DISPLAY_NAMES[m.role] ?? m.role,
        plan: profile?.plan ?? "free",
      };
    });
}

export default async function OrgSwitcherPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const orgs = await getUserOrgsWithPlans(session.user.id);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Select an organisation to get started, or create a new one.
          </p>
        </div>
        <OrgSwitcherGrid orgs={orgs} />
      </div>
    </div>
  );
}
```

#### `app/app/org-switcher-grid.tsx`
```tsx
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
```

#### `app/app/[slug]/layout.tsx`
```tsx
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgProfiles, orgPlugins } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { OrgProvider, type OrgData } from "@/hooks/use-org";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

async function getOrgData(slug: string, userId: string) {
  // Load the org by slug
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) return null;

  // Check that the user is a member
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, userId),
    ),
  });

  if (!membership) return null;

  // Load org profile for plan info
  const profile = await db.query.orgProfiles.findFirst({
    where: eq(orgProfiles.id, org.id),
  });

  // Load enabled plugins for this org
  const enabledPlugins = await db.query.orgPlugins.findMany({
    where: and(
      eq(orgPlugins.orgId, org.id),
      eq(orgPlugins.enabled, true),
    ),
  });

  return {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      plan: profile?.plan ?? "free",
      role: membership.role,
      memberId: membership.id,
    } satisfies OrgData,
    enabledPluginIds: enabledPlugins.map((p) => p.pluginId),
  };
}

async function getUserOrgs(userId: string) {
  const memberships = await db.query.member.findMany({
    where: eq(member.userId, userId),
  });

  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organizationId);
  const orgs = await db.query.organization.findMany();

  return orgs
    .filter((o) => orgIds.includes(o.id))
    .map((o) => {
      const m = memberships.find((m) => m.organizationId === o.id)!;
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo: o.logo,
        role: m.role,
      };
    });
}

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await getOrgData(slug, session.user.id);

  if (!data) {
    notFound();
  }

  // Set active org in session (fire and forget — non-blocking)
  auth.api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId: data.org.id },
  });

  const orgs = await getUserOrgs(session.user.id);

  return (
    <OrgProvider org={data.org}>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        orgs={orgs}
        enabledPluginIds={data.enabledPluginIds}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </OrgProvider>
  );
}
```

#### `app/app/[slug]/page.tsx`
```tsx
import { redirect } from "next/navigation";

export default async function OrgRootPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/app/${slug}/home`);
}
```

#### `app/app/[slug]/home/page.tsx`
```tsx
export default function OrgHomePage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Home</h1>
      <p className="text-muted-foreground">
        Welcome to your organisation dashboard. This page will show an overview
        of recent activity in future phases.
      </p>
    </div>
  );
}
```

#### `app/app/[slug]/members/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  getMembers,
  getPendingInvitations,
  getOrgMemberInfo,
} from "@/actions/members";
import { MembersContent } from "@/components/members/members-content";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Load org
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Fetch data in parallel
  const [members, pendingInvitations, memberInfo] = await Promise.all([
    getMembers(org.id),
    getPendingInvitations(org.id),
    getOrgMemberInfo(org.id),
  ]);

  return (
    <div className="p-6 space-y-6">
      <MembersContent
        orgId={org.id}
        orgSlug={slug}
        currentUserRole={membership.role}
        currentUserId={session.user.id}
        members={members}
        pendingInvitations={pendingInvitations}
        memberInfo={memberInfo}
      />
    </div>
  );
}
```

#### `app/app/[slug]/settings/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Load org
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id),
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Only owners can access settings
  if (membership.role !== "owner") {
    redirect(`/app/${slug}`);
  }

  // Load org profile for plan info
  const profile = await db.query.orgProfiles.findFirst({
    where: eq(orgProfiles.id, org.id),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings.
        </p>
      </div>
      <SettingsContent
        orgId={org.id}
        orgSlug={slug}
        orgName={org.name}
        orgLogo={org.logo ?? null}
        plan={profile?.plan ?? "free"}
      />
    </div>
  );
}
```

#### `app/app/[slug]/billing/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member, subscription } from "@/lib/db/schema/auth";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and } from "drizzle-orm";
import { BillingContent } from "@/components/billing/billing-content";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Load org
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id),
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Only owners can access billing
  if (membership.role !== "owner") {
    redirect(`/app/${slug}`);
  }

  // Load org profile and subscription in parallel
  const [profile, sub] = await Promise.all([
    db.query.orgProfiles.findFirst({
      where: eq(orgProfiles.id, org.id),
    }),
    db.query.subscription.findFirst({
      where: and(
        eq(subscription.referenceId, org.id),
        eq(subscription.status, "active"),
      ),
    }),
  ]);

  const plan = profile?.plan ?? "free";
  const hasActiveSubscription = !!sub;
  const periodEnd = sub?.periodEnd ?? null;
  const cancelAtPeriodEnd = sub?.cancelAtPeriodEnd ?? false;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your plan and billing details.
        </p>
      </div>
      <BillingContent
        orgId={org.id}
        orgSlug={slug}
        plan={plan}
        hasActiveSubscription={hasActiveSubscription}
        periodEnd={periodEnd}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
      />
    </div>
  );
}
```

#### `app/app/[slug]/tasks/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { getIssues, getOrgMembers } from "@/actions/tasks";
import { IssuesBoard } from "@/components/plugins/tasks/issues-board";
import { CreateIssueDialog } from "@/components/plugins/tasks/create-issue-dialog";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Load org
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Fetch issues and members in parallel
  const [issues, members] = await Promise.all([
    getIssues(org.id),
    getOrgMembers(org.id),
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </p>
        </div>
        <CreateIssueDialog
          orgId={org.id}
          orgSlug={slug}
          members={members}
        />
      </div>
      <IssuesBoard issues={issues} orgSlug={slug} />
    </div>
  );
}
```

#### `app/app/[slug]/tasks/[issueId]/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { eq, and } from "drizzle-orm";
import {
  getIssue,
  getIssueComments,
  getIssueActivity,
  getOrgMembers,
} from "@/actions/tasks";
import { IssueDetail } from "@/components/plugins/tasks/issue-detail";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ slug: string; issueId: string }>;
}) {
  const { slug, issueId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Load org
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  // Verify membership
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  // Fetch issue and related data in parallel
  const [issue, comments, activity, members] = await Promise.all([
    getIssue(issueId),
    getIssueComments(issueId),
    getIssueActivity(issueId),
    getOrgMembers(org.id),
  ]);

  if (!issue || issue.orgId !== org.id) {
    notFound();
  }

  return (
    <IssueDetail
      issue={issue}
      comments={comments}
      activity={activity}
      members={members}
      orgSlug={slug}
      currentUserId={session.user.id}
      currentUserRole={membership.role}
    />
  );
}
```

#### `app/accept-invitation/[invitationId]/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { invitation, organization } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { AcceptInvitationClient } from "./accept-invitation-client";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  // Load invitation details for display
  const invite = await db.query.invitation.findFirst({
    where: eq(invitation.id, invitationId),
  });

  if (!invite) {
    notFound();
  }

  // Load org name for display
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, invite.organizationId),
  });

  if (!org) {
    notFound();
  }

  // Check if user is signed in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isExpired = invite.expiresAt < new Date();
  const isAlreadyAccepted = invite.status !== "pending";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AcceptInvitationClient
        invitationId={invitationId}
        orgName={org.name}
        orgSlug={org.slug}
        email={invite.email}
        isSignedIn={!!session}
        isExpired={isExpired}
        isAlreadyAccepted={isAlreadyAccepted}
        status={invite.status}
      />
    </div>
  );
}
```

#### `app/accept-invitation/[invitationId]/accept-invitation-client.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";

type Props = {
  invitationId: string;
  orgName: string;
  orgSlug: string;
  email: string;
  isSignedIn: boolean;
  isExpired: boolean;
  isAlreadyAccepted: boolean;
  status: string;
};

export function AcceptInvitationClient({
  invitationId,
  orgName,
  orgSlug,
  email,
  isSignedIn,
  isExpired,
  isAlreadyAccepted,
  status,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isExpired) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>
            This invitation to join <strong>{orgName}</strong> has expired. Please
            ask the organisation admin to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/app">Go to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isAlreadyAccepted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "accepted"
              ? "Already Accepted"
              : "Invitation Unavailable"}
          </CardTitle>
          <CardDescription>
            {status === "accepted"
              ? `This invitation to join ${orgName} has already been accepted.`
              : `This invitation to join ${orgName} is no longer available.`}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href={`/app/${orgSlug}/home`}>Go to {orgName}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join {orgName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{orgName}</strong>. Sign in
            or create an account to accept this invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link
              href={`/sign-in?redirect=/accept-invitation/${invitationId}`}
            >
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link
              href={`/sign-up?redirect=/accept-invitation/${invitationId}`}
            >
              Create account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  async function handleAccept() {
    setLoading(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        toast.error(error.message || "Failed to accept invitation");
        setLoading(false);
        return;
      }

      toast.success(`Welcome to ${orgName}!`);
      router.push(`/app/${orgSlug}/home`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Join {orgName}</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join <strong>{orgName}</strong> as a
          member.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        Invitation sent to <strong>{email}</strong>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={handleAccept}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Accepting..." : "Accept Invitation"}
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/app">Decline</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 5.8 Layout Components

#### `components/layout/app-sidebar.tsx`
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrgSwitcher } from "./org-switcher";
import { UserNav } from "./user-nav";
import { useOrg } from "@/hooks/use-org";
import { PLUGINS, getPluginById } from "@/lib/plugins/registry";

type OrgItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
};

type UserItem = {
  name: string;
  email: string;
  image: string | null;
};

export function AppSidebar({
  user,
  orgs,
  enabledPluginIds,
}: {
  user: UserItem;
  orgs: OrgItem[];
  enabledPluginIds: string[];
}) {
  const pathname = usePathname();
  const org = useOrg();
  const slug = org.slug;

  const coreNav = [
    {
      title: "Home",
      href: `/app/${slug}/home`,
      icon: Home,
      visible: true,
    },
    {
      title: "Members",
      href: `/app/${slug}/members`,
      icon: Users,
      visible: true,
    },
    {
      title: "Settings",
      href: `/app/${slug}/settings`,
      icon: Settings,
      visible: org.role === "owner",
    },
    {
      title: "Billing",
      href: `/app/${slug}/billing`,
      icon: CreditCard,
      visible: org.role === "owner",
    },
  ];

  // Build plugin nav items from enabled plugins
  const pluginNav = enabledPluginIds
    .map((pluginId) => {
      const plugin = getPluginById(pluginId);
      if (!plugin) return null;
      return {
        title: plugin.name,
        href: `/app/${slug}/${plugin.slug}`,
        icon: plugin.icon,
      };
    })
    .filter(Boolean) as { title: string; href: string; icon: typeof Home }[];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher currentOrg={org} orgs={orgs} />
      </SidebarHeader>

      <SidebarContent>
        {/* Core navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Organisation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreNav
                .filter((item) => item.visible)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Plugin navigation */}
        {pluginNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Plugins</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pluginNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <UserNav user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
```

#### `components/layout/org-switcher.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CreateOrgDialog } from "./create-org-dialog";
import { setActiveOrg } from "@/actions/orgs";
import type { OrgData } from "@/hooks/use-org";

type OrgItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
};

export function OrgSwitcher({
  currentOrg,
  orgs,
}: {
  currentOrg: OrgData;
  orgs: OrgItem[];
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [createOpen, setCreateOpen] = useState(false);

  // Show up to 5 orgs in dropdown, rest via "View all"
  const displayOrgs = orgs.slice(0, 5);
  const hasMore = orgs.length > 5;

  async function handleSwitchOrg(org: OrgItem) {
    await setActiveOrg(org.id);
    router.push(`/app/${org.slug}/home`);
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  {currentOrg.logo && (
                    <AvatarImage
                      src={currentOrg.logo}
                      alt={currentOrg.name}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {currentOrg.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentOrg.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    /{currentOrg.slug}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organisations
              </DropdownMenuLabel>
              {displayOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitchOrg(org)}
                  className="gap-3 p-2"
                >
                  <Avatar className="size-6 rounded-md">
                    {org.logo && (
                      <AvatarImage src={org.logo} alt={org.name} />
                    )}
                    <AvatarFallback className="rounded-md text-[10px]">
                      {org.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{org.name}</span>
                </DropdownMenuItem>
              ))}
              {hasMore && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/app")}
                    className="gap-3 p-2"
                  >
                    <LayoutGrid className="size-6 p-0.5" />
                    <span>View all</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className="gap-3 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <span>Create organisation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
```

#### `components/layout/create-org-dialog.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createOrg } from "@/actions/orgs";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await createOrg({ name: name.trim(), slug });
      toast.success("Organisation created!");
      onOpenChange(false);
      setName("");
      setSlug("");
      setSlugTouched(false);
      router.push(`/app/${result.slug}/home`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create organisation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create organisation</DialogTitle>
          <DialogDescription>
            Set up a new space for your club or team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisation name</Label>
              <Input
                id="org-name"
                placeholder="ACM Student Chapter"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  /app/
                </span>
                <Input
                  id="org-slug"
                  placeholder="acm-chapter"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL-safe, lowercase. Cannot be changed later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### `components/layout/user-nav.tsx`
```tsx
"use client";

import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/auth-client";

type UserItem = {
  name: string;
  email: string;
  image: string | null;
};

export function UserNav({ user }: { user: UserItem }) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name} />
                )}
                <AvatarFallback className="rounded-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  {user.image && (
                    <AvatarImage src={user.image} alt={user.name} />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

---

### 5.9 Member Components

#### `components/members/members-content.tsx`
```tsx
"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersTable } from "./members-table";
import { PendingInvitations } from "./pending-invitations";
import { InviteMemberDialog } from "./invite-member-dialog";
import type { MemberWithUser, PendingInvitation } from "@/actions/members";

type Props = {
  orgId: string;
  orgSlug: string;
  currentUserRole: string;
  currentUserId: string;
  members: MemberWithUser[];
  pendingInvitations: PendingInvitation[];
  memberInfo: {
    plan: string;
    memberCount: number;
    memberLimit: number;
  };
};

export function MembersContent({
  orgId,
  orgSlug,
  currentUserRole,
  currentUserId,
  members,
  pendingInvitations,
  memberInfo,
}: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";
  const isAtLimit = memberInfo.memberCount >= memberInfo.memberLimit;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {memberInfo.memberCount} of{" "}
            {memberInfo.memberLimit === Infinity
              ? "unlimited"
              : memberInfo.memberLimit}{" "}
            members
            <Badge variant="secondary" className="ml-2 text-[10px] capitalize">
              {memberInfo.plan}
            </Badge>
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)} disabled={isAtLimit}>
            <UserPlus className="mr-2 size-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersTable
            orgId={orgId}
            members={members}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <PendingInvitations
            invitations={pendingInvitations}
            currentUserRole={currentUserRole}
          />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgId={orgId}
        currentUserRole={currentUserRole}
        isAtLimit={isAtLimit}
      />
    </>
  );
}
```

#### `components/members/members-table.tsx`
```tsx
"use client";

import { useState } from "react";
import { MoreHorizontal, Shield, ShieldAlert, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import { ChangeRoleDialog } from "./change-role-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import type { MemberWithUser } from "@/actions/members";

type Props = {
  orgId: string;
  members: MemberWithUser[];
  currentUserRole: string;
  currentUserId: string;
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  owner: ShieldAlert,
  admin: Shield,
  member: User,
};

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function MembersTable({
  orgId,
  members,
  currentUserRole,
  currentUserId,
}: Props) {
  const [changeRoleMember, setChangeRoleMember] =
    useState<MemberWithUser | null>(null);
  const [removeMember, setRemoveMember] = useState<MemberWithUser | null>(null);

  // Only owners (Admin in UI) can change roles and remove members
  const canManage = currentUserRole === "owner";

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 4 : 3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const RoleIcon = ROLE_ICONS[m.role] ?? User;
                const isSelf = m.userId === currentUserId;
                const isOwner = m.role === "owner";

                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {m.user.image && (
                            <AvatarImage
                              src={m.user.image}
                              alt={m.user.name}
                            />
                          )}
                          <AvatarFallback>
                            {m.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {m.user.name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ROLE_VARIANT[m.role] ?? "outline"}
                        className="gap-1"
                      >
                        <RoleIcon className="size-3" />
                        {ROLE_DISPLAY_NAMES[m.role] ?? m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {!isSelf && !isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setChangeRoleMember(m)}
                              >
                                Change role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setRemoveMember(m)}
                              >
                                Remove member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ChangeRoleDialog
        orgId={orgId}
        member={changeRoleMember}
        onClose={() => setChangeRoleMember(null)}
      />

      <RemoveMemberDialog
        orgId={orgId}
        member={removeMember}
        onClose={() => setRemoveMember(null)}
      />
    </>
  );
}
```

#### `components/members/invite-member-dialog.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { inviteMember, type OrgRole } from "@/actions/members";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  currentUserRole: string;
  isAtLimit: boolean;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  orgId,
  currentUserRole,
  isAtLimit,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [loading, setLoading] = useState(false);

  // Leads (admin role) can only invite Members
  // Admins (owner role) can invite Members and Leads
  const availableRoles =
    currentUserRole === "owner"
      ? [
          { value: "member", label: ROLE_DISPLAY_NAMES.member },
          { value: "admin", label: ROLE_DISPLAY_NAMES.admin },
        ]
      : [{ value: "member", label: ROLE_DISPLAY_NAMES.member }];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    const result = await inviteMember(orgId, email.trim(), role);

    if (result.success) {
      toast.success(`Invitation sent to ${email}`);
      onOpenChange(false);
      setEmail("");
      setRole("member");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to send invitation");
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new member to this organisation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === "admin"
                  ? "Leads can manage members and content but cannot access billing or settings."
                  : "Members can view and contribute to content with limited management access."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isAtLimit}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### `components/members/pending-invitations.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cancelInvitation } from "@/actions/members";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import type { PendingInvitation } from "@/actions/members";

type Props = {
  invitations: PendingInvitation[];
  currentUserRole: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function isExpired(date: Date) {
  return new Date(date) < new Date();
}

export function PendingInvitations({ invitations, currentUserRole }: Props) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canCancel =
    currentUserRole === "owner" || currentUserRole === "admin";

  async function handleCancel(invitationId: string) {
    setCancellingId(invitationId);

    const result = await cancelInvitation(invitationId);

    if (result.success) {
      toast.success("Invitation cancelled");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to cancel invitation");
    }

    setCancellingId(null);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Invited by</TableHead>
            <TableHead>Expires</TableHead>
            {canCancel && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canCancel ? 5 : 4}
                className="h-24 text-center text-muted-foreground"
              >
                No pending invitations.
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((inv) => {
              const expired = isExpired(inv.expiresAt);

              return (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {inv.role
                        ? ROLE_DISPLAY_NAMES[inv.role] ?? inv.role
                        : "Member"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.inviterName}
                  </TableCell>
                  <TableCell>
                    {expired ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Expired
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(inv.expiresAt)}
                      </span>
                    )}
                  </TableCell>
                  {canCancel && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleCancel(inv.id)}
                        disabled={cancellingId === inv.id}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Cancel invitation</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### `components/members/change-role-dialog.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateMemberRole, type OrgRole } from "@/actions/members";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/permissions";
import type { MemberWithUser } from "@/actions/members";

type Props = {
  orgId: string;
  member: MemberWithUser | null;
  onClose: () => void;
};

export function ChangeRoleDialog({ orgId, member, onClose }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<OrgRole>(member?.role as OrgRole ?? "member");
  const [loading, setLoading] = useState(false);

  // Reset role when member changes
  const currentRole = member?.role ?? "member";

  // Available roles to assign (owner cannot be assigned via this dialog)
  const availableRoles = [
    { value: "admin", label: ROLE_DISPLAY_NAMES.admin },
    { value: "member", label: ROLE_DISPLAY_NAMES.member },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!member) return;
    if (role === currentRole) {
      onClose();
      return;
    }

    setLoading(true);

    const result = await updateMemberRole(orgId, member.id, role);

    if (result.success) {
      toast.success(
        `${member.user.name}'s role changed to ${ROLE_DISPLAY_NAMES[role] ?? role}`
      );
      onClose();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update role");
    }

    setLoading(false);
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Update the role for{" "}
            <strong>{member?.user.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current role</Label>
              <p className="text-sm text-muted-foreground">
                {ROLE_DISPLAY_NAMES[currentRole] ?? currentRole}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">New role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as OrgRole)}
                defaultValue={currentRole}
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === "admin"
                  ? "Leads can manage members and content but cannot access billing or settings."
                  : "Members can view and contribute to content with limited management access."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || role === currentRole}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### `components/members/remove-member-dialog.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { removeMember } from "@/actions/members";
import type { MemberWithUser } from "@/actions/members";

type Props = {
  orgId: string;
  member: MemberWithUser | null;
  onClose: () => void;
};

export function RemoveMemberDialog({ orgId, member, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!member) return;

    setLoading(true);

    const result = await removeMember(orgId, member.id);

    if (result.success) {
      toast.success(`${member.user.name} has been removed from the organisation`);
      onClose();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to remove member");
    }

    setLoading(false);
  }

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <strong>{member?.user.name}</strong> ({member?.user.email}) from this
            organisation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? "Removing..." : "Remove Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.10 Task Components

#### `components/plugins/tasks/status-select.tsx`
```tsx
"use client";

import {
  Circle,
  CircleDot,
  Timer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ISSUE_STATUSES, type IssueStatus } from "@/lib/plugins/tasks-types";

const STATUS_ICONS: Record<IssueStatus, React.ReactNode> = {
  backlog: <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />,
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Timer className="h-3.5 w-3.5 text-yellow-500" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  cancelled: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

export function getStatusIcon(status: string) {
  return STATUS_ICONS[status as IssueStatus] ?? STATUS_ICONS.backlog;
}

export function getStatusLabel(status: string) {
  return (
    ISSUE_STATUSES.find((s) => s.value === status)?.label ?? status
  );
}

export function StatusSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: IssueStatus) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as IssueStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            {getStatusIcon(value)}
            <span>{getStatusLabel(value)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ISSUE_STATUSES.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            <span className="flex items-center gap-2">
              {getStatusIcon(status.value)}
              <span>{status.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### `components/plugins/tasks/priority-select.tsx`
```tsx
"use client";

import {
  SignalHigh,
  SignalMedium,
  SignalLow,
  AlertTriangle,
  Minus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ISSUE_PRIORITIES,
  type IssuePriority,
} from "@/lib/plugins/tasks-types";

const PRIORITY_ICONS: Record<IssuePriority, React.ReactNode> = {
  urgent: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  high: <SignalHigh className="h-3.5 w-3.5 text-orange-500" />,
  medium: <SignalMedium className="h-3.5 w-3.5 text-yellow-500" />,
  low: <SignalLow className="h-3.5 w-3.5 text-blue-500" />,
  no_priority: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function getPriorityIcon(priority: string) {
  return PRIORITY_ICONS[priority as IssuePriority] ?? PRIORITY_ICONS.no_priority;
}

export function getPriorityLabel(priority: string) {
  return (
    ISSUE_PRIORITIES.find((p) => p.value === priority)?.label ?? priority
  );
}

export function PrioritySelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: IssuePriority) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as IssuePriority)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            {getPriorityIcon(value)}
            <span>{getPriorityLabel(value)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ISSUE_PRIORITIES.map((priority) => (
          <SelectItem key={priority.value} value={priority.value}>
            <span className="flex items-center gap-2">
              {getPriorityIcon(priority.value)}
              <span>{priority.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### `components/plugins/tasks/assignee-select.tsx`
```tsx
"use client";

import { User, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { OrgMember } from "@/lib/plugins/tasks-types";

export function AssigneeSelect({
  value,
  onValueChange,
  members,
  disabled,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
  members: OrgMember[];
  disabled?: boolean;
}) {
  const selectedMember = members.find((m) => m.id === value);

  return (
    <div className="flex items-center gap-1">
      <Select
        value={value ?? "unassigned"}
        onValueChange={(v) => onValueChange(v === "unassigned" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {selectedMember ? (
              <span className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedMember.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedMember.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Unassigned</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Unassigned</span>
            </span>
          </SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              <span className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={m.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {m.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{m.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onValueChange(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
```

#### `components/plugins/tasks/create-issue-dialog.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusSelect } from "./status-select";
import { PrioritySelect } from "./priority-select";
import { AssigneeSelect } from "./assignee-select";
import { createIssue } from "@/actions/tasks";
import { toast } from "sonner";
import type {
  IssueStatus,
  IssuePriority,
  OrgMember,
} from "@/lib/plugins/tasks-types";

export function CreateIssueDialog({
  orgId,
  orgSlug,
  members,
}: {
  orgId: string;
  orgSlug: string;
  members: OrgMember[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("backlog");
  const [priority, setPriority] = useState<IssuePriority>("no_priority");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("backlog");
    setPriority("no_priority");
    setAssigneeId(null);
    setDueDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    const result = await createIssue(orgId, {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assigneeId: assigneeId ?? undefined,
      dueDate: dueDate || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success(`Issue ${result.identifier} created`);
      resetForm();
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to create issue");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Issue</DialogTitle>
            <DialogDescription>
              Add a new issue to track work for your org.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue (optional, supports markdown)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <StatusSelect value={status} onValueChange={setStatus} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <PrioritySelect value={priority} onValueChange={setPriority} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <AssigneeSelect
                value={assigneeId}
                onValueChange={setAssigneeId}
                members={members}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### `components/plugins/tasks/issues-board.tsx`
```tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusIcon, getStatusLabel } from "./status-select";
import { getPriorityIcon, getPriorityLabel } from "./priority-select";
import {
  ISSUE_STATUSES,
  type IssueWithAssignee,
} from "@/lib/plugins/tasks-types";

export function IssuesBoard({
  issues,
  orgSlug,
}: {
  issues: IssueWithAssignee[];
  orgSlug: string;
}) {
  // Group issues by status, in status order
  const groupedIssues = ISSUE_STATUSES.map((status) => ({
    status: status.value,
    label: status.label,
    issues: issues.filter((i) => i.status === status.value),
  }));

  // Sort issues within each group by priority (urgent first)
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    no_priority: 4,
  };

  for (const group of groupedIssues) {
    group.issues.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );
  }

  const hasAnyIssues = issues.length > 0;

  if (!hasAnyIssues) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No issues yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first issue to start tracking work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groupedIssues.map((group) => (
        <StatusGroup
          key={group.status}
          status={group.status}
          label={group.label}
          issues={group.issues}
          orgSlug={orgSlug}
        />
      ))}
    </div>
  );
}

function StatusGroup({
  status,
  label,
  issues,
  orgSlug,
}: {
  status: string;
  label: string;
  issues: IssueWithAssignee[];
  orgSlug: string;
}) {
  // Don't render empty groups for done/cancelled unless they have issues
  const hideIfEmpty =
    status === "done" || status === "cancelled" || status === "backlog";
  if (hideIfEmpty && issues.length === 0) return null;

  return (
    <Collapsible defaultOpen={issues.length > 0}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex items-center gap-2">
          {getStatusIcon(status)}
          {label}
        </span>
        <Badge variant="secondary" className="ml-1 text-xs">
          {issues.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {issues.length === 0 ? (
          <p className="px-10 py-3 text-sm text-muted-foreground">
            No issues
          </p>
        ) : (
          <div className="ml-2 border-l">
            {issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function IssueRow({
  issue,
  orgSlug,
}: {
  issue: IssueWithAssignee;
  orgSlug: string;
}) {
  return (
    <Link
      href={`/app/${orgSlug}/tasks/${issue.id}`}
      className="flex items-center gap-3 rounded-md px-4 py-2.5 ml-2 hover:bg-muted/50 transition-colors group"
    >
      {/* Priority icon */}
      <span className="flex-shrink-0" title={getPriorityLabel(issue.priority)}>
        {getPriorityIcon(issue.priority)}
      </span>

      {/* Identifier */}
      <span className="flex-shrink-0 text-xs font-mono text-muted-foreground w-20">
        {issue.identifier}
      </span>

      {/* Title */}
      <span className="flex-1 truncate text-sm">{issue.title}</span>

      {/* Due date */}
      {issue.dueDate && (
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {new Date(issue.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}

      {/* Assignee */}
      {issue.assignee && (
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarImage src={issue.assignee.image ?? undefined} />
          <AvatarFallback className="text-[10px]">
            {issue.assignee.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}
```

#### `components/plugins/tasks/issue-activity.tsx`
```tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStatusLabel, getStatusIcon } from "./status-select";
import { getPriorityLabel, getPriorityIcon } from "./priority-select";
import type { IssueActivityEntry } from "@/lib/plugins/tasks-types";

function formatActivityDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActivityDescription({ entry }: { entry: IssueActivityEntry }) {
  switch (entry.type) {
    case "created":
      return <span>created this issue</span>;
    case "status_change":
      return (
        <span className="flex flex-wrap items-center gap-1">
          changed status from
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getStatusIcon(entry.fromValue ?? "")}
            {getStatusLabel(entry.fromValue ?? "")}
          </span>
          to
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getStatusIcon(entry.toValue ?? "")}
            {getStatusLabel(entry.toValue ?? "")}
          </span>
        </span>
      );
    case "priority_change":
      return (
        <span className="flex flex-wrap items-center gap-1">
          changed priority from
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getPriorityIcon(entry.fromValue ?? "")}
            {getPriorityLabel(entry.fromValue ?? "")}
          </span>
          to
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            {getPriorityIcon(entry.toValue ?? "")}
            {getPriorityLabel(entry.toValue ?? "")}
          </span>
        </span>
      );
    case "assignment":
      if (!entry.toValue) {
        return <span>removed the assignee</span>;
      }
      if (!entry.fromValue) {
        return <span>assigned this issue</span>;
      }
      return <span>changed the assignee</span>;
    case "comment":
      return <span>added a comment</span>;
    default:
      return <span>{entry.type}</span>;
  }
}

export function IssueActivityLog({
  activity,
}: {
  activity: IssueActivityEntry[];
}) {
  if (activity.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 text-sm">
          <Avatar className="h-6 w-6 mt-0.5">
            <AvatarImage src={entry.actor.image ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {entry.actor.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-medium">{entry.actor.name}</span>
              <ActivityDescription entry={entry} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatActivityDate(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### `components/plugins/tasks/issue-comments.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/actions/tasks";
import { toast } from "sonner";
import type { IssueComment } from "@/lib/plugins/tasks-types";

function formatCommentDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IssueComments({
  issueId,
  comments,
  currentUserId,
  currentUserRole,
}: {
  issueId: string;
  comments: IssueComment[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDeleteAny =
    currentUserRole === "owner" || currentUserRole === "admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    const result = await addComment(issueId, body.trim());
    setLoading(false);

    if (result.success) {
      setBody("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to add comment");
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    const result = await deleteComment(commentId);
    setDeletingId(null);

    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete comment");
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing comments */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const canDelete =
              canDeleteAny || comment.author.id === currentUserId;
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-7 w-7 mt-0.5 flex-shrink-0">
                  <AvatarImage src={comment.author.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={loading || !body.trim()}
          >
            {loading ? "Posting..." : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

#### `components/plugins/tasks/issue-detail.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusSelect } from "./status-select";
import { PrioritySelect } from "./priority-select";
import { AssigneeSelect } from "./assignee-select";
import { IssueActivityLog } from "./issue-activity";
import { IssueComments } from "./issue-comments";
import { updateIssue, deleteIssue } from "@/actions/tasks";
import { toast } from "sonner";
import type {
  IssueWithAssignee,
  IssueComment,
  IssueActivityEntry,
  IssueStatus,
  IssuePriority,
  OrgMember,
} from "@/lib/plugins/tasks-types";

export function IssueDetail({
  issue,
  comments,
  activity,
  members,
  orgSlug,
  currentUserId,
  currentUserRole,
}: {
  issue: IssueWithAssignee;
  comments: IssueComment[];
  activity: IssueActivityEntry[];
  members: OrgMember[];
  orgSlug: string;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnerOrAdmin =
    currentUserRole === "owner" || currentUserRole === "admin";
  const canEdit = isOwnerOrAdmin || issue.creatorId === currentUserId;
  const canDelete = isOwnerOrAdmin;

  async function handleFieldUpdate(
    field: string,
    value: string | null
  ) {
    const result = await updateIssue(issue.id, { [field]: value });
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update issue");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteIssue(issue.id);
    setDeleting(false);

    if (result.success) {
      toast.success("Issue deleted");
      router.push(`/app/${orgSlug}/tasks`);
    } else {
      toast.error(result.error ?? "Failed to delete issue");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/app/${orgSlug}/tasks`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm font-mono text-muted-foreground">
          {issue.identifier}
        </span>
        {canDelete && (
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Issue</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {issue.identifier}? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main content */}
        <div className="space-y-6">
          {/* Title */}
          <EditableTitle
            value={issue.title}
            onSave={(val) => handleFieldUpdate("title", val)}
            disabled={!canEdit}
          />

          {/* Description */}
          <EditableDescription
            value={issue.description ?? ""}
            onSave={(val) => handleFieldUpdate("description", val || null)}
            disabled={!canEdit}
          />

          <Separator />

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Comments</h3>
            <IssueComments
              issueId={issue.id}
              comments={comments}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>

          <Separator />

          {/* Activity Log */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Activity</h3>
            <IssueActivityLog activity={activity} />
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border p-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <StatusSelect
                value={issue.status}
                onValueChange={(val) => handleFieldUpdate("status", val)}
                disabled={!canEdit}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </label>
              <PrioritySelect
                value={issue.priority}
                onValueChange={(val) => handleFieldUpdate("priority", val)}
                disabled={!canEdit}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assignee
              </label>
              <AssigneeSelect
                value={issue.assigneeId}
                onValueChange={(val) => handleFieldUpdate("assigneeId", val)}
                members={members}
                disabled={!canEdit}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Due Date
              </label>
              <Input
                type="date"
                value={issue.dueDate ?? ""}
                onChange={(e) =>
                  handleFieldUpdate("dueDate", e.target.value || null)
                }
                disabled={!canEdit}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Meta info */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Created by {issue.creator.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(issue.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Inline editable fields
// ============================================================

function EditableTitle({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (val: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleBlur() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) {
      onSave(draft.trim());
    } else {
      setDraft(value);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (disabled || !editing) {
    return (
      <h1
        className="text-2xl font-bold tracking-tight cursor-text"
        onClick={() => !disabled && setEditing(true)}
      >
        {value}
      </h1>
    );
  }

  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      className="text-2xl font-bold h-auto py-1 px-2"
    />
  );
}

function EditableDescription({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (val: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleBlur() {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  }

  if (disabled || !editing) {
    return (
      <div
        className="min-h-[60px] cursor-text text-sm"
        onClick={() => !disabled && setEditing(true)}
      >
        {value ? (
          <p className="whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {disabled ? "No description" : "Click to add a description..."}
          </p>
        )}
      </div>
    );
  }

  return (
    <Textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      rows={5}
      placeholder="Add a description..."
      className="text-sm"
    />
  );
}
```

---

### 5.11 Styles

#### `app/globals.css`
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### `lib/utils.ts`
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### 5.12 Settings Components

#### `components/settings/settings-content.tsx`
```tsx
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
  plan,
}: {
  orgId: string;
  orgSlug: string;
  orgName: string;
  orgLogo: string | null;
  plan: string;
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
              plan={plan}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `components/settings/delete-org-dialog.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteOrg } from "@/actions/settings";
import { toast } from "sonner";

export function DeleteOrgDialog({
  orgId,
  orgName,
  orgSlug,
  plan,
}: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  plan: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const hasPaidPlan = plan !== "free";
  const confirmed = confirmation === orgName;

  async function handleDelete() {
    if (!confirmed) return;

    setDeleting(true);
    const result = await deleteOrg(orgId);
    setDeleting(false);

    if (result.success) {
      toast.success("Organization deleted");
      router.push("/app");
    } else {
      toast.error(result.error ?? "Failed to delete organization");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All organization data,
            including members, tasks, and settings, will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        {hasPaidPlan ? (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm text-destructive font-medium">
              You have an active paid subscription. Please cancel your
              subscription from the Billing page before deleting this
              organization.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Type <span className="font-semibold">{orgName}</span> to
                confirm:
              </Label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={orgName}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !confirmed || hasPaidPlan}
          >
            {deleting ? "Deleting..." : "Delete Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5.13 Billing Components

#### `components/billing/billing-content.tsx`
```tsx
"use client";

import { useState } from "react";
import {
  Check,
  Crown,
  Building,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";

const PLAN_DETAILS: Record<
  string,
  {
    label: string;
    description: string;
    features: string[];
    cta?: string;
  }
> = {
  free: {
    label: "Free",
    description: "For small clubs getting started.",
    features: [
      "Up to 6 members",
      "Task Management",
      "Basic organization features",
    ],
  },
  plus: {
    label: "Plus",
    description: "For growing organizations that need more.",
    features: [
      "Up to 30 members",
      "Task Management",
      "All current & future plugins",
      "Priority support",
    ],
    cta: "Upgrade to Plus",
  },
  enterprise: {
    label: "Enterprise",
    description: "For large organizations with custom needs.",
    features: [
      "Unlimited members",
      "All plugins",
      "Priority support",
      "Custom branding",
      "Dedicated account manager",
    ],
    cta: "Contact Us",
  },
};

export function BillingContent({
  orgId,
  orgSlug,
  plan,
  hasActiveSubscription,
  periodEnd,
  cancelAtPeriodEnd,
}: {
  orgId: string;
  orgSlug: string;
  plan: string;
  hasActiveSubscription: boolean;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const currentPlan = PLAN_DETAILS[plan] ?? PLAN_DETAILS.free;

  async function handleUpgrade(targetPlan: string, annual?: boolean) {
    setUpgrading(targetPlan);

    try {
      const result = await authClient.subscription.upgrade({
        plan: targetPlan,
        annual: annual ?? false,
        referenceId: orgId,
        successUrl: `${window.location.origin}/app/${orgSlug}/billing`,
        cancelUrl: `${window.location.origin}/app/${orgSlug}/billing`,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to start upgrade");
        setUpgrading(null);
      }
      // If successful, better-auth redirects to Stripe Checkout
    } catch {
      toast.error("Failed to start upgrade");
      setUpgrading(null);
    }
  }

  async function handleBillingPortal() {
    setOpeningPortal(true);

    try {
      const result = await authClient.subscription.billingPortal({
        referenceId: orgId,
        returnUrl: `${window.location.origin}/app/${orgSlug}/billing`,
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to open billing portal"
        );
        setOpeningPortal(false);
      }
      // If successful, better-auth redirects to Stripe Customer Portal
    } catch {
      toast.error("Failed to open billing portal");
      setOpeningPortal(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your organization is on the{" "}
                <span className="font-semibold">{currentPlan.label}</span> plan.
              </CardDescription>
            </div>
            <Badge
              variant={plan === "free" ? "secondary" : "default"}
              className="text-sm"
            >
              {currentPlan.label}
            </Badge>
          </div>
        </CardHeader>
        {hasActiveSubscription && (
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              {cancelAtPeriodEnd ? (
                <p className="text-yellow-600 dark:text-yellow-500">
                  Your subscription is set to cancel at the end of the current
                  billing period
                  {periodEnd && (
                    <>
                      {" "}
                      on{" "}
                      {new Date(periodEnd).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </>
                  )}
                  .
                </p>
              ) : (
                periodEnd && (
                  <p>
                    Next billing date:{" "}
                    {new Date(periodEnd).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )
              )}
            </div>
          </CardContent>
        )}
        {hasActiveSubscription && plan !== "free" && (
          <CardFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBillingPortal}
              disabled={openingPortal}
            >
              {openingPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          </CardFooter>
        )}
      </Card>

      <Separator />

      {/* Plan Comparison */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Plan */}
          <PlanCard
            planKey="free"
            currentPlan={plan}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
          />

          {/* Plus Plan */}
          <PlanCard
            planKey="plus"
            currentPlan={plan}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
            highlighted
          />

          {/* Enterprise Plan */}
          <PlanCard
            planKey="enterprise"
            currentPlan={plan}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
          />
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  planKey,
  currentPlan,
  onUpgrade,
  upgrading,
  highlighted,
}: {
  planKey: string;
  currentPlan: string;
  onUpgrade: (plan: string, annual?: boolean) => void;
  upgrading: string | null;
  highlighted?: boolean;
}) {
  const details = PLAN_DETAILS[planKey];
  if (!details) return null;

  const isCurrent = planKey === currentPlan;
  const isDowngrade =
    (currentPlan === "plus" && planKey === "free") ||
    (currentPlan === "enterprise" && planKey !== "enterprise");

  return (
    <Card
      className={
        highlighted && !isCurrent
          ? "border-primary shadow-sm"
          : isCurrent
            ? "border-primary/50 bg-primary/5"
            : ""
      }
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          {planKey === "enterprise" ? (
            <Building className="h-5 w-5 text-muted-foreground" />
          ) : planKey === "plus" ? (
            <Crown className="h-5 w-5 text-primary" />
          ) : null}
          <CardTitle className="text-lg">{details.label}</CardTitle>
          {isCurrent && (
            <Badge variant="outline" className="ml-auto text-xs">
              Current
            </Badge>
          )}
        </div>
        <CardDescription>{details.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {details.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : planKey === "enterprise" ? (
          <Button variant="outline" className="w-full" asChild>
            <a href="mailto:support@club.app">Contact Us</a>
          </Button>
        ) : isDowngrade ? (
          <Button variant="ghost" className="w-full text-muted-foreground" disabled>
            Downgrade via Manage Billing
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onUpgrade(planKey)}
            disabled={upgrading !== null}
          >
            {upgrading === planKey ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {details.cta ?? `Switch to ${details.label}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

### 5.14 Phase 6: Polish

#### `app/layout.tsx` (updated — SEO metadata)
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Club — Student Org Management",
    template: "%s | Club",
  },
  description:
    "Modular platform for student-led organisations to organise their work. Manage tasks, coordinate teams, and grow your community.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    siteName: "Club",
    title: "Club — Student Org Management",
    description:
      "Modular platform for student-led organisations to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Club — Student Org Management",
    description:
      "Modular platform for student-led organisations to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

#### `app/(marketing)/page.tsx` (updated — SEO metadata)
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Club — Your student org, all in one place",
  description:
    "Club gives student-led organisations a shared home to organise their work. Manage tasks, coordinate teams, and grow your community — all from one modular platform.",
  openGraph: {
    title: "Club — Your student org, all in one place",
    description:
      "Club gives student-led organisations a shared home to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
  twitter: {
    title: "Club — Your student org, all in one place",
    description:
      "Club gives student-led organisations a shared home to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Club
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your student org,
            <br />
            all in one place.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Club gives student-led organisations a shared home to organise their
            work. Manage tasks, coordinate teams, and grow your community — all
            from one modular platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">Start for Free</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built for student communities.
        </div>
      </footer>
    </div>
  );
}
```

#### `app/(marketing)/sign-in/layout.tsx` (new)
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Club account to access your workspace.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

#### `app/(marketing)/sign-up/layout.tsx` (new)
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Club account and start managing your student organisation.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

#### `app/app/[slug]/home/page.tsx` (replaced — full dashboard)
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema/auth";
import { issues, issueActivity } from "@/lib/db/schema/tasks";
import { orgProfiles } from "@/lib/db/schema/orgs";
import { eq, and, desc, sql } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Users,
  ArrowRight,
} from "lucide-react";

async function getDashboardData(orgId: string) {
  const [
    allIssues,
    members,
    profile,
    recentActivity,
  ] = await Promise.all([
    db
      .select({ status: issues.status })
      .from(issues)
      .where(eq(issues.orgId, orgId)),
    db.query.member.findMany({
      where: eq(member.organizationId, orgId),
    }),
    db.query.orgProfiles.findFirst({
      where: eq(orgProfiles.id, orgId),
    }),
    db
      .select({
        id: issueActivity.id,
        issueId: issueActivity.issueId,
        type: issueActivity.type,
        fromValue: issueActivity.fromValue,
        toValue: issueActivity.toValue,
        createdAt: issueActivity.createdAt,
        actorId: issueActivity.actorId,
        actorName: user.name,
        actorImage: user.image,
        issueTitle: issues.title,
        issueIdentifier: issues.identifier,
      })
      .from(issueActivity)
      .innerJoin(user, eq(issueActivity.actorId, user.id))
      .innerJoin(issues, eq(issueActivity.issueId, issues.id))
      .where(eq(issues.orgId, orgId))
      .orderBy(desc(issueActivity.createdAt))
      .limit(10),
  ]);

  const taskStats = {
    total: allIssues.length,
    backlog: allIssues.filter((i) => i.status === "backlog").length,
    todo: allIssues.filter((i) => i.status === "todo").length,
    inProgress: allIssues.filter((i) => i.status === "in_progress").length,
    done: allIssues.filter((i) => i.status === "done").length,
    cancelled: allIssues.filter((i) => i.status === "cancelled").length,
  };

  return {
    taskStats,
    memberCount: members.length,
    plan: profile?.plan ?? "free",
    recentActivity,
  };
}

function getActivityDescription(
  type: string,
  fromValue: string | null,
  toValue: string | null
): string {
  switch (type) {
    case "created":
      return "created this issue";
    case "status_change":
      return `changed status from ${formatValue(fromValue)} to ${formatValue(toValue)}`;
    case "priority_change":
      return `changed priority from ${formatValue(fromValue)} to ${formatValue(toValue)}`;
    case "assignment":
      if (!fromValue && toValue) return "assigned this issue";
      if (fromValue && !toValue) return "unassigned this issue";
      return "changed assignment";
    case "comment":
      return "commented";
    default:
      return "updated this issue";
  }
}

function formatValue(value: string | null): string {
  if (!value) return "none";
  return value.replace(/_/g, " ");
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/app");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, org.id),
      eq(member.userId, session.user.id),
    ),
  });

  if (!membership) {
    redirect("/app");
  }

  const data = await getDashboardData(org.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Overview of {org.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.taskStats.backlog} in backlog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.todo}</div>
            <p className="text-xs text-muted-foreground">
              tasks ready to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              tasks being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taskStats.done}</div>
            <p className="text-xs text-muted-foreground">
              tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Members</CardTitle>
              <CardDescription>
                {data.memberCount} {data.memberCount === 1 ? "member" : "members"}
                <Badge variant="secondary" className="ml-2 text-[10px] capitalize">
                  {data.plan}
                </Badge>
              </CardDescription>
            </div>
            <Link
              href={`/app/${slug}/members`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
        </Card>

        {/* Quick Links Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href={`/app/${slug}/tasks`}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors"
            >
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span>View all tasks</span>
              <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </Link>
            <Link
              href={`/app/${slug}/members`}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent/50 transition-colors"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Manage members</span>
              <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest changes across your tasks</CardDescription>
          </div>
          <Link
            href={`/app/${slug}/tasks`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All tasks
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No activity yet. Create your first task to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7 mt-0.5">
                    <AvatarImage src={activity.actorImage ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {activity.actorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.actorName}</span>{" "}
                      {getActivityDescription(
                        activity.type,
                        activity.fromValue,
                        activity.toValue
                      )}
                    </p>
                    <Link
                      href={`/app/${slug}/tasks/${activity.issueId}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {activity.issueIdentifier}: {activity.issueTitle}
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `app/app/loading.tsx` (new — org switcher skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function OrgSwitcherLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="size-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### `app/app/[slug]/home/loading.tsx` (new — dashboard skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function HomeLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-5 w-48 mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32 mt-1" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-36 mt-1" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `app/app/[slug]/members/loading.tsx` (new — members skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />

        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="border-b p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### `app/app/[slug]/settings/loading.tsx` (new — settings skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 w-56 mt-2" />
      </div>

      {/* Org Name Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-16" />
        </CardFooter>
      </Card>

      {/* Logo Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-52 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-16" />
        </CardFooter>
      </Card>

      <Skeleton className="h-px w-full" />

      {/* Danger Zone Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### `app/app/[slug]/billing/loading.tsx` (new — billing skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function BillingLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-5 w-52 mt-2" />
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </CardHeader>
      </Card>

      <Separator />

      {/* Plan Comparison */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### `app/app/[slug]/tasks/loading.tsx` (new — tasks skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16 mt-1" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Status groups */}
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 px-3 py-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="ml-4 border-l">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 px-4 py-2.5 ml-2"
                >
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-16 font-mono" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `app/app/[slug]/tasks/[issueId]/loading.tsx` (new — issue detail skeleton)
```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function IssueDetailLoading() {
  return (
    <div className="flex flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Back link */}
        <Skeleton className="h-4 w-24" />

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <Separator />

        {/* Activity & Comments */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `app/error.tsx` (new — global error boundary)
```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/app")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### `app/app/[slug]/error.tsx` (new — org workspace error boundary)
```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Org workspace error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading this page. Please try again or go back
          to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/app">Back to organisations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### `app/not-found.tsx` (new — global 404)
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/app">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### `app/app/[slug]/not-found.tsx` (new — org-scoped 404)
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function OrgNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Not found</h2>
        <p className="text-sm text-muted-foreground">
          The organisation or page you are looking for does not exist, or you do
          not have access to it.
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link href="/app">Back to organisations</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## 6. What's Next

All 7 phases (0-6) are **complete**. The remaining items are either deployment tasks or secondary features:

### Deployment (not code tasks)
1. **Vercel project setup** — Create project, configure env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`)
2. **Deploy to production** — Push to main, Vercel auto-deploys

### Secondary features (not required for launch)
1. **Email verification flow** — Currently console.log placeholder in `auth.ts`
2. **Password reset flow** — Not implemented
3. **Invite link generation** — Shareable invite links (not implemented)
4. **Accessibility audit** — Keyboard navigation, ARIA labels, focus management
5. **Mobile responsiveness audit** — Ensure all pages work well on mobile
