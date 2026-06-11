# 01 Account Role Model

## Purpose
Define how the frontend presents account identity, roles, and mode switching in Mentor X.

## Core Rules
- Every account starts as `USER`.
- Mentor is an additive approved role and mode, not a separate account.
- Admin and moderator are RBAC roles.
- Frontend route guards improve UX, but backend remains the source of permission truth.

## USER-First Lifecycle
1. User registers.
2. User activates account.
3. User uses marketplace and user workspace as `USER`.
4. User may apply for mentor approval.
5. After approval, the same account gains `MENTOR` access and mentor mode.

## Frontend Role Boundaries
- `USER`
  - public browsing
  - user workspace
  - post jobs
  - receive and compare proposals
  - accept mentor
- `MENTOR`
  - MentorHub access
  - proposal, contract, course, earnings, and message workflows
- `MODERATOR`
  - moderation workspace access
  - no financial control UI for balance edits or withdrawal approval
- `ADMIN`
  - finance, settings, roles, and system-level control UI

## Mode Rules
- Mode switching is presentation and navigation behavior, not a separate identity.
- Frontend must not imply the user owns two separate accounts.
- Mentor mode should only appear when mentor approval conditions are satisfied.

## UI Rules
- Keep account identity consistent across user and mentor contexts.
- Reuse the same avatar, profile, and base identity model.
- Use role or mode language carefully:
  - `Switch to Mentor Mode`
  - not `Create Mentor Account`

## Do
- Reflect the additive role model in routing and menus.
- Hide mentor-only workspace actions until they are valid.
- Keep admin and moderator financial boundaries visible in UI behavior.

## Do Not
- Present mentor as a separate account signup path.
- Show finance controls to moderators.
- Let frontend wording contradict the USER-first lifecycle.

## MVP Scope
- One account, multiple approved modes and roles.

## Future Scope / TODO
- If moderator and admin workspaces diverge more, document their visual and routing separation explicitly.
