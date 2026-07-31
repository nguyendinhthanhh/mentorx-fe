# Mentor X Design Contract

## Register

Product UI. The interface serves marketplace discovery and operational work.

## Responsive Structure

- Mobile: 320px to 767px. Use one primary column, full-width actions, drawers
  for workspace navigation, horizontally scrollable tabs, and progressive
  disclosure for secondary detail.
- Tablet: 768px to 1023px. Use one or two columns based on content, preserve
  touch targets, and avoid desktop sidebars that reduce the working area.
- Desktop: 1024px and above. Use bounded multi-column layouts and persistent
  workspace navigation where space permits.
- Wide desktop: content remains bounded at 1600px. Operational data should not
  stretch indefinitely.

Breakpoints are content-driven. Tailwind's `sm`, `md`, `lg`, and `xl` values are
defaults, not permission to let content break between them.

## Layout Rules

- Page gutters: 12px at 320px, 16px on larger phones, 24px on tablets, 32px on
  desktop.
- Workspace pages use compact vertical rhythm. Public discovery pages may use
  more breathing room without turning into marketing templates.
- Flex and grid children that hold user content must allow shrinking with
  `min-w-0`.
- Tables remain tables on desktop and use an explicit horizontal scroll region
  on narrow screens. Do not squeeze operational columns into unreadable text.
- Modals use viewport gutters and a `100dvh`-bounded scrolling body. Mobile
  actions must remain reachable without relying on browser chrome height.

## Interaction

- Primary touch targets are at least 44px high.
- Keyboard focus is visible on every interactive control.
- Hover can enhance an action but cannot be the only way to discover it.
- Respect `prefers-reduced-motion`; product workflows do not require decorative
  animation.

## Content Priority

- Mobile keeps the same business capabilities as desktop.
- Show identity, status, next action, money, and deadlines before supporting
  metadata.
- Secondary filters and detail panels may collapse into drawers or expandable
  sections, but must not disappear.

## Visual Language

- Calm, professional, restrained color.
- No decorative gradients, fake metrics, glow-heavy cards, or workspace hero
  sections.
- English and Vietnamese copy use the existing i18n system.
