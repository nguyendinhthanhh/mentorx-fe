# AGENTS.md

## 1. Project Identity
Mentor X frontend is a React + TypeScript single-page application for a mentor marketplace platform.

Stack:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- Single Page Application

Main frontend areas:
- Public marketplace
- User workspace
- MentorHub
- AdminHub

This repository is not a generic SaaS dashboard, not a template gallery, and not a decorative mockup shell. It is the frontend for a real marketplace and workspace product.

## 2. Mandatory Reading Before Any Change
Before changing code:

1. Read this `AGENTS.md`.
2. Read `../mentorx-be/docs/project-audit/AI_CONTEXT.md` when working in the
   shared Mentor X workspace.
3. Select the task domain from its reading matrix.
4. Read only the listed frontend rules and named audit sections.
5. Inspect the active route, page, components, API adapter, types, and backend
   contract involved.

Always read `/docs/rules/12-ai-working-rules.md`. Read
`/docs/rules/README.md` only when rule filename mapping is needed. If the
backend audit is unavailable in a standalone frontend checkout, select the
feature-specific rules directly from that README.

Context must expand when the task changes business state, authorization, money,
shared DTOs, routing boundaries, or production data truth. Do not bulk-read all
rules and audit files for a narrow task.

For performance or responsive work, read `docs/PERFORMANCE_AUDIT.md` and
`docs/RESPONSIVE_AUDIT.md` before repeating a broad audit.

No coding should begin before the selected reading step is complete.

## 3. Frontend Architecture Rules
- Keep React + TypeScript structure consistent.
- Follow the current separation of:
  - `pages`
  - `components`
  - `api`
  - `store`
  - `types`
  - `utils`
- Route-level orchestration belongs in pages.
- Reusable UI belongs in components.
- Network logic belongs in `src/api`, not random component code.
- Shared request and response contracts belong in typed models.
- Do not create giant page components with mixed routing, API, modal, workflow, and formatting logic unless the scope is genuinely small.
- Use loading, error, and empty states intentionally.

## 4. UI/UX Rules to Avoid AI-Generated Look
- UI should feel:
  - real
  - practical
  - professional
  - clean
  - product-specific
  - marketplace/workspace focused
  - dense enough for real users
  - clear in hierarchy
  - clear in business actions

- UI must not feel:
  - like a generic AI SaaS dashboard
  - like a Dribbble mockup
  - like a crypto dashboard
  - like a fake admin panel
  - like a random Tailwind component gallery
  - like a landing page template inside workspace pages

Forbidden UI patterns:
- excessive purple or blue gradients
- glowing cards
- fake charts
- fake AI recommendation cards
- fake metrics
- overly large stat cards with no real use
- placeholder content pretending to be real
- random icons or emojis everywhere
- multiple competing CTAs
- vague buttons like `Continue` or `Submit` when a business-specific action exists
- duplicate marketplace pages inside MentorHub
- admin pages that look like marketing dashboards

Preferred UI patterns:
- clear list/detail layout for operational pages
- compact but readable cards
- real status badges
- real empty states
- real action buttons
- tables or lists when scanning many records
- inbox-first messages
- financial clarity similar to Stripe-style dashboards
- professional profile and listing clarity similar to LinkedIn
- marketplace proposal clarity similar to Upwork or Fiverr
- workspace density similar to Linear or Notion

## 5. Business Rules Summary
- Mentor X is a mentor marketplace.
- Every account starts as `USER`.
- Mentor is `USER + MENTOR` after approval, not a separate account.
- Public marketplace is for browsing mentors, jobs, and courses.
- User workspace is for managing posted jobs, proposals received, wallet, purchased courses, reviews, and settings.
- MentorHub is a workspace, not a duplicate marketplace.
- MentorHub should focus on:
  - Overview
  - My Proposals
  - Active Contracts
  - My Courses
  - Schedule
  - Earnings
  - Reviews
  - Messages
  - Settings
- AdminHub is an operational moderation and management system, not a decorative dashboard.

Negotiation MVP:
- `Price`
- `Deadline date/time`
- `Message / Work details`

