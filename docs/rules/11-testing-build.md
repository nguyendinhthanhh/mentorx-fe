# 11 Testing Build

## Purpose
Define the minimum verification standard for Mentor X frontend changes.

## Core Rules
- Every meaningful frontend change must build successfully before handoff.
- Pages that change user flow, negotiation, routing, or i18n require manual verification.
- UI cleanup must not silently break workspace navigation or business wording.

## Required Frontend Command
```powershell
npm run build
```

## Additional Commands
- Run `npm run lint` when touching TypeScript, React component structure, hooks, or general code quality paths.
- The current repo build already runs `tsc && vite build`, so successful build also covers TypeScript compile.

## Manual Verification Checklist
- Negotiation
  - only `price + deadlineAt + message` appear in default offer UI
  - accepted offer terms do not imply contract creation
  - client accepts mentor is the contract moment
- Messages
  - inbox-first behavior remains usable
  - narrow-screen behavior still works
- I18n
  - no mixed English/Vietnamese labels on touched surfaces
  - no corrupted Vietnamese text
  - new labels use i18n keys
- Layouts and Routing
  - MentorHub keeps sidebar context
  - Profile workspace keeps layout context
  - no broken redirects
  - no accidental exposure of demo routes
- Fake Data
  - no new mock balances, charts, or demo conversations in runtime UI

## Do
- Report what was built and what was manually checked.
- Run lint when relevant.
- Call out verification gaps honestly.

## Do Not
- Skip build after frontend edits.
- Claim a route or layout change is safe without checking navigation.
- Leave text or i18n regressions unmentioned.

## MVP Scope
- Reliable frontend build plus focused manual verification on risky UI flows.

## Future Scope / TODO
- Add page-specific QA scripts or screenshots only if the repo workflow later formalizes them.
