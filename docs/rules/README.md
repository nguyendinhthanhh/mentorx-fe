# Mentor X Frontend Rules

## Purpose
This folder defines the operating rules for the Mentor X frontend. Any AI agent, developer, designer, or reviewer must read these rules before changing React pages, layouts, routing, API integration, i18n, or UI behavior.

These rules exist because the current frontend already shows product drift:
- duplicate or stale routes and files
- placeholder and demo surfaces in runtime navigation
- mixed English and Vietnamese hardcoded copy
- negotiation UI carrying legacy duration, delivery, and scope concepts
- MentorHub pages that can drift toward generic dashboard or duplicate marketplace patterns

## Core Rules
- Read `/docs/rules` before making frontend changes.
- Product rules override convenience, old placeholder UI, and generated UI habits.
- Frontend must reflect backend business truth instead of inventing new flow semantics.
- No fake production-facing data.
- No generic AI-dashboard filler UI.

## Recommended Reading Order
1. [00-product-foundation.md](</D:/Mentor X/mentorx-fe/docs/rules/00-product-foundation.md>)
2. [01-account-role-model.md](</D:/Mentor X/mentorx-fe/docs/rules/01-account-role-model.md>)
3. [02-business-flow.md](</D:/Mentor X/mentorx-fe/docs/rules/02-business-flow.md>)
4. [08-mentorhub-boundary.md](</D:/Mentor X/mentorx-fe/docs/rules/08-mentorhub-boundary.md>)
5. [07-negotiation-mvp.md](</D:/Mentor X/mentorx-fe/docs/rules/07-negotiation-mvp.md>)
6. [10-routing-layout-rules.md](</D:/Mentor X/mentorx-fe/docs/rules/10-routing-layout-rules.md>)
7. [04-ui-ux-style-guide.md](</D:/Mentor X/mentorx-fe/docs/rules/04-ui-ux-style-guide.md>)
8. [05-i18n-copy.md](</D:/Mentor X/mentorx-fe/docs/rules/05-i18n-copy.md>)
9. [06-api-integration.md](</D:/Mentor X/mentorx-fe/docs/rules/06-api-integration.md>)
10. [03-frontend-code-structure.md](</D:/Mentor X/mentorx-fe/docs/rules/03-frontend-code-structure.md>)
11. [09-no-fake-data.md](</D:/Mentor X/mentorx-fe/docs/rules/09-no-fake-data.md>)
12. [11-testing-build.md](</D:/Mentor X/mentorx-fe/docs/rules/11-testing-build.md>)
13. [12-ai-working-rules.md](</D:/Mentor X/mentorx-fe/docs/rules/12-ai-working-rules.md>)
14. [13-cleanup-roadmap.md](</D:/Mentor X/mentorx-fe/docs/rules/13-cleanup-roadmap.md>)

## How To Use These Rules In Future Prompts
- State that the task is for `mentorx-fe`.
- Require reading `README.md` plus the relevant rule files first.
- Name the affected route, page, layout, or API service.
- Require the agent to summarize current behavior before making UI or code changes.
- Require minimal safe change only.

Example prompt:

```md
Read `/docs/rules/README.md`, `07-negotiation-mvp.md`, and `10-routing-layout-rules.md` first.
Inspect the current mentor proposal detail and client job detail pages.
Summarize how negotiation is currently shown.
Propose the smallest UI change needed to align with the MVP rules.
Do not modify unrelated pages.
Run the required frontend build.
```

## Do
- Treat this folder as mandatory project guidance.
- Use these rules during implementation and review.
- Update the relevant rule file when product policy changes.

## Do Not
- Skip rule reading before editing UI.
- Treat placeholder UI as product truth.
- Override backend business flow with frontend wording.

## MVP Scope
- Establish a stable frontend policy for marketplace, workspaces, negotiation, i18n, routing, and API integration.

## Future Scope / TODO
- Add a short link to this ruleset from the frontend root `README.md`.
- Add a PR checklist that references these files.