Do not use in the main/default negotiation UI:
- Delivery days
- Estimated delivery
- Sessions
- Separate Scope
- Separate Deliverables

Lifecycle rules:
- Accept offer terms does not create contract.
- Accept offer terms does not lock escrow.
- Contract is created only when client accepts mentor.
- Escrow is locked only when contract is created.

## 6. i18n and Copy Rules
- UI must support English and Vietnamese with translation keys.
- Frontend maps backend enum, status, and error codes to translated labels.
- Do not hardcode mixed English and Vietnamese UI text.
- Do not ignore i18n on new work.
- Do not embed new user-facing copy directly into JSX when it should live in translation files.
- Fallback behavior should remain predictable and biased to English when a key is missing.
- Avoid AI-sounding filler copy.
- Prefer short, business-specific copy such as:
  - `No proposals yet`
  - `Waiting for client response`
  - `Escrow locked`
  - `Offer terms agreed`
  - `Deadline overdue`

## 7. API Integration Rules
- Do not call `fetch` or `axios` directly in random components.
- Use the API service layer in `src/api`.
- Keep request and response types explicit.
- Use React Query consistently for server state.
- Keep auth token handling centralized.
- Do not invent client-side business semantics that override backend truth.
- Map backend status and error codes into frontend display labels instead of exposing raw backend wording when a UI label exists.

## 8. Routing and Layout Rules
- Respect the layout boundaries:
  - `MainLayout` for public marketplace and public pages
  - `ProfileLayout` for user workspace
  - `MentorLayout` for MentorHub
  - `AdminLayout` for AdminHub
- Do not create duplicate routes or stale route variants without checking what already exists.
- Do not expose public demo routes in production navigation.
- Preserve MentorHub sidebar context inside mentor routes.
- Preserve workspace shell context inside user workspace routes.
- Do not turn MentorHub into a second marketplace unless a route is explicitly for real recommended jobs backed by real logic.

## 9. No Fake Data Rule
- No fake, demo, or mock data in production-facing UI.
- No fake charts.
- No fake AI cards.
- No fake balances.
- No fake message previews pretending to be real.
- No placeholder content that looks like real user or business data.
- Use honest empty, unavailable, or not-ready states instead.

## 10. AI Working Process
Before coding:
1. Read `AGENTS.md`.
2. Read relevant `/docs/rules` files.
3. Inspect related source files.
4. Summarize the current implementation.
5. Summarize the UI, business, and code rules that apply.
6. Explain what currently looks wrong or AI-generated if this is a UI task.
7. Propose the smallest safe change.
8. Only then modify code.

After coding:
1. Run frontend build:
   `npm run build`
2. Report changed files.
3. Report UI and business impact.
4. Report remaining risks or TODOs honestly.

Default working posture:
- minimal safe changes
- no unrelated redesign
- no silent business-flow changes
- no filler UI added to make pages look "more complete"

## 11. Build / Test Requirements
Required frontend build after code changes:

```powershell
npm run build
```

If the task touches TypeScript quality, components, hooks, or broader code structure, also consider:

```powershell
npm run lint
```

Minimum reporting after changes:
- build result
- what was manually verified
- what was not verified
- why any skipped verification remains

## 12. Forbidden Behaviors
- Do not rewrite the whole project.
- Do not redesign unrelated pages.
- Do not change business logic silently.
- Do not add fake data.
- Do not add fake charts.
- Do not add fake AI cards.
- Do not add unsupported buttons or actions.
- Do not hardcode mixed English and Vietnamese text.
- Do not ignore i18n.
- Do not create duplicate routes or pages without checking existing ones.
- Do not hide errors just to make build pass.
- Do not make the UI more decorative at the cost of usability.
- Do not turn MentorHub into a marketplace duplicate by accident.
- Do not use vague action labels when a business-specific label exists.

## 13. Task Handoff Checklist

Every frontend handoff must state:

- Selected task domain and rules read from `AI_CONTEXT.md`.
- Current UI/API behavior and intended behavior.
- Changed files and the smallest safe change made.
- UI, i18n, API-contract, business-state, and security impact.
- Build, lint, test, and manual verification results where applicable.
- Remaining risks, skipped checks, or follow-up finding IDs.
