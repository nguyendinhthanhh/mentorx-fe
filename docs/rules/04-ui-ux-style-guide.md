# 04 UI UX Style Guide

## 1. Purpose
Define a strict UI and UX standard for Mentor X frontend so future work does not drift into generic AI-generated SaaS dashboard styling.

Mentor X is a real mentor marketplace and workspace product. The UI must help users browse, decide, negotiate, work, moderate, and manage money clearly. It must not look like a fake template, demo shell, or decorative dashboard.

## 2. Product UI Personality
### Core Rules
- The product should feel real.
- The product should feel practical.
- The product should feel professional.
- The product should feel clean.
- The product should feel product-specific.
- The product should feel marketplace and workspace focused.
- The product should feel dense enough for real users.
- The product should feel clear in hierarchy and business actions.

### Do
- Prefer credible product UI over flashy showcase UI.
- Make the screen useful within the first scan.
- Use visual restraint so real information stands out.

### Do Not
- Make Mentor X feel like a Dribbble mockup.
- Make Mentor X feel like a landing page template.
- Make Mentor X feel like a crypto dashboard.
- Make Mentor X feel like a fake admin panel.
- Make Mentor X feel like a random Tailwind component gallery.

### MVP Scope
- A trustworthy, task-focused product interface.

### Future Scope / TODO
- If the design system becomes more formal later, convert these rules into reusable design tokens and review checklists.

## 3. What Mentor X UI Should Feel Like
### Core Rules
- Public marketplace should feel like a professional discovery and comparison tool.
- User workspace should feel like an operational control area for the user's own activity.
- MentorHub should feel like a mentor work console.
- AdminHub should feel like an operations and moderation system.

### Good Reference Direction
- LinkedIn for profile clarity.
- Upwork or Fiverr for proposal and job comparison flow.
- Stripe for financial clarity and trust.
- Linear or Notion for clean workspace density.
- Gmail, Zalo, or Messenger for inbox-first messaging.
- Modern admin tools for queue-based review operations.

### Do
- Make product identity stronger than component-library identity.
- Use business actions as the main visual anchor.

### Do Not
- Decorate empty pages just to make them look busy.
- Add visual patterns that are not tied to the actual product surface.

### MVP Scope
- Clear marketplace and workspace behavior on every major screen.

## 4. What Mentor X UI Must Avoid
### Core Rules
- Avoid fake charts.
- Avoid fake AI recommendation cards unless backed by real logic and data.
- Avoid demo-looking pages.
- Avoid excessive gradients and glowing cards.
- Avoid random oversized stat cards that do not help the user.
- Avoid random icons, decorative blobs, waves, and meaningless accent graphics.
- Avoid hero sections inside workspaces and admin pages.

### Do
- Remove filler.
- Prefer honest empty states.
- Use real data or say the feature is not ready.

### Do Not
- Add fake percentages, growth, or performance metrics.
- Add "AI Suggestions" panels without real backend support.
- Add decorative dashboard cards to fill space.

### MVP Scope
- No mockup-first UI behavior in production-facing screens.

## 5. Marketplace UI Rules
### Core Rules
- Marketplace is for browsing mentors, jobs, and courses.
- Marketplace pages may be more visual than workspaces, but they must remain useful and credible.
- Search, filters, summaries, and comparison matter more than decorative polish.

### Rules
- Mentor cards must help users compare real expertise, proof, price context, and status.
- Job cards must show meaningful summary, budget context, and status.
- Course cards must show real course information, not generic education filler.
- Marketplace pages should not use huge empty sections with one line of content.

### Do
- Keep filters obvious.
- Support scan-and-compare behavior.
- Use clear metadata and real ranking cues if available.

### Do Not
- Turn the marketplace into a glossy landing page after login.
- Add fake testimonials, fake counters, or fake activity strips in product flows.

### MVP Scope
- Usable discovery surfaces for mentors, jobs, and courses.

