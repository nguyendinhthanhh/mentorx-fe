# 03 Frontend Code Structure

## Purpose
Keep the Mentor X frontend maintainable, typed, and resistant to large AI-generated components with mixed responsibilities.

## Core Rules
- Use React + TypeScript consistently.
- Keep pages, components, hooks, and API services separated by responsibility.
- Do not place large business workflows directly inside one giant page component when they can be split safely.
- No fake production data inside pages or components.

## Structure Rules
- `pages`
  - route-level composition and page state
- `components`
  - reusable or scoped UI blocks
- `api`
  - typed API service layer only
- `store`
  - app-wide state such as auth and mode
- `types`
  - shared request and response contracts
- `utils`
  - formatting, routing helpers, status mapping, and pure helpers

## Component Rules
- Pages should orchestrate, not do everything.
- Reusable UI logic belongs in components or hooks.
- Avoid pages that combine routing, data fetching, formatting, workflow logic, modal logic, and status mapping in one monolith unless the scope is genuinely small.

## Type Rules
- Use typed request and response models.
- Prefer central shared types over ad hoc inline object shapes for API payloads.
- Do not treat backend entities and frontend display models as the same thing automatically.

## Loading Error Empty State Rules
- Every data-driven page needs a loading state.
- Every data-driven page needs an error state.
- Every empty state must be intentional and honest.
- Empty states must not be filled with fake data.

## No Fake Production Data Rule
- No hardcoded fake balances, fake message previews, fake charts, fake mentor cards, or fake notifications in production-facing pages.

## Do
- Keep components focused.
- Use hooks or helpers for repeated page logic.
- Keep business rules readable and close to the relevant page or API layer.

## Do Not
- Put random `fetch` or `axios` calls directly in UI blocks.
- Create giant components with tangled workflow logic if smaller structured parts are practical.
- Ship placeholder runtime data in real pages.

## MVP Scope
- Typed, modular frontend code that supports real marketplace and workspace flows.

## Future Scope / TODO
- Introduce more shared hooks only when patterns are stable enough to deserve reuse.
