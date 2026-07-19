# EduBridge Design System

The single reference for every design decision used across the EduBridge
marketing site (`index.html`, `app.html`) and the MVP product app (`mvp/`).
Token sources of truth: [`assets/theme.css`](assets/theme.css) for the
marketing site and [`mvp/src/styles/global.css`](mvp/src/styles/global.css)
for the app. If a value here ever disagrees with those files, the files win.

---

## 1. Brand essence

- **Personality:** trust-first, warm, editorial-minimal. EduBridge connects
  Kenyan parents with vetted educators, so every choice optimizes for
  credibility and legibility over decoration.
- **Formula:** monochrome surfaces (off-black / off-white) + exactly one
  accent color + real photography of African teachers, students and parents.
- **Wordmark:** "Edu**Bridge**" set in the brand sans; the "Bridge" half (or
  the em element in the logo) carries the accent text color.

## 2. Typography

Two typefaces, never more (the Rebirth-template pairing):

| Role | Typeface | Weights | Usage |
|---|---|---|---|
| Text and headings | **Plus Jakarta Sans** | 400, 500, 600, 700, 800 | Everything: display, body, UI, buttons |
| Small labels / meta | **Fragment Mono** | 400 only | Uppercase eyebrows, section labels, category tags, badges, numbers and sizes (e.g. "2.4 MB to 118 KB"), TSC numbers |

Rules:

- Headings: weight 700-800, tight tracking (`-0.01em` to `-0.03em`),
  `text-wrap: balance` on display lines.
- Body: weight 400-500, line-height 1.5-1.6, muted color (never pure black),
  measure capped around `65ch`.
- Mono labels: `0.62-0.75rem`, uppercase, letter-spacing `0.05-0.08em`,
  weight 400 (Fragment Mono has no bold; never fake-bold it).
- **No serif fonts anywhere.** No Inter as a default. No mixed-family
  emphasis inside a headline; use bold or color of the same family.
- Loading: marketing site uses Google Fonts `<link>` with `display=swap`;
  the app uses `next/font` (self-optimized, zero layout shift).

## 3. Color system

One palette, shared by both properties. Amber is the only accent; everything
else is a neutral. Saturated color is a scarce resource spent solely on
primary actions and trust markers.

### Light theme

| Token | Hex | Used for |
|---|---|---|
| `--bg` / `--background` | `#F9FAFB` | Page background (soft neutral, never pure white) |
| `--bg-soft` | `#F4F6F8` | Alternate sections |
| `--surface` / `--card` | `#FFFFFF` | Cards, inputs, panels |
| `--surface-2` / `--muted` | `#EEF1F4` | Chips, wells, secondary surfaces |
| `--ink` / `--foreground` | `#1A1C1F` | Primary text (off-black) |
| `--ink-soft` / `--muted-foreground` | `#5A626C` | Secondary text (AA on `#F9FAFB`) |
| `--line` / `--border` | `rgba(26,28,31,0.14)` / `#E2E5E9` | Borders |
| `--line-soft` | `rgba(26,28,31,0.08)` | Hairline dividers |
| `--forest` / `--secondary` | `#1A1D21` | Ink-colored buttons, dark sections |
| `--forest-deep` | `#0C0E10` | Footer, deepest sections |
| `--accent` / `--primary` | `#F0B429` | THE accent: primary buttons, badges, stars, focus rings, selection |
| `--on-accent` | `#0B0C0B` | Text on amber (about 10:1 contrast) |
| `--sage` | `#8F5F00` | Text-safe amber for interactive hovers (about 5.2:1 on bg) |
| `--clay` | `#7D5300` | Text-safe amber for small labels and links (about 6.4:1) |
| `--error` / `--destructive` | `#B3261E` | Errors only |
| `--on-dark` | `#F5F6F8` | Text on dark sections |

### Dark theme

