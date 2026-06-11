# 02 Business Flow

## Purpose
Describe the core Mentor X frontend flows in clear product language.

## Core Rules
- Frontend must present the business lifecycle clearly.
- UI must not blur the difference between negotiation, mentor acceptance, contract creation, and completion.
- User-facing labels must match backend truth.

## User Flow
1. Register and log in.
2. Complete onboarding if required.
3. Browse mentors, jobs, and courses.
4. Create a job or request.
5. Review proposals from mentors.
6. Negotiate terms if needed.
7. Accept a mentor.
8. View contract and escrow state.
9. Manage active work through job, contract, and messages.
10. Complete work or open dispute.
11. Leave review when eligible.

## Mentor Flow
1. Register as normal user.
2. Apply for mentor approval.
3. After approval, enter MentorHub.
4. Manage mentor profile and services.
5. Submit proposals.
6. Negotiate with clients.
7. Wait for client to accept mentor.
8. Fulfill active contract.
9. Monitor earnings and request withdrawal.

## Admin / Moderator Flow
- Moderator
  - review mentor applications
  - review reports and disputes
  - moderate content and abuse
- Admin
  - all moderation capabilities
  - financial control and withdrawal approval
  - system settings and role management

## Job -> Proposal -> Negotiation -> Contract Flow
1. Job is posted.
2. Mentor submits proposal.
3. Either side can negotiate.
4. Offer terms may become agreed.
5. Client accepts mentor.
6. Contract is created.
7. Escrow is locked.
8. Active work happens.
9. Completion, dispute, or cancellation follows.

## UI Semantics Rules
- `Accept offer terms` means the terms are agreed.
- `Accept mentor` means the client chooses that mentor.
- `Contract active` means escrow is already locked.
- `Dispute` means escrow remains locked.

## Do
- Use direct, unambiguous wording.
- Keep stage indicators tied to actual business state.
- Show contract and escrow timing clearly.

## Do Not
- Suggest that offer acceptance already hired the mentor unless the client actually accepted the mentor.
- Show escrow as locked before contract creation.
- Use mixed terminology for the same lifecycle step.

## MVP Scope
- Clear UI flow from proposal to funded contract completion.

## Future Scope / TODO
- Add a formal copy map for status timeline wording if the lifecycle UI expands further.
