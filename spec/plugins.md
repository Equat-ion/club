# Plugin System

## Architecture

Plugins are first-party modules. They are not installed/uninstalled in the traditional sense for MVP — they are plan-gated. The free plan has only the Task Management plugin available. The Plus plan unlocks all current and future plugins.

**Plugin registry** (`lib/plugins/registry.ts`):
```typescript
export type Plugin = {
  id: string                   // e.g. "tasks"
  name: string                 // e.g. "Task Management"
  description: string
  slug: string                 // URL segment e.g. "tasks"
  icon: string                 // string resolved to LucideReact component dynamically
  plans: ('free' | 'plus' | 'enterprise')[]
  defaultEnabled: boolean
  category: 'productivity' | 'communication' | 'management' | 'other'
  version: string
  dependencies?: string[]      // Hard dependencies (must be enabled before this plugin)
  optionalDependencies?: string[] // Peer dependencies (informational)
}

export const PLUGINS: Plugin[] = [
  {
    id: 'tasks',
    name: 'Task Management',
    description: 'Linear-inspired issue tracker for your org',
    slug: 'tasks',
    icon: 'CheckSquare',
    plans: ['free', 'plus', 'enterprise'],
    defaultEnabled: true,
    category: 'productivity',
    version: '1.0.0',
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

### Dependencies and Enablement

Plugins can define `dependencies` (hard) and `optionalDependencies` (soft).
- **Cycle Prevention**: The registry strictly prevents circular dependencies and validates at module load time.
- **Cascading Enablement**: When an Admin enables a plugin, the UI prompts to auto-enable any missing hard dependencies in topological order.
- **Referential Integrity**: A plugin cannot be disabled if any currently-enabled plugin depends on it.

### Hooks System (`lib/hooks/registry.ts`)

A typed, in-memory event bus allows cross-plugin communication without tight coupling.
- Hooks are "after" hooks (triggered after an action succeeds).
- Handlers are observe-only and do not block the primary action or propagate errors.
- Events map globally (e.g. `task:created`, `plugin:enabled`, `plugin:disabled`). All plugin handlers are registered at server startup.

---

## Task Management Plugin (MVP)

Linear-inspired issue tracker scoped per org. No project grouping in MVP.

### Data Model

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

### Issue Identifier

Each org has an `issueCounter` (integer, stored on `org_profiles`). On every new issue creation, the counter is incremented atomically and the identifier is formatted as `{ORG_SLUG_UPPER}-{counter}` (e.g. `ACM-1`, `ACM-2`).

### Views

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

### Permissions within Tasks

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

### Real-time (Post-MVP)

Issue updates are not real-time in MVP. The page uses optimistic updates via server actions + `revalidatePath`. Real-time via Supabase Realtime or Ably is a post-MVP concern.
