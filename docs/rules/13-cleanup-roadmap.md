# 13 Cleanup Roadmap

## Purpose
Turn the current frontend audit findings into a practical execution order.

## Core Rules
- Lock product and UI rules first.
- Remove fake and demo runtime surfaces before visual polish.
- Normalize business-critical UI before broad cosmetic cleanup.
- Do not mix cleanup with unrelated redesign.

## Phase 1: Rules And Documentation
- finalize this ruleset
- align future frontend work with these documents

## Phase 2: Remove Fake Demo Mock Runtime Surfaces
- remove production-facing demo routes
- remove fake runtime data usage
- replace mock panels with honest empty or unavailable states

## Phase 3: Negotiation UI Normalization
- remove legacy duration, delivery, session, and scope-first negotiation patterns
- align offer UI with `price + deadlineAt + message`
- clarify offer agreement vs mentor acceptance

## Phase 4: MentorHub Boundary And Duplicate Page Cleanup
- make MentorHub a true workspace
- remove duplicate marketplace-like surfaces where not justified
- clean up backup or stale pages

## Phase 5: Routing And Dead File Cleanup
- remove stale route variants
- clean `Coming Soon` production paths for core areas
- normalize safe redirects

## Phase 6: I18n And Hardcoded Copy Cleanup
- replace hardcoded mixed-language labels with keys
- fix corrupted Vietnamese
- centralize status and error label mapping

## Phase 7: UI Polish To Remove AI Dashboard Look
- reduce filler KPI cards
- simplify noisy layouts
- improve professional marketplace and workspace clarity

## Phase 8: Build Test Verification
- run build
- run lint when relevant
- manually verify negotiation, routing, messages, layouts, i18n, and fake-data removal

## Do
- Execute phases in order unless a severe bug forces reprioritization.
- Keep each cleanup wave scoped and reviewable.
- Re-check product semantics after each major phase.

## Do Not
- Start with cosmetic polish while demo and fake runtime surfaces remain.
- Hide routing or i18n issues behind refactor language.
- Redesign broad areas without product justification.

## MVP Scope
- A staged plan to make the frontend consistent, honest, and product-aligned.

## Future Scope / TODO
- Convert each phase into concrete tickets when implementation begins.
