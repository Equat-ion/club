# Product Vision

Club is a multi-tenant SaaS platform for student-led organisations. It gives clubs, dev communities, Model UNs, and student event teams a shared home to organise their work — a modular space where each org gets its own isolated workspace, populated with only the tools they choose.

The product is inspired by the simplicity of Hack Club but built with B2B SaaS architecture: one platform, many tenants, each fully self-contained.

**Design philosophy:**
- Every org is its own walled garden — no cross-org data bleed
- Plugins are first-party only; modularity is an internal architectural principle, not a marketplace
- The platform grows with the org: start free, upgrade as you scale
- Built for self-hostability from day one, even though it launches as closed SaaS

---

## Target Users

| Role | Description |
|------|-------------|
| **Admin** | Org creator / owner. Full control. Manages billing, members, settings, and all plugins. Maps to `owner` in better-auth's organisation plugin. |
| **Lead** | Officer-level. Can manage members, create/assign tasks, manage plugin content. Cannot access billing or org settings. Maps to `admin` in better-auth. |
| **Member** | Standard contributor. Can view and interact with plugin content based on plugin-level permissions. Read-mostly. Maps to `member` in better-auth. |

> **Important:** The role names exposed in the UI are `Admin`, `Lead`, and `Member`. Internally they map to better-auth's `owner`, `admin`, and `member`. This mapping is encapsulated in `lib/auth/permissions.ts` so the UI never references internal role names directly.

**User identity:** One global account per person. A user can be a member of many orgs with different roles in each. Each membership can have a distinct `displayName` stored on the membership record (separate from the global `user.name`).

---

## Core Concepts

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

## Information Architecture

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

## Feature Specification — MVP

### Authentication

- Email + password sign up / sign in (better-auth `emailAndPassword`)
- Email verification on sign up
- Password reset via email
- Session management via better-auth (cookie-based, httpOnly)
- Middleware protects all `/app` routes; unauthenticated users redirected to `/sign-in`

### Org Creation

- Any authenticated user can create an org
- Org creation collects: `name`, `slug` (auto-generated from name, user-editable)
- Slug must be URL-safe, lowercase, unique across the platform
- Creator is automatically assigned `owner` role and added as first member
- On creation: a Stripe Customer is created for the org (via better-auth stripe plugin) and the org is placed on the `free` plan
- Newly created org becomes the user's active org

### Org Switcher

- Full-screen page at `/app` (not a modal, not a sidebar dropdown — a dedicated route)
- Lists all orgs the user is a member of
- Each org card shows: logo/avatar, name, slug, user's role in that org, plan badge
- "Create new org" button on this screen
- Clicking an org sets it as active (`authClient.organization.setActive`) and navigates to `/:slug/home`
- The sidebar has an org switcher in the top-left as a dropdown (secondary, quick-switch), linking back to this full screen if the user wants the full view

### Member Management

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

### Org Settings

Route: `/:slug/settings`
Access: Admin only

- Update org name, slug, logo
- Manage plugins via a table-based UI (view installed plugins, toggle enablement status, manage implicit dependencies)
- Danger zone: Delete org (requires typing org name to confirm)
- Deletion blocked if org has an active Stripe subscription

### Org Switching (Sidebar)

- Top-left of sidebar: org avatar + name + chevron
- Dropdown shows all user's orgs (up to 5, then "View all" → `/app`)
- "Create organisation" at the bottom of the dropdown
- Clicking an org triggers `setActive` and navigates to `/:slug/home`

---

## Billing & Plans

### Plans

| Feature | Free | Plus | Enterprise |
|---------|------|------|------------|
| Members | Up to 6 | Up to 30 | Unlimited |
| Task Management | ✓ | ✓ | ✓ |
| Future plugins | ✗ | ✓ | ✓ |
| Priority support | ✗ | ✗ | ✓ |
| Custom branding | ✗ | ✗ | ✓ |
| Price | $0 | TBD/month or TBD/year | Contact sales |

> Pricing amounts are TBD. The Plus plan should offer an annual discount (e.g. 2 months free).

### Billing Architecture

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

### Plan Enforcement Flow

```
User attempts to invite member
  → Server action checks org.plan
  → Queries current member count
  → If count >= limit for plan → return error: "Upgrade to Plus to add more members"
  → If within limit → proceed with invitation
```