## 6. User Workspace UI Rules
### Core Rules
- User workspace is for managing posted jobs, purchased courses, wallet, transactions, reviews, and settings.
- User workspace should prioritize task completion, not visual spectacle.

### Rules
- Show owned items, current status, next action, and important alerts first.
- Pages should answer:
  - what is happening
  - what requires action
  - what can the user do next

### Do
- Use compact operational sections.
- Keep wallet and transaction areas plain and trustworthy.
- Keep proposal and contract state visible where relevant.

### Do Not
- Add giant "welcome back" blocks.
- Turn the workspace into a marketplace duplicate.
- Use fake metrics just to fill a dashboard.

### MVP Scope
- A user control area that supports real task flow.

## 7. MentorHub UI Rules
### Core Rules
- MentorHub is a workspace for mentor operations, not a duplicate marketplace.
- MentorHub must focus on real operational pages only.

### Allowed Sidebar Scope
- Overview
- My Proposals
- Active Contracts
- My Courses
- Schedule
- Earnings
- Reviews
- Messages
- Settings

### Rules
- Do not duplicate public marketplace job browsing unless the page is truly "recommended jobs" backed by real data.
- Overview must show useful workload and action status, not decorative filler.
- Proposal pages must focus on proposal status, offer terms, negotiation, and next action.
- Contract pages must focus on active work, escrow, deadlines, client context, and allowed actions.
- Earnings pages must be financially clear, not decorative.

### Do
- Keep MentorHub dense enough for ongoing work.
- Preserve sidebar context across mentor routes.
- Keep messages inside MentorHub context.

### Do Not
- Add marketplace-style browse pages by default.
- Add fake insight cards.
- Add fake charts.
- Add large hero blocks.

### MVP Scope
- A real mentor operations workspace.

### Future Scope / TODO
- If recommended jobs become mature, define them as a narrow recommendation surface, not open marketplace duplication.

## 8. AdminHub UI Rules
### Core Rules
- AdminHub is an operational moderation and management system.
- AdminHub is not a decorative dashboard.

### Rules
- Prefer queue, list, table, and detail panel patterns.
- Prioritize search, filters, status, evidence, action history, and safe actions.
- Admin actions must look deliberate and high-signal.
- Marketing-style cards do not belong here.

### Do
- Use list + detail layouts.
- Keep critical actions sticky and visible when needed.
- Make action consequences obvious.

### Do Not
- Use fake analytics.
- Use colorful dashboard filler.
- Hide evidence behind decorative layout patterns.

### MVP Scope
- Fast scanning, moderation, review, and safe operations.

## 9. Layout And Spacing Rules
### Core Rules
- Workspace pages should prioritize task completion.
- Admin pages should prioritize scanning, filtering, and decision-making.
- Marketplace pages can be more visual but must still stay useful.

### Rules
- Avoid huge empty cards with only one line of text.
- Avoid repeated four-card dashboards unless each card has real action value.
- Keep action areas consistent across similar pages.
- Use space to support hierarchy, not to make sparse pages look premium.

### Do
- Compress repeated operational data when possible.
- Prefer denser vertical rhythm on work pages than on marketing-like pages.
- Align actions consistently near the information they affect.

### Do Not
- Use excessive whitespace that lowers information density.
- Scatter important actions in unrelated corners.
- Stack multiple competing CTAs at the top of every page.

### MVP Scope
- Balanced density for real usage, not showcase screenshots.

## 10. Typography Rules
### Core Rules
- Typography must help scanning and hierarchy first.
- Headings must be specific and useful.
- Labels must be short, business-specific, and action-oriented.

### Rules
- Use clear page titles that describe the real task.
- Use concise section headings.
- Use helper text only when it reduces confusion.
- Avoid vague headers such as `Overview` if a more specific heading improves clarity inside a section.

### Do
- Prefer direct labels like `Escrow locked`, `Waiting for client response`, `Deadline overdue`.
- Keep body copy short and practical.

