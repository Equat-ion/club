# Settings Page Redesign (Impeccable)

Date: 2026-04-17
Status: Approved for planning
Owner: Settings UX refactor

## 1) Intent

Redesign `/app/[slug]/settings` to feel **calm**, **trustworthy**, and **no-nonsense** while staying coherent with the existing Solar Dusk theme tokens. The current page feels cluttered, over-boxed, and hard to scan, especially in the SSO area.

The redesign focuses on visual hierarchy, layout rhythm, and light behavior improvements without changing core business logic.

## 2) Goals and Non-Goals

### Goals
- Reduce visual clutter by replacing repeated generic card patterns with clear section structure.
- Introduce a desktop pinned section index with active-section tracking and smooth scroll.
- Keep mobile index hidden at top.
- Improve SSO readability by prioritizing key information and reducing awkward table density.
- Maintain strict coherence with existing theme variables and component language.
- Add light behavior refinements (save affordances, clearer feedback, safer destructive emphasis).

### Non-Goals
- No auth, permission, or backend API changes.
- No redefinition of global theme palette, typography system, or design tokens.
- No new plugin capabilities beyond better presentation/usability.

## 3) Information Architecture

The settings page is organized into four anchored sections in this order:

1. Organization Name
2. Logo
3. Enterprise SSO
4. Danger Zone

Each section has a stable anchor id used by the index rail for navigation and scroll-spy state.

## 4) Layout Strategy

### Desktop
- Use a constrained shell (`max-w-5xl`) with slight left bias rather than fully centered composition.
- Two-column structure:
  - Main content column for sections and forms.
  - Right column for sticky index rail.
- The index rail remains visually quiet and only highlights the active section.

### Mobile
- Collapse to a single content column.
- Hide the top index control as requested.
- Preserve section spacing and touch-friendly controls.

## 5) Visual Language

- Keep Solar Dusk token usage (`--background`, `--card`, `--border`, `--muted`, `--primary`, etc.) as-is.
- Favor subtle separators and section spacing over stacked card chrome.
- Keep headings concise and utility-focused.
- Use restrained emphasis for risk states (Danger Zone), avoiding noisy or decorative treatments.

## 6) Interaction and Behavior Changes

### Section index behavior
- Click index item -> smooth scroll to section anchor.
- Scroll updates active index item (intersection-based).
- Preserve keyboard and focus accessibility for index links.

### Save affordances
- Save actions stay disabled when no field changes exist.
- Saving state remains explicit via button label change.
- Success/error toast patterns remain unchanged for consistency.

### Danger Zone
- Keep typed-confirmation flow and irreversible semantics.
- Improve information hierarchy so consequences are immediately understandable.

## 7) SSO Redesign

### Current pain
- Dense table with low-priority technical fields competing with primary information.
- Horizontal pressure from long URLs and metadata values.

### Updated structure
- Keep compact status summary at top.
- Keep provider registration form, but tighten spacing and grouping.
- Rework provider listing into a responsive, scan-first presentation:
  - Primary fields emphasized: Provider, Domain, Status.
  - Technical values (SP Entity ID, ACS URL) de-emphasized and wrapped.
  - Narrow viewports use stacked detail rows to avoid awkward overflow.
- Keep provider deletion action explicit and aligned with current destructive patterns.

## 8) Accessibility and Responsiveness

- Ensure index items are keyboard reachable and visibly focusable.
- Ensure section anchors are reachable and scrolling does not hide headings under sticky UI.
- Preserve readable contrast with existing semantic tokens.
- Avoid hiding critical settings actions on mobile; only hide desktop index affordance.

## 9) Implementation Scope (File-Level)

- `app/app/[slug]/settings/page.tsx`
  - Replace simple container with max-width layout shell and sidebar-aware structure.

- `components/settings/settings-content.tsx`
  - Introduce section anchors and desktop index rail.
  - Recompose organization, logo, SSO, and danger sections with cleaner rhythm.

- `components/settings/sso-settings-panel.tsx`
  - Align panel layout to new section system and spacing.

- `components/settings/sso-status-card.tsx`
  - Simplify summary visual structure for quick scanning.

- `components/settings/sso-provider-list.tsx`
  - Replace awkward wide table behavior with responsive scan-first structure.

- `components/settings/sso-provider-form.tsx`
  - Improve grouping and information hierarchy for setup fields.

- `components/settings/delete-org-dialog.tsx`
  - Keep behavior; refine messaging hierarchy and visual confidence.

## 10) Verification Plan

- Manual UX verification at desktop and mobile widths:
  - Section index visibility and active tracking behavior.
  - Smooth anchor scrolling and focusability.
  - Save-button enable/disable logic unchanged functionally.
  - SSO list readability and wrapping behavior with long metadata.
  - Danger Zone clarity and delete confirmation flow.

- Run standard project checks after implementation:
  - lint
  - typecheck
  - build

## 11) Risks and Mitigations

- Risk: scroll-spy can be jittery around section boundaries.
  - Mitigation: use threshold/margin tuning and deterministic active-section fallback.

- Risk: SSO technical fields become harder to discover.
  - Mitigation: preserve them in secondary rows with clear labels and wrapping.

- Risk: layout shift across breakpoints.
  - Mitigation: test representative widths and keep fixed section order.
