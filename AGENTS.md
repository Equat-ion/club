# Club — Product Specification

> Modular Student Org Management Platform
> Version: 0.1.1 (MVP-2)
> Last Updated: 2026-03-05
> Status: Pre-development

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Users](#2-target-users)
12. [Agent Rules](#12-agent-rules)
13. [Implementation Phases](#13-implementation-phases)

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

## 3. Core Concepts & Features

The detailed product vision, core concepts, feature specifications, and billing details have been moved to [spec/product.md](./spec/product.md).

---

## 4. Architecture & Database

The complete technical stack, project structure, routing, database schema, and detailed authentication/permission systems have been moved to [spec/architecture.md](./spec/architecture.md).

---

## 5. Plugin System & Task Management

The plugin architecture, plugin dependency handling, and the Task Management MVP features are detailed in [spec/plugins.md](./spec/plugins.md).

---

## 6. Information Architecture & Route Map

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

## 11. Environment Variables

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
- [x] Plugin registry + `org_plugins` table integration
- [x] Tasks list page (`/:slug/tasks`) — Grouped & List views
- [x] Create task (dialog)
- [x] Task detail page (`/:slug/tasks/[issueId]`) — Full single-column redesign
- [x] Status, priority, assignee, due date, team, and labels fields
- [x] Inline editing for title, description, and metadata
- [x] Task activity log (plain language)
- [x] Comments / Discussion
- [x] Task identifier generation (`ACM-1`, `ACM-2`, ...)
- [x] Labels management (org-scoped, inline creation)
- [x] Teams integration (optional dependency)
- [x] Dashboard widget (My Tasks)
- [x] Granular event hooks

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

## 12. Agent Rules

Note: I have moved the agent rules to `GEMINI.md`.

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

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.


<claude-mem-context>
# Memory Context

# [club] recent context, 2026-05-25 4:00pm GMT+5:30

No previous sessions found.
</claude-mem-context>