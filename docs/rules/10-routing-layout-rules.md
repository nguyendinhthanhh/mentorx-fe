# 10 Routing Layout Rules

## Purpose
Define route, redirect, and layout boundaries for Mentor X frontend.

## Core Rules
- `MainLayout`, `ProfileLayout`, `MentorLayout`, and `AdminLayout` must have clear responsibilities.
- No duplicate stale routes.
- No dead-end production routes for core workspace tasks.
- Legacy routes should redirect safely when removed.

## Layout Boundaries
- `MainLayout`
  - public marketplace and shared public pages
- `ProfileLayout`
  - user workspace
- `MentorLayout`
  - MentorHub workspace
- `AdminLayout`
  - admin and moderation operations

## Route Naming Rules
- Public marketplace routes should stay clean and resource-based.
- User workspace routes should group around profile or owned resources.
- MentorHub routes should stay under `/mentor/...`.
- Admin routes should stay under `/admin/...`.

## Duplicate Route Rules
- Do not keep parallel stale route sets unless there is a deliberate migration plan.
- Avoid backup pages, old Vite starter entrypoints, and duplicate page variants staying in active code paths.

## Sidebar Persistence Rule
- Navigating inside MentorHub must not drop the MentorHub sidebar and workspace shell.
- User workspace routes must preserve the user workspace frame consistently.

## Redirect Rules
- If old routes are removed, add safe redirects where they improve continuity.
- Redirects must not mask broken access control or missing content forever.

## Production Placeholder Rules
- Avoid routing to `Coming Soon` placeholders for important core flows.
- Prefer hiding incomplete navigation items or redirecting to a valid destination.

## Do
- Keep route structure predictable.
- Keep workspace boundaries obvious in navigation.
- Review route duplication during cleanup.

## Do Not
- Expose demo routes as standard runtime routes.
- Keep stale route aliases without purpose.
- Lose workspace shell context during normal internal navigation.

## MVP Scope
- Clean public and workspace routing with stable layouts.

## Future Scope / TODO
- Consolidate route helpers and redirect policies once stale paths are removed.
