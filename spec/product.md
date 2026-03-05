# Club — Product Specification

> Modular Student Org Management Platform
> Version: 0.1.1 (MVP-2)
> Last Updated: 2026-03-05
> Status: Pre-development

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Users](#2-target-users)
3. [Core Concepts](#3-core-concepts)
4. [Information Architecture](#4-information-architecture)
5. [Feature Specification — MVP](#5-feature-specification--mvp)
6. [Plugin System](#6-plugin-system)
7. [Task Management Plugin (MVP)](#7-task-management-plugin-mvp)
8. [Billing & Plans](#8-billing--plans)
9. [Database Schema](#9-database-schema)
10. [Tech Stack & Architecture](#10-tech-stack--architecture)
11. [Route Map](#11-route-map)
12. [Auth Architecture](#12-auth-architecture)
13. [Permission System](#13-permission-system)
14. [API Design](#14-api-design)
15. [Environment Variables](#15-environment-variables)
16. [Implementation Phases](#16-implementation-phases)

---

## 1. Product Vision

Club is a multi-tenant SaaS platform for student-led organisations. It gives clubs, dev communities, Model UNs, and student event teams a shared home to organise their work — a modular space where each org gets its own isolated workspace, populated with only the tools they choose.

The product is inspired by the simplicity of Hack Club but built with B2B SaaS architecture: one platform, many tenants, each fully self-contained.

**Design philosophy:**
- Every org is its own walled garden — no cross-org data bleed
- Plugins are first-party only; modularity is an internal architectural principle, not a marketplace
- The platform grows with the org: start free, upgrade as you scale
- Built for self-hostability from day one, even though it launches as closed SaaS

---

## 2. Target Users

| Role | Description |
|------|-------------|
| **Admin** | Org creator / owner. Full control. Manages billing, members, settings, and all plugins. Maps to `owner` in better-auth's organisation plugin. |
| **Lead** | Officer-level. Can manage members, create/assign tasks, manage plugin content. Cannot access billing or org settings. Maps to `admin` in better-auth. |
| **Member** | Standard contributor. Can view and interact with plugin content based on plugin-level permissions. Read-mostly. Maps to `member` in better-auth. |

> **Important:** The role names exposed in the UI are `Admin`, `Lead`, and `Member`. Internally they map to better-auth's `owner`, `admin`, and `member`. This mapping is encapsulated in `lib/auth/permissions.ts` so the UI never references internal role names directly.

**User identity:** One global account per person. A user can be a member of many orgs with different roles in each. Each membership can have a distinct `displayName` stored on the membership record (separate from the global `user.name`).

---

## 3. Core Concepts

### Organisation (Org)
The top-level multi-tenant unit. Each org has:
- A unique human-readable `slug` (used in URLs: `app.domain.com/acm-club/...`)
- A `name`, optional `logo`, optional `description`
- A `plan` (free / plus / enterprise)
- Its own isolated set of plugin instances
- Its own member list with roles

### Membership
The join table between a user and an org. Contains:
- `userId`
- `organizationId`
- `role` (`owner` | `admin` | `member`)
- `displayName` — org-specific display name (optional, falls back to `user.name`)
- `createdAt`

### Plugin
A self-contained functional module that can be enabled per org. Each plugin:
- Has its own database tables scoped by `orgId`
- Has its own UI routes under `/:slug/[plugin-slug]/...`
- Declares its own permission requirements
- Can be toggled on/off per org (plan-gated in MVP)

### Active Org
The org the user is currently operating in. Stored in the better-auth session (`activeOrganizationId`). The session is updated when the user switches orgs.

---

## 4. Information Architecture

```
App
├── / (marketing landing page — unauthenticated)
├── /sign-in
├── /sign-up
├── /accept-invitation/:invitationId
│
└── /app (authenticated shell)
    ├── / → Org Switcher (full-screen, default homepage when authed)
    │
    └── /:slug (org workspace)
        ├── /home (org home / dashboard — future)
        ├── /members (member management)
        ├── /settings (org settings — admin only)
        ├── /billing (billing — admin only)
        │
        └── /tasks (Task Management Plugin)
            ├── / (all issues — inbox view)
            ├── /[issueId] (issue detail)
            └── /settings (plugin settings — admin/lead)
```

---

## 5. Feature Specification — MVP

### 5.1 Authentication

- Email + password sign up / sign in (better-auth `emailAndPassword`)
- Email verification on sign up
- Password reset via email
- Session management via better-auth (cookie-based, httpOnly)
- Middleware protects all `/app` routes; unauthenticated users redirected to `/sign-in`

### 5.2 Org Creation

- Any authenticated user can create an org
- Org creation collects: `name`, `slug` (auto-generated from name, user-editable)
- Slug must be URL-safe, lowercase, unique across the platform
- Creator is automatically assigned `owner` role and added as first member
- On creation: a Stripe Customer is created for the org (via better-auth stripe plugin) and the org is placed on the `free` plan
- Newly created org becomes the user's active org

### 5.3 Org Switcher

- Full-screen page at `/app` (not a modal, not a sidebar dropdown — a dedicated route)
- Lists all orgs the user is a member of
- Each org card shows: logo/avatar, name, slug, user's role in that org, plan badge
- "Create new org" button on this screen
- Clicking an org sets it as active (`authClient.organization.setActive`) and navigates to `/:slug/home`
- The sidebar has an org switcher in the top-left as a dropdown (secondary, quick-switch), linking back to this full screen if the user wants the full view

### 5.4 Member Management

Route: `/:slug/members`

**Invite flow:**
1. Admin or Lead clicks "Invite Member"
2. Enters email address and selects role (`Lead` or `Member`)
3. System checks member count against plan limits before sending
4. If within limits: better-auth sends invitation email with a magic link to `/accept-invitation/:invitationId`
5. Invited user clicks link → if not signed in, sent to `/sign-in?redirect=/accept-invitation/:invitationId` → after auth, invitation is accepted
6. If user is already a Club user, they are added immediately on link click

**Invite link (secondary):**
- Admins and Leads can generate a shareable invite link for the org
- Link expires after 7 days or single-use (configurable by admin)
- Stored as a special invitation record with `type: "link"` in the invitations table

**Member list view:**
- Paginated table of all members
- Columns: Avatar, Display Name, Email, Role, Joined Date, Actions
- Actions (role-gated): Change Role, Remove Member
- Pending invitations shown in a separate tab

**Permissions:**
- `Admin` can invite, change roles (except change other admins), remove members
- `Lead` can invite Members only; cannot change roles or remove
- `Member` has no member management permissions

### 5.5 Org Settings

Route: `/:slug/settings`
Access: Admin only

- Update org name, slug, logo
- Danger zone: Delete org (requires typing org name to confirm)
- Deletion blocked if org has an active Stripe subscription

### 5.6 Org Switching (Sidebar)

- Top-left of sidebar: org avatar + name + chevron
- Dropdown shows all user's orgs (up to 5, then "View all" → `/app`)
- "Create organisation" at the bottom of the dropdown
- Clicking an org triggers `setActive` and navigates to `/:slug/home`

---

## 6. Plugin System

### Architecture

Plugins are first-party modules. They are not installed/uninstalled in the traditional sense for MVP — they are plan-gated. The free plan has only the Task Management plugin available. The Plus plan unlocks all current and future plugins.

**Plugin registry** (`lib/plugins/registry.ts`):
```typescript
export type Plugin = {
  id: string                   // e.g. "tasks"
  name: string                 // e.g. "Task Management"
  description: string
  slug: string                 // URL segment e.g. "tasks"
  icon: LucideIcon
  plans: ('free' | 'plus' | 'enterprise')[]  // which plans include this plugin
  defaultEnabled: boolean
}

export const PLUGINS: Plugin[] = [
  {
    id: 'tasks',
    name: 'Task Management',
    slug: 'tasks',
    plans: ['free', 'plus', 'enterprise'],
    defaultEnabled: true,
  },
  // future: chat, storage, notes, whiteboards, recruitment, finances
]
```

**Per-org plugin state** is tracked in an `org_plugins` table:
- `orgId`
- `pluginId`
- `enabled` (boolean)
- `settings` (jsonb — plugin-specific config)

On org creation, all plugins available on that org's plan are auto-enabled.

When an org upgrades, newly available plugins are auto-enabled (can be disabled in settings).

**Plugin routes** live under `app/(app)/[slug]/[pluginSlug]/`. Each plugin is a self-contained Next.js route group with its own layout, loading states, and error boundaries.

**Plugin sidebar entries** are driven by the plugin registry filtered by `org.plan` and `org_plugins.enabled`.

---

## 7. Task Management Plugin (MVP)

Linear-inspired issue tracker scoped per org. No project grouping in MVP.

### 7.1 Data Model

```
issues
- id (cuid2)
- orgId (fk → organizations.id)
- identifier (sequential per org, e.g. "ACM-42")
- title (text, required)
- description (text/markdown, nullable)
- status (enum: backlog | todo | in_progress | done | cancelled)
- priority (enum: no_priority | urgent | high | medium | low)
- assigneeId (fk → users.id, nullable)
- creatorId (fk → users.id)
- dueDate (date, nullable)
- createdAt
- updatedAt

issue_comments
- id
- issueId (fk → issues.id)
- authorId (fk → users.id)
- body (text/markdown)
- createdAt
- updatedAt

issue_activity
- id
- issueId (fk → issues.id)
- actorId (fk → users.id)
- type (enum: status_change | priority_change | assignment | comment | created)
- from (text, nullable)
- to (text, nullable)
- createdAt
```

### 7.2 Issue Identifier

Each org has an `issueCounter` (integer, stored on `org_profiles`). On every new issue creation, the counter is incremented atomically and the identifier is formatted as `{ORG_SLUG_UPPER}-{counter}` (e.g. `ACM-1`, `ACM-2`).

### 7.3 Views

**All Issues (default):** Grouped by status. Each group is a collapsible section. Issues sorted by priority descending within each group.

**Filters (sidebar):**
- By status
- By priority
- By assignee
- By due date

**Issue Detail (`/tasks/[issueId]`):**
- Full-width slide-over or dedicated page (TBD at implementation)
- Edit title inline
- Edit description (markdown editor)
- Right sidebar metadata: status, priority, assignee, due date, creator, created at
- Activity log (status changes, assignment changes, comments) in chronological order
- Comment input at the bottom

### 7.4 Permissions within Tasks

| Action | Admin | Lead | Member |
|--------|-------|------|--------|
| Create issue | ✓ | ✓ | ✓ |
| Edit any issue | ✓ | ✓ | ✗ |
| Edit own issue | ✓ | ✓ | ✓ |
| Delete issue | ✓ | ✓ | ✗ |
| Change status | ✓ | ✓ | ✓ |
| Assign issue | ✓ | ✓ | ✓ |
| Comment | ✓ | ✓ | ✓ |
| Delete any comment | ✓ | ✓ | ✗ |
| Delete own comment | ✓ | ✓ | ✓ |

### 7.5 Real-time (Post-MVP)

Issue updates are not real-time in MVP. The page uses optimistic updates via server actions + `revalidatePath`. Real-time via Supabase Realtime or Ably is a post-MVP concern.

---

## 8. Billing & Plans

### 8.1 Plans

| Feature | Free | Plus | Enterprise |
|---------|------|------|------------|
| Members | Up to 6 | Up to 30 | Unlimited |
| Task Management | ✓ | ✓ | ✓ |
| Future plugins | ✗ | ✓ | ✓ |
| Priority support | ✗ | ✗ | ✓ |
| Custom branding | ✗ | ✗ | ✓ |
| Price | $0 | TBD/month or TBD/year | Contact sales |

> Pricing amounts are TBD. The Plus plan should offer an annual discount (e.g. 2 months free).

### 8.2 Billing Architecture

- **Billing entity:** The organisation (not the user). Each org is a Stripe Customer.
- **Integration:** better-auth's built-in Stripe plugin (`@better-auth/stripe`) with `organization.enabled: true`
- **Stripe Customer creation:** Triggered automatically on first subscription upgrade attempt (lazy creation)
- **Plan enforcement:**
  - Member count limit: enforced in the `beforeAddMember` org hook and `beforeCreateInvitation` hook. If the org is at the limit, the action is rejected with a clear error.
  - Plugin access: checked in the plugin middleware layer before rendering any plugin route
- **Webhook handling:** better-auth's Stripe plugin handles `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` via its built-in webhook handler at `/api/auth/stripe/webhook`
- **Subscription lifecycle hooks:** Used to sync plan state to the `org_profiles` table (`plan` column) so plan checks don't require a Stripe API call on every request
- **Customer Portal:** Stripe-hosted billing portal for plan changes, payment method updates, invoice history. Accessible from `/:slug/billing` (Admin only). Session created on demand via server action.
- **Enterprise:** No self-serve. "Contact us" CTA that opens an email or a Tally form. Manual Stripe setup.

### 8.3 Plan Enforcement Flow

```
User attempts to invite member
  → Server action checks org.plan
  → Queries current member count
  → If count >= limit for plan → return error: "Upgrade to Plus to add more members"
  → If within limit → proceed with invitation
```

---

## 9. Database Schema

Using DrizzleORM with Neon (PostgreSQL). All IDs are `cuid2` strings unless noted.

### 9.1 better-auth managed tables

better-auth's organisation plugin auto-generates and manages these tables via `npx auth generate`. They should not be hand-edited:

- `user` — global user accounts
- `session` — user sessions (includes `activeOrganizationId`)
- `account` — OAuth / credential accounts linked to a user
- `verification` — email verification + password reset tokens
- `organization` — org records (id, name, slug, logo, metadata, createdAt)
- `member` — org membership (id, userId, organizationId, role, createdAt)
- `invitation` — pending invitations (id, email, organizationId, role, status, expiresAt, inviterId)

### 9.2 Custom tables (application-managed)

```sql
-- Extended org data (supplements better-auth's organization table)
org_profiles
  id                text PRIMARY KEY  -- = organizationId, 1:1 relation
  plan              text NOT NULL DEFAULT 'free'  -- 'free' | 'plus' | 'enterprise'
  stripeCustomerId  text
  issueCounter      integer NOT NULL DEFAULT 0
  createdAt         timestamp NOT NULL DEFAULT now()
  updatedAt         timestamp NOT NULL DEFAULT now()

-- Per-org plugin state
org_plugins
  id        text PRIMARY KEY (cuid2)
  orgId     text NOT NULL REFERENCES organization(id) ON DELETE CASCADE
  pluginId  text NOT NULL  -- matches Plugin.id in registry
  enabled   boolean NOT NULL DEFAULT true
  settings  jsonb NOT NULL DEFAULT '{}'
  createdAt timestamp NOT NULL DEFAULT now()
  UNIQUE(orgId, pluginId)

-- Member display name override (supplements better-auth's member table)
member_profiles
  id          text PRIMARY KEY  -- = memberId, 1:1 relation
  displayName text              -- nullable, falls back to user.name
  avatarUrl   text              -- nullable, falls back to user.image
  createdAt   timestamp NOT NULL DEFAULT now()
  updatedAt   timestamp NOT NULL DEFAULT now()

-- Issues
issues
  id          text PRIMARY KEY (cuid2)
  orgId       text NOT NULL REFERENCES organization(id) ON DELETE CASCADE
  identifier  text NOT NULL  -- e.g. "ACM-42", unique per org
  title       text NOT NULL
  description text
  status      text NOT NULL DEFAULT 'backlog'
              -- 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority    text NOT NULL DEFAULT 'no_priority'
              -- 'no_priority' | 'urgent' | 'high' | 'medium' | 'low'
  assigneeId  text REFERENCES user(id) ON DELETE SET NULL
  creatorId   text NOT NULL REFERENCES user(id)
  dueDate     date
  createdAt   timestamp NOT NULL DEFAULT now()
  updatedAt   timestamp NOT NULL DEFAULT now()
  UNIQUE(orgId, identifier)

-- Issue comments
issue_comments
  id        text PRIMARY KEY (cuid2)
  issueId   text NOT NULL REFERENCES issues(id) ON DELETE CASCADE
  authorId  text NOT NULL REFERENCES user(id)
  body      text NOT NULL
  createdAt timestamp NOT NULL DEFAULT now()
  updatedAt timestamp NOT NULL DEFAULT now()

-- Issue activity log
issue_activity
  id        text PRIMARY KEY (cuid2)
  issueId   text NOT NULL REFERENCES issues(id) ON DELETE CASCADE
  actorId   text NOT NULL REFERENCES user(id)
  type      text NOT NULL
            -- 'created' | 'status_change' | 'priority_change' | 'assignment' | 'comment'
  fromValue text
  toValue   text
  createdAt timestamp NOT NULL DEFAULT now()
```

### 9.3 Indexes

```sql
-- Issues: most queries are org-scoped
CREATE INDEX idx_issues_org_id ON issues(orgId);
CREATE INDEX idx_issues_org_status ON issues(orgId, status);
CREATE INDEX idx_issues_assignee ON issues(assigneeId);

-- Activity: always queried by issueId
CREATE INDEX idx_activity_issue_id ON issue_activity(issueId);

-- Comments
CREATE INDEX idx_comments_issue_id ON issue_comments(issueId);

-- Org plugins: queried by orgId constantly
CREATE INDEX idx_org_plugins_org_id ON org_plugins(orgId);
```

---

## 10. Tech Stack & Architecture

### 10.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (new-york style) + TweakCN customisation |
| Icons | Lucide React |
| Auth | better-auth + organisation plugin + stripe plugin |
| ORM | Drizzle ORM |
| Database | Neon (PostgreSQL, serverless) |
| Payments | Stripe (via better-auth stripe plugin) |
| Hosting | Vercel |
| CI/CD | GitHub Actions |
| Package Manager | pnpm |

### 10.2 Project Structure

```
/
├── app/
│   ├── (marketing)/              # Unauthenticated pages
│   │   ├── page.tsx              # Landing page
│   │   ├── sign-in/
│   │   └── sign-up/
│   │
│   ├── accept-invitation/
│   │   └── [invitationId]/
│   │       └── page.tsx
│   │
│   ├── (app)/                    # Authenticated shell (has sidebar layout)
│   │   ├── layout.tsx            # Root app layout: session check, sidebar
│   │   ├── page.tsx              # Org switcher (full screen)
│   │   │
│   │   └── [slug]/               # Org workspace
│   │       ├── layout.tsx        # Sets active org, org context provider
│   │       ├── home/
│   │       ├── members/
│   │       ├── settings/
│   │       ├── billing/
│   │       └── tasks/            # Task Management Plugin
│   │           ├── layout.tsx
│   │           ├── page.tsx      # Issues list
│   │           └── [issueId]/
│   │               └── page.tsx
│   │
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts      # better-auth handler
│
├── lib/
│   ├── auth/
│   │   ├── auth.ts               # better-auth server config
│   │   ├── auth-client.ts        # better-auth client config
│   │   └── permissions.ts        # AC definitions (Admin/Lead/Member → owner/admin/member)
│   ├── db/
│   │   ├── index.ts              # Drizzle + Neon client
│   │   └── schema/
│   │       ├── index.ts          # barrel export
│   │       ├── auth.ts           # better-auth generated schema (do not edit)
│   │       ├── orgs.ts           # org_profiles, org_plugins
│   │       ├── members.ts        # member_profiles
│   │       └── tasks.ts          # issues, issue_comments, issue_activity
│   ├── plugins/
│   │   └── registry.ts           # Plugin registry
│   └── utils.ts                  # cn() and other helpers
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Sidebar, OrgSwitcher, Nav
│   └── plugins/
│       └── tasks/                # Task plugin components
│
├── hooks/                        # Custom React hooks
│
├── actions/                      # Next.js Server Actions
│   ├── orgs.ts
│   ├── members.ts
│   └── tasks.ts
│
├── middleware.ts                  # Route protection
├── drizzle.config.ts
└── spec/
    └── product.md
```

### 10.3 Data Fetching Strategy

- **Server Components** for all initial page data (no loading spinners on first render)
- **Server Actions** for all mutations (create, update, delete)
- **`revalidatePath` / `revalidateTag`** for cache invalidation after mutations
- **Client Components** only for interactive UI (dropdowns, modals, forms, optimistic updates)
- No separate API layer beyond better-auth's `/api/auth` routes — all data access goes through Server Actions and Server Components directly querying Drizzle

### 10.4 Middleware

```typescript
// middleware.ts
// Protects /app/** routes — redirects to /sign-in if no session
// Uses better-auth's Node.js runtime middleware (Next.js 16 supports nodejs runtime in middleware)
// Does NOT protect /, /sign-in, /sign-up, /accept-invitation/**
```

---

## 11. Route Map

| Path | Auth Required | Role Required | Description |
|------|--------------|---------------|-------------|
| `/` | No | — | Marketing landing page |
| `/sign-in` | No | — | Sign in |
| `/sign-up` | No | — | Sign up |
| `/accept-invitation/:id` | Yes (soft) | — | Accept org invitation |
| `/app` | Yes | — | Org switcher (full screen) |
| `/app/:slug` | Yes | Member+ | Redirects to `/app/:slug/home` |
| `/app/:slug/home` | Yes | Member+ | Org home (future) |
| `/app/:slug/members` | Yes | Member+ | Member list; management for Admin/Lead |
| `/app/:slug/settings` | Yes | Admin | Org settings |
| `/app/:slug/billing` | Yes | Admin | Billing + plan |
| `/app/:slug/tasks` | Yes | Member+ | Issues list |
| `/app/:slug/tasks/:issueId` | Yes | Member+ | Issue detail |

---

## 12. Auth Architecture

### 12.1 better-auth server config (`lib/auth/auth.ts`)

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { stripe } from "@better-auth/stripe"
import { db } from "@/lib/db"
import { ac, owner, admin, member } from "./permissions"
import Stripe from "stripe"

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: { enabled: true },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => { /* resend/nodemailer */ },
  },

  plugins: [
    organization({
      ac,
      roles: { owner, admin, member },
      sendInvitationEmail: async (data) => {
        const link = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`
        // send via resend/nodemailer
      },
      organizationHooks: {
        beforeAddMember: async ({ organization }) => {
          // enforce member limit based on org plan
        },
        beforeCreateInvitation: async ({ organization }) => {
          // enforce member limit before even sending the invite
        },
        afterCreateOrganization: async ({ organization }) => {
          // create org_profile row, enable default plugins
        },
      },
    }),
    stripe({
      stripeClient,
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
            annualDiscountPriceId: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID!,
            limits: { members: 30 },
          },
        ],
        onSubscriptionComplete: async ({ subscription, plan }) => {
          // update org_profiles.plan = plan.name
        },
        onSubscriptionCancel: async ({ subscription }) => {
          // downgrade org_profiles.plan = 'free'
        },
      },
      organization: { enabled: true },
    }),
  ],
})
```

### 12.2 better-auth client config (`lib/auth/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/client"
import { organizationClient } from "better-auth/client/plugins"
import { stripeClient } from "@better-auth/stripe/client"
import { ac, owner, admin, member } from "./permissions"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [
    organizationClient({ ac, roles: { owner, admin, member } }),
    stripeClient({ subscription: true }),
  ],
})
```

### 12.3 Permissions mapping (`lib/auth/permissions.ts`)

```typescript
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, adminAc } from "better-auth/plugins/organization/access"

// Extend the default statement with plugin-level resources
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
} as const

export const ac = createAccessControl(statement)

// owner = "Admin" in UI
export const owner = ac.newRole({
  issue: ["create", "update", "update_own", "delete", "comment", "delete_own_comment", "delete_any_comment"],
  ...adminAc.statements,
  organization: ["update", "delete"],
})

// admin = "Lead" in UI
export const admin = ac.newRole({
  issue: ["create", "update", "update_own", "delete", "comment", "delete_own_comment", "delete_any_comment"],
  ...adminAc.statements,
})

// member = "Member" in UI
export const member = ac.newRole({
  issue: ["create", "update_own", "comment", "delete_own_comment"],
})
```

---

## 13. Permission System

### 13.1 Role Display Mapping

| UI Label | better-auth internal role | Notes |
|----------|--------------------------|-------|
| Admin | `owner` | Org creator, full control including billing |
| Lead | `admin` | Officer-level, manages members and content |
| Member | `member` | Contributor, limited write access |

### 13.2 Feature Permission Matrix

| Feature | Admin | Lead | Member |
|---------|-------|------|--------|
| Create org | ✓ | ✓ | ✓ |
| Update org settings | ✓ | ✗ | ✗ |
| Delete org | ✓ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ |
| Invite member (any role) | ✓ | Lead only | ✗ |
| Change member role | ✓ | ✗ | ✗ |
| Remove member | ✓ | ✗ | ✗ |
| View members list | ✓ | ✓ | ✓ |
| Create issue | ✓ | ✓ | ✓ |
| Edit any issue | ✓ | ✓ | ✗ |
| Edit own issue | ✓ | ✓ | ✓ |
| Delete issue | ✓ | ✓ | ✗ |
| Change issue status | ✓ | ✓ | ✓ |
| Assign issue | ✓ | ✓ | ✓ |
| Comment on issue | ✓ | ✓ | ✓ |
| Delete any comment | ✓ | ✓ | ✗ |
| Delete own comment | ✓ | ✓ | ✓ |

### 13.3 Enforcement Layers

Permissions are enforced at two layers:

1. **Server Action layer** — every mutation server action calls `auth.api.hasPermission` before executing. This is the authoritative check. If it fails, the action returns an error regardless of what the UI shows.
2. **UI layer** — `authClient.organization.checkRolePermission` hides or disables UI elements the user cannot access (progressive disclosure). This is UX only, not a security boundary.

---

## 14. API Design

There is no standalone REST or GraphQL API. All data operations use:

1. **better-auth endpoints** (`/api/auth/**`) — for all auth, org, member, invitation, and billing operations
2. **Next.js Server Actions** — for all application data (issues, comments, plugin state)

### 14.1 Server Actions

```
actions/orgs.ts
  - createOrg(data)
  - updateOrg(orgId, data)
  - deleteOrg(orgId)

actions/members.ts
  - inviteMember(orgId, email, role)
  - generateInviteLink(orgId, role)
  - removeMember(orgId, memberId)
  - updateMemberRole(orgId, memberId, role)
  - updateMemberProfile(orgId, displayName, avatarUrl)

actions/tasks.ts
  - createIssue(orgId, data)
  - updateIssue(issueId, data)
  - deleteIssue(issueId)
  - addComment(issueId, body)
  - deleteComment(commentId)
  - updateIssueStatus(issueId, status)
  - assignIssue(issueId, userId)
```

---

## 15. Environment Variables

```bash
# Database
DATABASE_URL=                        # Neon connection string

# Auth
BETTER_AUTH_SECRET=                  # Random 32+ char secret
BETTER_AUTH_URL=                     # = NEXT_PUBLIC_APP_URL

# App
NEXT_PUBLIC_APP_URL=                 # e.g. https://app.clubhq.com

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PLUS_MONTHLY_PRICE_ID=
STRIPE_PLUS_ANNUAL_PRICE_ID=

# Email
RESEND_API_KEY=                      # Transactional email (invitations, verification, reset)
```

---

## 16. Implementation Phases

### Phase 0 — Foundation
- [ ] Install dependencies: `better-auth`, `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `@better-auth/stripe`, `stripe`, `@paralleldrive/cuid2`, `resend`
- [ ] Configure Drizzle + Neon (`lib/db/index.ts`, `drizzle.config.ts`)
- [ ] Run `npx auth generate` to produce better-auth schema
- [ ] Write custom schema tables (`orgs.ts`, `members.ts`, `tasks.ts`)
- [ ] Run initial migration
- [ ] Configure better-auth server (`lib/auth/auth.ts`) with email+password and organisation plugin
- [ ] Configure better-auth client (`lib/auth/auth-client.ts`)
- [ ] Set up permissions (`lib/auth/permissions.ts`)
- [ ] Add auth API route (`app/api/auth/[...all]/route.ts`)
- [ ] Add middleware (`middleware.ts`)

### Phase 1 — Auth & Onboarding
- [ ] Sign up page (`/sign-up`)
- [ ] Sign in page (`/sign-in`)
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Post-sign-up redirect to org creation or org switcher

### Phase 2 — Org Shell
- [ ] App layout with sidebar (`(app)/layout.tsx`)
- [ ] Org context provider (makes active org available to all child components)
- [ ] `[slug]/layout.tsx` — loads org by slug, sets as active, provides org data
- [ ] Org switcher full-screen page (`/app/page.tsx`)
- [ ] Sidebar org switcher dropdown (top-left)
- [ ] Org creation flow (modal or dedicated page)
- [ ] Accept invitation page (`/accept-invitation/[invitationId]`)

### Phase 3 — Member Management
- [ ] Members list page (`/:slug/members`)
- [ ] Invite member flow (email)
- [ ] Invite link generation
- [ ] Pending invitations tab
- [ ] Change member role
- [ ] Remove member
- [ ] Plan limit enforcement on invite

### Phase 4 — Task Management Plugin
- [ ] Plugin registry + `org_plugins` table integration
- [ ] Issues list page (`/:slug/tasks`) — grouped by status
- [ ] Create issue (inline + modal)
- [ ] Issue detail page (`/:slug/tasks/[issueId]`)
- [ ] Status, priority, assignee, due date fields
- [ ] Issue activity log
- [ ] Comments
- [ ] Issue identifier generation (`ACM-1`, `ACM-2`, ...)

### Phase 5 — Settings & Billing
- [ ] Org settings page (`/:slug/settings`)
- [ ] Danger zone: delete org
- [ ] Billing page (`/:slug/billing`)
- [ ] Plan upgrade flow (Stripe Checkout via better-auth)
- [ ] Stripe Customer Portal redirect
- [ ] Webhook handling + plan sync to `org_profiles`

### Phase 6 — Polish & Launch Prep
- [ ] Error boundaries on all routes
- [ ] Loading skeletons
- [ ] Empty states for all list views
- [ ] Mobile responsiveness audit
- [ ] SEO for marketing pages
- [ ] GitHub Actions CI (lint, typecheck, build)
- [ ] Vercel project setup + env vars
- [ ] Deploy to production

---


## Appendix: Key Decisions & Rationale

**Why no tRPC / React Query?**
Server Actions + Server Components handle the data layer cleanly in Next.js 16. Adding tRPC would be over-engineering for this scale. If real-time requirements emerge post-MVP, evaluate at that point.

**Why better-auth's organisation plugin instead of custom?**
It handles the full invitation lifecycle, role/permission system, active-org session management, and Stripe integration with very little custom code. The only custom layer needed is the role name mapping and extended permissions for plugin resources.

**Why store `plan` on `org_profiles` instead of always querying Stripe?**
Stripe API calls add ~200ms latency and would be hit on every plan-gated check (member invites, plugin access). Syncing plan state locally via webhook events gives instant, free reads with eventual consistency that's more than sufficient for this use case.

**Why human-readable slugs in URLs?**
Better UX, shareable and memorable links, consistent with tools like Linear (`linear.app/acm-club/`). Slugs are unique and immutable after org creation to avoid broken bookmarks and shared links.

**Why cuid2 for IDs?**
Collision-resistant, URL-safe, non-guessable, no UUID formatting noise. Works cleanly with Drizzle on Postgres.

**Why no Projects layer in MVP?**
Orgs at the 6–30 member scale don't need a project hierarchy. A flat issues list with filters covers 90% of real use cases for student orgs at this stage. Projects can be added as a separate plugin later without touching the core issues schema.

**Why is better-auth's `owner` role mapped to "Admin" in the UI?**
"Admin" is the vocabulary student orgs use. "Owner" implies a single person and has product/legal connotations. The mapping is purely cosmetic — the underlying permissions are identical to `owner`.
