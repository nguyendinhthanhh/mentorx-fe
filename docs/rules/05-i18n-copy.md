# 05 I18n Copy

## Purpose
Set language, translation, copy, and formatting rules for Mentor X frontend.

## Core Rules
- English and Vietnamese i18n must use translation keys.
- Frontend must support English and Vietnamese.
- Use i18n keys for UI labels.
- Do not hardcode mixed English and Vietnamese in the same product surface.
- Fallback language is English.
- Corrupted Vietnamese text is not acceptable.

## Language Support Rules
- Supported UI languages:
  - `en`
  - `vi`
- The current repo already exposes those languages in `src/i18n/translations.ts`; new UI must follow that system.

## Copy Rules
- Backend returns status and error codes.
- Frontend maps those codes to translated user-facing labels.
- Do not display raw backend enum names when a translated label exists.
- Do not translate business meaning inconsistently across pages.

## Hardcoding Rules
- No new hardcoded visible product labels when an i18n key is appropriate.
- Avoid page-local copy islands that bypass the translation system.
- Remove mixed-language headers, buttons, and helper text over time.
- New English and Vietnamese copy must be added through translation files, not embedded directly into JSX.

## Formatting Rules
- Date and time formatting must be locale-aware.
- Currency formatting must be consistent for MXC and local money display.
- `deadlineAt` should display as a clear date-time.
- `timeRemaining` is a frontend-calculated display value derived from `deadlineAt`, not a backend-translated string.

## Fallback Rules
- If a translation key is missing, fallback to English.
- Do not fallback to a random mixed-language string.

## Encoding Rules
- Corrupted Vietnamese text must be treated as a bug, not accepted content.
- Source files must remain UTF-8 clean.

## Do
- Add keys to translation files for new user-facing text.
- Centralize repeated status or error label mapping.
- Keep language behavior predictable.

## Do Not
- Hardcode mixed English/Vietnamese UI labels.
- Display mojibake or corrupted Vietnamese strings.
- Translate business statuses ad hoc on each page.

## MVP Scope
- Clean bilingual UI with predictable label mapping.

## Future Scope / TODO
- Add a copy review pass for high-traffic pages after core cleanup phases.
