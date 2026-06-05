# 00 Product Foundation

## Purpose
Define what Mentor X frontend is building so pages and UI patterns stay aligned with the real product.

## Core Rules
- Mentor X is a mentor marketplace platform.
- Public marketplace is for browsing mentors, jobs, and courses.
- User workspace is for managing the user's own activity.
- MentorHub is a workspace, not a second marketplace.
- Frontend wording must reflect actual business state, not old UI assumptions.

## What Mentor X Is
- A professional mentor marketplace.
- A place where users browse mentors, post requests, compare proposals, and hire a mentor.
- A place where approved mentors manage proposals, contracts, earnings, and courses inside a workspace.
- A product with wallet, escrow, messaging, reviews, and moderation.

## What Mentor X Is Not
- Not a generic freelancer platform with default deliverables-heavy proposal UX.
- Not a fake AI dashboard with synthetic metrics.
- Not a session-first product at the MVP negotiation layer.
- Not a duplicate marketplace embedded inside MentorHub.

## MVP Modules
- Auth and account entry
- Public mentor, job, and course browsing
- User workspace for own jobs, wallet, notifications, purchased courses, reviews, and settings
- MentorHub for approved mentors
- Proposal and negotiation UI
- Contract and escrow status UI
- Messages
- Reviews
- Admin and moderator workspaces

## Out Of Scope For Now
- Production-facing demo routes
- Coming-soon pages that replace real workflows
- Delivery-days-first negotiation UX
- Default negotiation forms with separate scope, deliverables, or sessions

## Do
- Keep the marketplace/workspace split clear.
- Use product language that matches backend lifecycle.
- Prefer practical, professional UI over flashy placeholder-driven design.

## Do Not
- Turn MentorHub into a job-discovery clone unless it is true recommended jobs backed by real logic.
- Design pages around fake charts or empty AI cards.
- Add UI concepts that silently change the backend business flow.

## MVP Scope
- A clean mentor marketplace with real workspaces and clear transaction flow.

## Future Scope / TODO
- If the product later adds new default contract or scheduling concepts, document them explicitly before changing shared UI patterns.
