# 06 API Integration

## Purpose
Define consistent API integration rules for Mentor X frontend.

## Core Rules
- No random `fetch` or `axios` inside components.
- Use the `api` layer for network calls.
- Use typed request and response DTOs.
- Use React Query consistently for server state.
- Auth token handling must remain centralized.

## API Service Layer Rules
- Put request logic in `src/api`.
- Keep request payload and response types explicit.
- Use shared API client configuration for auth headers and base behavior.
- Do not duplicate the same endpoint logic across pages.

## React Query Rules
- Use React Query for remote server state.
- Query keys must be stable and meaningful.
- Loading, error, and empty states must be handled at the page or component boundary.
- Avoid ad hoc local caching strategies when React Query already owns the data.

## Token Handling Rules
- Token persistence and session state belong to auth store or centralized auth utilities.
- Pages must not manually reinvent auth header logic.

## Error Handling Rules
- Prefer backend error codes or structured messages.
- Map those to translated UI text.
- Do not dump raw backend error payloads directly into the UI if user-facing mapping exists.

## Type Rules
- Request and response DTOs must be typed.
- Avoid untyped `any` payload flow unless temporarily unavoidable and clearly scoped.
- Status enums should be mapped through shared helpers where practical.

## Do
- Keep components focused on rendering and interaction.
- Reuse API services and status helpers.
- Keep frontend behavior aligned with backend contracts.

## Do Not
- Call `axios` directly in random page branches.
- Duplicate token attachment logic.
- Invent client-only business semantics that override backend state.

## MVP Scope
- Stable typed API integration across marketplace and workspace pages.

## Future Scope / TODO
- Introduce more consistent typed error-code mapping utilities if current handling remains fragmented.
