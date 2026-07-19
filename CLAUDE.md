# EduBridge site

Static site, no build step: `index.html` (landing) and `app.html` (client-side
app, state in `localStorage`). Shared design tokens live in
`assets/theme.css` (single source of truth for the brand palette) and shared
helpers in `assets/shared.js`; both pages load them, so palette or helper
changes go there, not in the per-page code. Served via GitHub Pages.

## Design rules (always apply)

For ANY change that touches UI, layout, styling, or copy visible on a page,
follow the design skills committed in `.claude/skills/` BEFORE writing code:

1. Load `design-taste-frontend` and follow it, including its final
   pre-flight checklist.
2. For changes to existing pages, also follow `redesign-existing-projects`
   (audit first, work with the existing stack, never break functionality).

Non-negotiables from those skills that apply to this repo permanently:

- Mobile-first always: base styles target phones, `@media (min-width)` only
  to scale up; verify every new UI at ~390px width

- Zero em-dashes and en-dashes in visible copy; ranges use hyphens
- Brand is black / white / warm amber (`--accent: #F0B429`): monochrome
  surfaces, one accent, accent fills always carry dark text
- Photography is free-licensed (Pexels), shows African teachers, students
  and parents, and renders in full color
- Typography is Plus Jakarta Sans for text and headings, Fragment Mono
  for small uppercase labels (Rebirth-style pairing); no serif display fonts
- Icons come from Phosphor; no emoji as UI icons (emoji allowed only inside
  chat message text)
- Max 1 uppercase eyebrow label per 3 sections; no split section headers;
  no three-equal-card feature rows
- One theme per page, WCAG AA contrast on all buttons and forms,
  `prefers-reduced-motion` respected, one label per CTA intent

## Verification

After any functional change, run the Playwright end-to-end checks
(signup handoff from the landing modal, directory search/filters, chat
send + reply, resource posting, job apply, logout/login persistence,
mobile at 390px with zero horizontal overflow) against a local
`python3 -m http.server` and confirm zero JS console errors.