### Do Not
- Use AI-sounding marketing copy in operational pages.
- Use generic hero language like `Unlock your potential` or `Transform your journey`.

### MVP Scope
- Typography that supports decision-making and task completion.

## 11. Card And Panel Rules
### Core Rules
- Cards must have a clear purpose.
- Every card must answer:
  - what is this
  - why does it matter
  - what can I do

### Rules
- Do not create cards only to fill space.
- Do not create fake metric cards.
- Do not create `AI Suggestions` cards unless backed by real data.
- Prefer compact cards for operational pages.
- Use panels for grouped information with clear meaning, not random decoration.

### Do
- Collapse repeated information into lists or tables when that improves scanning.
- Keep card content compact and actionable.

### Do Not
- Over-round every card.
- Over-shadow every panel.
- Use gradient cards just to force a "premium" feel.

### MVP Scope
- High-signal cards only.

## 12. Table List Rules
### Core Rules
- Use tables or structured lists when repeated operational data must be scanned quickly.
- Use cards only when identity and summary matter more than row comparison.

### Rules
- AdminHub should usually lean table or queue first.
- Earnings, transactions, proposals, and moderation queues should be easy to sort and scan.
- Repeated data should not become a wall of nearly identical cards.

### Do
- Prefer list + detail or table + detail for operational review flows.
- Keep row actions clear and limited.

### Do Not
- Replace every table with stacked cards on desktop without a product reason.
- Hide important statuses inside verbose card text.

### MVP Scope
- Faster scanning for repeated objects and decisions.

## 13. Button Action Rules
### Core Rules
- Buttons must be business-specific.
- Primary actions must be obvious.
- Secondary actions must not compete with the primary path.
- Destructive actions must be visually deliberate.

### Rules
- Avoid vague button labels like `Submit`, `Continue`, or `Proceed` when a more specific action exists.
- Use concrete labels such as:
  - `View contract`
  - `Send counter offer`
  - `Accept offer terms`
  - `Approve withdrawal`
  - `Reject application`

### Do
- Keep action wording tied to the actual business step.
- Keep action placement stable across related pages.

### Do Not
- Use multiple primary buttons in the same action zone unless truly necessary.
- Use decorative button variants that obscure priority.

### MVP Scope
- Clear, specific, business-safe action language.

## 14. Status Badge Rules
### Core Rules
- Status badges must represent real backend states.
- Color is for status, priority, and primary actions first, not decoration.

### Rules
- Use neutral surfaces first.
- Use success for completed or approved.
- Use warning for pending or attention-needed states.
- Use danger for rejected, disputed, failed, overdue, or blocked states.
- Use neutral for draft, archived, inactive, or informational states.

### Do
- Keep status naming consistent across pages.
- Make badges compact and easy to scan.

### Do Not
- Invent new visual meaning for the same state on different pages.
- Over-style badges with gradients or glows.

### MVP Scope
- Consistent operational status communication.

## 15. Empty Loading Error State Rules
### Core Rules
- Empty, loading, and error states must be honest.
- If no real data exists, say so clearly.

### Rules
- Empty state should explain what is missing and what the user can do next.
- Loading state should be simple and not over-designed.
- Error state should be specific enough to help the user retry or recover.
- Do not use fake charts, fake sample rows, or dummy conversation previews to avoid emptiness.

### Do
- Use honest copy like `No proposals yet` or `No released earnings yet`.
- Keep retry paths obvious.

### Do Not
- Use fake stats to avoid an empty page.
- Fill operational pages with placeholder suggestions that are not real.

### MVP Scope
- Honest state handling across all major surfaces.

## 16. Dashboard Rules
### Core Rules
- Dashboards must not be decorative.
- Every metric must come from real data.
- If real data is missing, show an honest empty state.

### Rules
- Do not use fake trend charts.
- Do not show percentages unless backed by real calculation.
- Do not use generic cards like `Growth`, `Performance`, or `AI Insights` unless they are real, product-specific, and useful.
- Avoid repeated metric strips if they do not help decisions.