| Token | Hex |
|---|---|
| `--bg` / `--background` | `#0C0E10` |
| `--bg-soft` | `#111417` |
| `--surface` / `--card` | `#14171A` |
| `--surface-2` / `--muted` | `#1B1F24` |
| `--ink` / `--foreground` | `#EFF1F4` |
| `--ink-soft` / `--muted-foreground` | `#9AA2AC` |
| `--border` | `#262B31` |
| `--forest` / `--secondary` | `#262B31` |
| `--forest-deep` | `#16191D` |
| `--accent` / `--primary` | `#F0B429` (unchanged) |
| `--sage`, `--clay` | `#F0B429` (bright amber becomes text-safe on dark) |
| `--error` / `--destructive` | `#FF6B6B` |

Color rules:

- **One accent, locked page-wide.** No second hue ever appears (charts reuse
  amber + neutrals).
- Amber fills always carry near-black text; amber is never used as body-text
  color on light backgrounds (use `--clay`/`--sage` instead).
- No pure `#000000` or pure-white text; off-black and off-white only.
- Every text/background pair meets **WCAG AA (4.5:1)** minimum; the amber
  button pair is about 10:1.
- No gradients as decoration, no neon glows, no AI-purple. The only glow is
  the subtle amber shadow under primary CTAs and the dark-mode toggle knob.

## 4. Themes (light / dark)

- Both properties ship **both modes**; neither is an afterthought.
- Marketing site: `data-theme="dark"` attribute on `<html>`, toggled by a
  pill **switch with a sliding knob** (sun icon in light, moon in dark, amber
  knob + soft glow in dark). Choice persists in `localStorage` and defaults
  to `prefers-color-scheme`.
- App: shadcn convention, `.dark` class swaps the CSS custom properties.
- Theme change cross-fades background/color over 0.35s; disabled under
  `prefers-reduced-motion`.
- Page-theme lock: sections never flip theme mid-scroll. The one sanctioned
  exception on the marketing site is the ink-colored hero/CTA canvas, which
  stays dark in both modes as a deliberate brand block.

## 5. Shape and radius

A documented three-tier system, applied everywhere:

| Element | Radius |
|---|---|
| Buttons, chips, badges, toggle, avatars | Full pill (`100px` / `rounded-full`) |
| Cards, panels, modals | `16-20px` (`--radius: 1rem-20px`, `rounded-2xl`) |
| Inputs, selects, textareas, small tiles | `10-12px` |

Never mix outside this rule (no square buttons on a pill page, no pill cards).

## 6. Elevation and shadows

- Two levels in practice: `--shadow-sm` (`0 1px 6px rgba(15,18,22,0.05)`)
  for resting cards/knobs, `--shadow-md`/`--shadow-lg` for overlays and
  modals. All are soft, low-opacity, tinted to the background hue - no harsh
  black drop shadows.
- Elevation communicates hierarchy only; flat borders (`1px --line`) and
  spacing do most of the grouping work.

## 7. Iconography

- **Phosphor icons only** (web font on the marketing site,
  `@phosphor-icons/react` in the app). One family, consistent optical size.
- Filled variants (`ph-fill` / `weight="fill"`) reserved for state: active
  stars, the vetted seal, the send button.
- **No emoji in UI**, headings, or alt text (emoji allowed only inside chat
  message content written by users).
- No hand-rolled SVG icons.

## 8. Imagery

- Photography is **free-licensed from Pexels**, always showing **African
  teachers, students and parents**, rendered in **full color**.
- Portraits for people, environmental classroom shots for context; every
  image slot verified against its subject (no generic stock mismatch).
- Avatars: photo when available, otherwise initials on an ink-colored circle
  (neutral gray fills from the palette, no random colors).
- No decorative illustrations, no div-built fake screenshots.

## 9. Layout and spacing

- **Mobile-first, always.** Base styles target phones (fluid widths,
  stacked flex/grid, `min-width: 0`, `flex-wrap`); `@media (min-width)` /
  `sm: md: lg:` only scale up. Every new screen is verified at ~390px width
  with zero horizontal overflow.
