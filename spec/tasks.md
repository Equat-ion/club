# Task Management Plugin — Feature Report

The Task Management plugin is a Linear-inspired, high-performance issue tracker designed for student organizations. It provides a centralized space for members to track work, assign responsibilities, and maintain a historical record of organizational activity.

## 1. Functional Overview

The plugin is scoped at the Organization level. Every organization (tenant) has its own isolated instance of the Task Management system.

### 1.1 Core Entities

*   **Issues:** The primary unit of work. Each issue has a title, description, status, priority, assignee, and due date.
*   **Comments:** Threaded discussions attached to issues, allowing for collaboration and context sharing.
*   **Activity Log:** An automatically generated audit trail that tracks every change made to an issue (status changes, assignments, etc.).

### 1.2 Issue Identifiers
To maintain a professional and organized workflow, the plugin implements a sequential, human-readable identifier system.
*   **Format:** `{ORG_SLUG_UPPER}-{COUNTER}` (e.g., `ACM-42`, `DEV-10`).
*   **Mechanism:** Each organization maintains an atomic `issueCounter` in its profile. On creation, this counter is incremented, ensuring identifiers are unique within the organization and never skip a beat.
*   **Slug Normalization:** Organization slugs are capitalized and hyphens are removed to create the prefix (e.g., `the-club` becomes `THECLUB`).

### 1.3 State Management
Issues move through a standard lifecycle defined by:
*   **Status:** `Backlog` → `Todo` → `In Progress` → `Done` | `Cancelled`.
*   **Priority:** `Urgent`, `High`, `Medium`, `Low`, `No Priority`.

---

## 2. UI/UX Details

The user interface is built using `shadcn/ui` components with a focus on speed and density, mimicking modern productivity tools like Linear.

### 2.1 Issues Board (Inbox View)
The primary view for the plugin (`/:slug/tasks`) is a grouped list view.
*   **Status Grouping:** Issues are grouped into collapsible sections by status. Sections for `Done` and `Cancelled` are hidden if empty to reduce clutter.
*   **Priority Sorting:** Within each status group, issues are sorted by priority (Urgent first).
*   **Density:** Each row displays the priority icon, identifier, title, due date, and the assignee's avatar.
*   **Visual Cues:** Uses consistent Lucide icons and colors for status and priority levels.

### 2.2 Issue Detail View
The detail view (`/:slug/tasks/[issueId]`) provides a comprehensive workspace for a single task.
*   **Inline Editing:** Both Title and Description are editable inline. Clicking the text transforms it into an input/textarea. Changes are saved on blur or Enter.
*   **Two-Column Layout:** 
    *   **Left Column:** Title, description, comments thread, and the activity log.
    *   **Right Sidebar:** Metadata selectors (Status, Priority, Assignee, Due Date) and meta-information (Creator, Created Date).
*   **Activity Feed:** A chronological list of system events mixed with user comments, providing a full "story" of the task.

### 2.3 Creation Flow
Issues are created via a modal dialog (`create-issue-dialog.tsx`) accessible from any task view.
*   **Required Fields:** Only the Title is strictly required.
*   **Smart Defaults:** Defaults to `Backlog` status and `No Priority`.
*   **Atomic Interaction:** Upon creation, the user is optionally redirected to the new issue, or can continue creating more.

---

## 3. Technical Architecture

### 3.1 Data Model (Drizzle ORM)
The schema is defined in `lib/db/schema/tasks.ts`.
*   **`issues` table:** Stores the core task data. Indexes are placed on `orgId` and `status` for fast retrieval in multi-tenant environments.
*   **`issue_comments` table:** Linked to issues and users.
*   **`issue_activity` table:** Stores `fromValue` and `toValue` for changes, enabling the "Changed status from Todo to In Progress" style logs.

### 3.2 Server Actions
All mutations and queries are handled via Next.js Server Actions in `actions/tasks.ts`.
*   **Atomic Counter:** Uses Drizzle's `sql` template literal for atomic increments: `sql`${orgProfiles.issueCounter} + 1``.
*   **Permissions:** Every action validates the user's membership in the organization and their role before proceeding.
*   **Revalidation:** Uses `revalidatePath("/app")` to ensure the UI stays in sync after updates.

### 3.3 The Hooks System
The Task Management plugin is integrated into the global `HooksRegistry` (`lib/hooks/registry.ts`).
*   **Events Emitted:** `task:created`, `task:updated`, `task:deleted`.
*   **Purpose:** This allows other (future) plugins to react to task changes without coupling. For example, a "Notifications" plugin could subscribe to `task:created` to alert the assignee.

---

## 4. Permissions Matrix

The plugin respects the core "Admin", "Lead", and "Member" roles.

| Action | Admin (`owner`) | Lead (`admin`) | Member (`member`) |
| :--- | :---: | :---: | :---: |
| Create Issue | ✓ | ✓ | ✓ |
| Edit Own Issue | ✓ | ✓ | ✓ |
| Edit Any Issue | ✓ | ✓ | ✗ |
| Delete Issue | ✓ | ✓ | ✗ |
| Post Comment | ✓ | ✓ | ✓ |
| Delete Own Comment | ✓ | ✓ | ✓ |
| Delete Any Comment | ✓ | ✓ | ✗ |
| Update Status/Priority | ✓ | ✓ | ✓ |
| Assign Tasks | ✓ | ✓ | ✓ |

---

## 5. Integration with Core

*   **Multi-tenancy:** All data is strictly separated by `orgId`.
*   **Auth:** Uses `better-auth` for session management and permission checks (`auth.api.getSession`).
*   **Plugin System:** Task Management is the "Default" plugin enabled for all organizations on the **Free** plan. It serves as the baseline for the platform's utility.
*   **Members:** The assignee picker fetches real-time data from the organization's member list using the `getOrgMembers` action.

## 6. Future Roadmap

*   **Projects/Labels:** Grouping issues into Projects or tagging them with custom Labels.
*   **Rich Text / Markdown:** Enhancing the description and comments with a full markdown editor (e.g., TipTap).
*   **Real-time Updates:** Integrating Supabase Realtime or Ably to see status changes without page refreshes.
*   **Global Search:** Searching issues across all organizations from the command palette.
*   **Custom Statuses:** Allowing organizations to define their own workflow stages.
