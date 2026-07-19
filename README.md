# EduBridge — Teachers Site

A site where teachers, tutors and parents connect, share resources and
discover teaching opportunities.

No build step, no dependencies — serve as a static site (e.g. GitHub Pages):

- **`index.html`** — the public landing page
- **`app.html`** — the app: sign up or log in and use the network
- **`assets/theme.css`** — shared design tokens and base styles (the
  single source of truth for the black / white / amber brand)
- **`assets/shared.js`** — helpers used by both pages (image URLs,
  localStorage wrapper, toasts, theme toggle)

All app data lives in the browser via `localStorage`, so it works entirely
client-side.

## Landing page

- Searchable, filterable educator directory preview
- Resource hub and opportunities board with working filters
- Live messaging demo with auto-replies
- Light/dark theme toggle (persisted, respects system preference)
- Fully responsive with a mobile menu; respects `prefers-reduced-motion`
- "Join free" hands off to the app's signup

## App (`app.html`)

- Email/password accounts (client-side, for demo purposes) with login,
  logout and per-user state
- Home dashboard: greeting, stats, activity feed, suggested connections
- Educator directory: live search, role filters, connect/disconnect,
  message any educator
- Messaging: threads, unread badges, typing indicator, auto-replies
- Resource hub: filter by category, publish your own resources,
  download counters
- Jobs board: filter, one-click apply/withdraw
- Profile: edit county/subjects/grades/bio, view connections and applications
- Dark mode, mobile bottom navigation, toast notifications

Photography of African teachers, students and parents is hotlinked from
[Pexels](https://www.pexels.com) under the free
[Pexels License](https://www.pexels.com/license/) (no attribution required).