### Do
- Show real workload, deadlines, waiting actions, escrow state, and queue counts when useful.
- Use dashboards as a launchpad for real work.

### Do Not
- Treat dashboards as a branding surface.
- Add fake KPIs, trends, or insights.

### MVP Scope
- Real overview, not decorative summary theater.

## 17. Financial UI Rules
### Core Rules
- Financial UI must maximize clarity and trust.
- Earnings, wallet, escrow, deposit, withdrawal, and transaction pages must feel more like Stripe than like a growth dashboard.

### Rules
- Use plain, readable totals and statuses.
- Explain when balances are pending, available, locked, or released.
- If earnings are not released yet, say so directly.
- Use transaction lists and detail views where appropriate.

### Do
- Keep financial copy explicit and calm.
- Make money states easy to distinguish.

### Do Not
- Use fake growth charts.
- Use celebratory decoration for unsettled or pending money states.
- Add decorative KPI blocks with no financial decision value.

### MVP Scope
- Trustworthy wallet and earnings UI.

## 18. Chat Messages UI Rules
### Core Rules
- Messages should be inbox-first.
- Do not force a desktop split view if the product direction is messenger-style interaction.
- Conversation list first, then conversation detail after click.

### Rules
- Keep MentorHub sidebar context when in mentor messages.
- Mobile and narrow layouts must remain usable.
- Do not show call or video icons unless supported by the actual product.
- Use real conversation states only.

### Do
- Make the inbox scannable.
- Preserve sender, context, unread state, and latest meaningful message.

### Do Not
- Add fake conversation previews.
- Force desktop-only messaging assumptions into the main UX.

### MVP Scope
- Practical inbox-first messages with stable workspace context.

## 19. Forms And Negotiation UI Rules
### Core Rules
- Forms should be short, focused, and grouped by user intent.
- Remove fields that users do not understand.
- Avoid duplicate information requests.
- Avoid huge forms for quick actions.

### Negotiation Form Rule
- MVP negotiation form uses only:
  1. Price
  2. Deadline date/time
  3. Message / Work details
- Do not show:
  - Delivery days
  - Estimated delivery
  - Sessions
  - separate Scope / Deliverables
- Show time remaining from deadline automatically.
- Button wording should be business-specific:
  - `Send counter offer`
  - `Accept offer terms`
- Do not use vague labels like `Submit`.

### Do
- Group related fields tightly.
- Use helper text only when it reduces confusion.
- Keep default forms narrow and comprehensible.

### Do Not
- Split simple negotiation into many pseudo-professional fields.
- Add unsupported actions or decorative form sections.

### MVP Scope
- Fast, understandable, business-specific forms.

## 20. i18n Copy Rules Related To UI
### Core Rules
- UI text must be short and useful.
- English and Vietnamese must be supported through i18n keys.
- Frontend should map backend enum, status, and error codes to translated labels.

### Rules
- Avoid generic AI-sounding copy such as:
  - `Unlock your potential`
  - `AI-powered insights`
  - `Transform your journey`
  - `Boost your productivity`
  - `Seamless experience`
- Prefer product-specific copy such as:
  - `No proposals yet`
  - `Waiting for client response`
  - `Escrow locked`
  - `Offer terms agreed`
  - `Deadline overdue`

### Do
- Keep labels concrete and operational.
- Prefer status language that reflects actual business state.

### Do Not
- Mix English and Vietnamese directly in the same product flow.
- Use inflated marketing language in workspace and admin pages.

### MVP Scope
- Practical bilingual operational copy.

## 21. Rules Against AI Looking Design
### Core Rules
- The UI must not look AI-generated.
- The UI must not feel like a prompt-produced template dashboard.

