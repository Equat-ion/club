# Club — Technical Architecture & DB Schema

## Tech Stack & Architecture

### Stack

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

### Project Structure

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

### Data Fetching Strategy

- **Server Components** for all initial page data (no loading spinners on first render)
- **Server Actions** for all mutations (create, update, delete)
- **`revalidatePath` / `revalidateTag`** for cache invalidation after mutations
- **Client Components** only for interactive UI (dropdowns, modals, forms, optimistic updates)
- No separate API layer beyond better-auth's `/api/auth` routes — all data access goes through Server Actions and Server Components directly querying Drizzle

### API Design

There is no standalone REST or GraphQL API. All data operations use:

1. **better-auth endpoints** (`/api/auth/**`) — for all auth, org, member, invitation, and billing operations
2. **Next.js Server Actions** — for all application data (issues, comments, plugin state)

---

## Auth Architecture & Permissions

### Permission System

#### Role Display Mapping

| UI Label | better-auth internal role | Notes |
|----------|--------------------------|-------|
| Admin | `owner` | Org creator, full control including billing |
| Lead | `admin` | Officer-level, manages members and content |
| Member | `member` | Contributor, limited write access |

#### Feature Permission Matrix

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

#### Enforcement Layers

Permissions are enforced at two layers:

1. **Server Action layer** — every mutation server action calls `auth.api.hasPermission` before executing. This is the authoritative check. If it fails, the action returns an error regardless of what the UI shows.
2. **UI layer** — `authClient.organization.checkRolePermission` hides or disables UI elements the user cannot access (progressive disclosure). This is UX only, not a security boundary.

---

## Database Schema

Using DrizzleORM with Neon (PostgreSQL). All IDs are `cuid2` strings unless noted.

### better-auth managed tables

better-auth's organisation plugin auto-generates and manages these tables via `npx auth generate`. They should not be hand-edited:

- `user` — global user accounts
- `session` — user sessions (includes `activeOrganizationId`)
- `account` — OAuth / credential accounts linked to a user
- `verification` — email verification + password reset tokens
- `organization` — org records (id, name, slug, logo, metadata, createdAt)
- `member` — org membership (id, userId, organizationId, role, createdAt)
- `invitation` — pending invitations (id, email, organizationId, role, status, expiresAt, inviterId)

### Custom tables (application-managed)

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

### Indexes

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
