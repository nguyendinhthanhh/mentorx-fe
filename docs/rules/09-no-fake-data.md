# 09 No Fake Data

## Purpose
Prevent fake, demo, mock, or placeholder data from appearing in production-facing Mentor X UI.

## Core Rules
- No fake balances.
- No fake charts.
- No fake AI suggestions.
- No fake chat rooms.
- No public demo routes in production navigation.

## Production UI Rules
- If real backend data is unavailable, show an honest empty state, unavailable state, or feature-not-ready state.
- Do not fill runtime UI with invented numbers, demo users, or dummy activity.

## Placeholder Rules
- "Coming Soon" is acceptable only as a temporary internal placeholder during development.
- It must not remain as a long-term routed production surface for core workspace flows.
- Prefer redirecting to a valid parent flow over exposing dead-end pages.

## Dev-Only Mock Rules
- Local-only mocks are allowed for development and isolated testing.
- They must not be linked from production navigation.
- They must not ship as normal user journeys.

## Demo Route Rules
- Demo pages like chat demos must not remain public runtime routes in the real product experience.
- If kept for internal development, they must be isolated and clearly non-production.

## Do
- Use real empty states.
- Remove or quarantine demo surfaces.
- Tell the truth in runtime UI.

## Do Not
- Show placeholder metrics as if they are real.
- Expose mock chat, wallet, or activity data to real users.
- Leave public demo routes in normal navigation.

## MVP Scope
- Production-facing UI only shows real product state.

## Future Scope / TODO
- Add a frontend QA checklist item that explicitly checks for fake data leakage before releases.