- Content containers: `max-w-6xl`/`max-w-7xl` (~1060-1200px) centered,
  16-32px side padding.
- Cards grid: 1 column on phones, 2-3 columns from `sm`/`lg`.
- Messaging is a two-column split (`320px` list + fluid chat) that collapses
  to a single column with a back arrow below `md` (768px).
- Touch targets minimum ~40px; nav height capped at 64px.
- Eyebrow restraint: at most 1 mono eyebrow label per ~3 sections.

## 10. Motion

- Intent: calm and functional (trust-first), roughly "motion intensity 3/10".
- Micro-transitions only: 0.2-0.35s ease on color, border, transform;
  translate/scale nudges on hover and `:active` for tactile feedback.
- Signature moments: the theme-toggle knob slide
  (`cubic-bezier(0.34, 1.4, 0.64, 1)` spring) and scroll-reveals + animated
  stat counters on the landing page.
- Everything meaningful is gated behind `prefers-reduced-motion: reduce`.
- Only `transform` and `opacity` are animated; no scroll-hijacking.

## 11. Accessibility

- WCAG AA contrast minimum everywhere, both themes.
- Visible focus: 2px amber `:focus-visible` outline / ring on every
  interactive element.
- Semantics: labels above inputs (never placeholder-as-label), `role=switch`
  + `aria-checked` on the theme toggle, `role=radiogroup` for role and star
  pickers, `aria-label` on icon-only buttons, `role=alert` on inline errors,
  alt text on all meaningful images.
- Errors are inline text next to the field or a toast for transient info,
  in `--error` red with readable contrast.

## 12. Voice and copy

- Plain, specific, warm; Kenyan context is real (counties, CBC, KSh, TSC,
  DCI, "Karibu").
- **No em-dashes or en-dashes** in visible copy; ranges use hyphens.
- No AI-marketing verbs ("elevate", "seamless", "unleash", "next-gen").
- Numbers are organic, not fake-precise; money is "KSh 1,500" style.
- Honesty rule: the UI never claims automation that does not exist (e.g.
  vetting copy says documents are checked against the official TSC and DCI
  portals by a reviewer).
- Realistic local names in all seed/demo content (Wanjiku Kariuki, Naliaka
  Wafula, Achieng Odera) - never "John Doe".

## 13. Component conventions

- **Primary CTA:** amber pill, near-black text, semibold, subtle amber
  shadow; hover lifts 1-2px. One primary CTA intent per screen.
- **Secondary:** ink-filled pill (`--forest`). **Ghost:** transparent with
  1.5px border.
- **Badges/chips:** pill, Fragment Mono uppercase micro-type; the vetted
  badge is amber-tinted with a filled seal-check icon.
- **Status chips:** amber tint = confirmed, muted gray = pending/absent.
- **Cards:** white/`--surface`, 1px border, 16-20px radius, hover shows an
  amber border rather than a bigger shadow.
- **Chat bubbles:** own messages ink-filled right-aligned, incoming muted
  left-aligned, asymmetric corner (`rounded-br-md` / `rounded-bl-md`).
- **Empty states:** dashed-border tile with a bold one-liner plus a helpful
  next action; never a bare "no data".
- **Forms:** label above, helper text below, inline error below that;
  compression feedback shown in mono ("3.2 MB to 98 KB").

## 14. File map

| File | Owns |
|---|---|
| `assets/theme.css` | Marketing-site tokens, base styles, theme toggle component |
| `assets/shared.js` | Theme persistence, toasts, image-compression helpers |
| `mvp/src/styles/global.css` | App tokens (shadcn variable mapping), font wiring |
| `mvp/src/app/[locale]/layout.tsx` | `next/font` loading of Jakarta Sans + Fragment Mono |
| `CLAUDE.md` | Non-negotiable rules enforced on every change |