### Strong Negative Rules
- Avoid excessive purple or blue gradients.
- Avoid glowing cards.
- Avoid glassmorphism unless the entire product intentionally uses it.
- Avoid decorative blobs and waves in workspace or admin pages.
- Avoid random emoji and icon-heavy UI.
- Avoid many shadows just to make the screen look fancy.
- Avoid over-rounded cards everywhere.
- Avoid random stat walls.
- Avoid placeholder "AI" boxes with no real function.

### Detection Heuristics
If a page looks like it was made from generic SaaS prompts, it is probably wrong. Warning signs:
- too many isolated cards
- decorative metrics with no action value
- fake charts
- giant gradient welcome panels
- vague motivational copy
- inconsistent layout purpose
- low information density despite large page height

### Do
- Strip filler first.
- Ask whether every visual element helps a user do real work.

### Do Not
- Add decorative complexity to hide missing product thinking.

### MVP Scope
- Product-first UI, not aesthetic-first mockup UI.

## 22. UI Review Checklist Before Committing
### Core Rules
Before shipping any UI change, review it against this checklist.

### Checklist
- Does this page look like a real product screen instead of a template?
- Does every major card or panel have a clear purpose?
- Is there any fake data, fake chart, fake insight, or demo-looking block?
- Does the screen clearly support marketplace or workspace behavior instead of mixing both?
- Are the main actions specific and business-correct?
- Is the visual hierarchy clear?
- Is the information density appropriate for real users?
- Are gradients, shadows, and rounded corners restrained?
- Are all visible labels useful and non-generic?
- Does the touched page preserve MentorHub or workspace context correctly?
- Does the negotiation UI still follow `Price + Deadline + Message` only?
- Are empty, loading, and error states honest?
- Does the page still build cleanly after changes?

### Do
- Run this checklist before finalizing UI work.

### Do Not
- Approve a page only because it "looks modern".

### MVP Scope
- Practical quality gate for future UI changes.

## 23. Examples Of Bad Vs Good UI Decisions
### Core Rules
Use these examples to catch bad instincts early.

### Bad
- A large gradient card saying `Welcome back, mentor! Unlock new opportunities today.`

### Good
- `3 active contracts · 1 deadline due today · 2 proposals waiting for response`

### Bad
- Fake chart showing `Earnings growth +23%`

### Good
- `No released earnings yet. Earnings appear after escrow is released.`

### Bad
- Button label `Continue`

### Good
- `View contract`
- `Send counter offer`
- `Accept offer terms`

### Bad
- Admin page with colorful cards and no review workflow

### Good
- Queue list on the left, applicant detail on the right, sticky approve or reject footer

### Do
- Prefer the good examples even if they look less flashy.

### Do Not
- Optimize for screenshot appeal over product truth.

### MVP Scope
- Shared intuition for what to reject and what to keep.

## 24. How AI Must Behave When Asked To Improve UI
### Core Rules
- AI must read this file first.
- AI must inspect the current page before changing anything.
- AI must explain what makes the current UI look AI-generated if that is the problem.
- AI must propose minimal design corrections.
- AI must not redesign unrelated pages.
- AI must not add fake data.
- AI must not add unsupported actions.
- AI must not add decorative charts or filler cards.
- AI must preserve business logic.
- AI must run `npm run build`.

### Required AI Workflow
1. Read this file first.
2. Inspect the current page.
3. Explain what makes the UI look AI-generated or product-incorrect.
4. Propose minimal, page-local corrections.
5. Implement only related changes.
6. Build the frontend.
7. Report changed files and remaining UI risks.

### Do
- Correct hierarchy, density, copy, spacing, and surface purpose first.
- Prefer removing bad UI over adding more UI.

### Do Not
- Rewrite large areas without need.
- Smuggle in redesign ideas for unrelated routes.
- Add fake "smarter looking" UI.

### MVP Scope
- Strict guardrails for future AI-assisted UI work.

### Future Scope / TODO
- If repeated UI audits reveal new bad patterns, add them to this file instead of relying on memory.
