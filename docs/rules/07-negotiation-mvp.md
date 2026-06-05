# 07 Negotiation MVP

## Purpose
Lock the frontend negotiation UI to the confirmed Mentor X MVP model.

## Core Rules
- MVP negotiation offer fields are only:
  - `Price`
  - `Deadline date/time`
  - `Message / Work details`
- `Message` is the main work-details field.
- No delivery days in the main negotiation UI.
- No estimated delivery in the MVP negotiation UI.
- No sessions in the default negotiation form.
- No separate scope or deliverables fields in the default negotiation form.
- Frontend calculates `timeRemaining` from `deadlineAt`.
- Accepting offer terms does not create a contract.
- Accepting offer terms does not lock escrow.
- Client accepting mentor creates contract and locks escrow.

## Explicitly Excluded
- delivery days
- estimated delivery
- sessions
- separate scope field
- separate deliverables field

## UI Rules
- Default negotiation forms must not ask for duration days.
- Main offer cards, modals, summaries, and acceptance panels must not use delivery days as the primary negotiation term.
- Default negotiation UI must not show estimated delivery as a required or leading field.
- Default negotiation forms must not require sessions.
- Default negotiation forms must not split message into separate scope and deliverables inputs.
- Offer summaries should prioritize `price`, `deadlineAt`, and `message`.

## Lifecycle Copy Rules
- `Accept offer terms`
  - means both sides agreed on terms
  - does not hire mentor yet
- `Accept mentor`
  - client selects mentor
  - contract is created
  - escrow is locked

## Backward Compatibility Rules
- Old data fields may still exist in types or payloads.
- UI must not keep teaching users those old concepts as default negotiation behavior.
- Compatibility display should be temporary and subordinate to the MVP model.

## Do
- Center negotiation UI around the three MVP fields.
- Display deadline clearly and compute time remaining on the client.
- Use copy that clearly separates term agreement from mentor selection.

## Do Not
- Reintroduce duration or delivery-day-first UX.
- Present accepted terms as if the contract already exists.
- Use default forms with separate scope or deliverables fields.

## MVP Scope
- Clear negotiation UX aligned with backend business flow.

## Future Scope / TODO
- If post-MVP richer structured agreements are added, document them as explicit extensions, not silent default form growth.
