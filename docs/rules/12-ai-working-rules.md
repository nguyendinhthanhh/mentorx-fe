# 12 AI Working Rules

## Purpose
Define how AI assistants must work in the Mentor X frontend repository.

## Core Rules
- Read the rules first.
- Inspect the current implementation before proposing UI changes.
- Summarize current behavior before modifying files.
- Propose the smallest safe change.
- Modify only related files.
- Run build and relevant checks before final handoff.

## Required AI Workflow
1. Read `/docs/rules/README.md` and the relevant rule files.
2. Inspect related files, routes, layouts, and API services.
3. Summarize current implementation.
4. Propose minimal safe change.
5. Modify only related files.
6. Run build and relevant checks.
7. Report changed files and remaining risks.

## Specific Mentor X Frontend Rules For AI
- Do not rewrite the whole project.
- Do not add fake data.
- Do not redesign unrelated pages.
- Do not silently change business flow.
- Do not replace real workspace behavior with template-looking dashboard filler.
- Do not hide errors, i18n gaps, or routing breakage.

## Change Scope Rule
- If the issue is local, keep the fix local.
- If the issue crosses routing, i18n, and business semantics, explain that before broadening scope.

## Reporting Rule
- Final report must include:
  - what changed
  - why it changed
  - what was verified
  - what still needs follow-up

## Do
- Preserve project-specific design language where it is valid.
- Prefer practical UI cleanup over flashy redesign.
- Keep product semantics aligned with backend truth.

## Do Not
- Generate generic dashboards because the page feels empty.
- Spread business logic changes across unrelated pages.
- Pretend unverified UI flows are safe.

## MVP Scope
- Controlled, reviewable AI assistance for Mentor X frontend.

## Future Scope / TODO
- Add a short AI review checklist to PR workflow if the team wants formal enforcement later.
