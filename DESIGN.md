# DESIGN.md — beton-web (Beton + Rondva, one Next app)

Source of truth for colour, type, spacing, radius, elevation and the shape of every control.
New UI code follows it; when you touch old code, move it onto it.

## 0. Surfaces and hard rules

| Surface | Host | Stylesheet | Language |
|---|---|---|---|
| Beton marketing | beton.is (`src/app/(main)`) | `src/app/globals.css` | Icelandic |
| Rondva marketing | rondva.com (`src/app/(rondva)/rondva`) | `src/app/(rondva)/rondva.css` | English |
| Dashboard | admin.beton.is / app.rondva.com (`src/app/(dashboard)`) | `globals.css`, re-coloured by `html[data-brand="rondva"]` | user's (`src/lib/i18n/dashboard.ts`) |

- **Frozen:** the report article/PDF (`.report-article`, `src/lib/report/**`, `src/components/report/**`). It is the
  customer's document; it keeps its own values and must stay pixel-identical (`scripts/verify-report-identity.cjs`).
- Each brand keeps its own palette. No cost estimates in Rondva copy or UI.
- Light theme only (`color-scheme: light`).
- In `className`, use tokens. Not allowed in new or touched code: `[#hex]`, `text-[Npx]`, `rounded-[…]`,
  `shadow-[…]`, opacity-shaded text colours (`text-ink/70`), Tailwind palette colours
  (`gray-*`, `stone-*`, `emerald-*`, `red-*`, `amber-*`, `slate-*`), `bg-white`/`text-white`.
  Allowed: grid templates, aspect ratios, illustration geometry (PhoneFrame, HeroFilm), third-party logo fills.
- Shared class recipes live in `src/lib/ui.ts` (Beton marketing + dashboard) and
  `src/components/rondva/ui.ts` (Rondva marketing). Use them instead of re-typing button/field classes.

## 1. Colour (role → token)

Token names are the existing ones; the dashboard swaps values under `html[data-brand="rondva"]`.

| Role | Token | Beton | Rondva (dashboard + rondva.css) | Rule |
|---|---|---|---|---|
| page background | `paper` | #e0e0db | #fafbfc | |
| quiet section / fill | `paper-alt` | #d6d6d1 | #f1f3f6 | |
| card / field surface | `surface` | #ffffff | #ffffff | replaces `bg-white` |
| primary text | `ink` | #000000 | #101418 | |
| secondary text, placeholders | `fog` (rondva.css: `muted`) | #4a4a44 | #5a6672 | ≥4.5:1 on paper and surface |
| hairline / card border | `concrete` (rondva.css: `line`) | #c5c5bf | #e2e6eb | decoration only |
| field / control border | `line-strong` | #767670 | #838c96 | ≥3:1 on paper and surface |
| accent: actions, links, eyebrows | `navy` (rondva.css: `blue`) | #003fba | #1b4fd8 | not for severity, not decoration |
| accent hover / pressed | `navy-deep` (`blue-deep`) | #002e87 | #163fae | |
| dark band / footer | `ink` | | | |
| text on dark | `paper` | | | |
| secondary text on dark | `on-inverse-muted` | #a8a8a4 | #b4b9bf | ≥6:1 on ink |
| accent on dark | `accent-on-inverse` | #8aa8ea | #8fb0ff | never `navy`/`blue` on ink |
| success | `success` / `success-tint` | #047857 / #ecfdf5 | same | |
| error, destructive | `danger` / `danger-tint` | #b53d3d / #fbeaea | #a32020 / #f7e9e9 | |
| severity 1 (note) | `sev-calm` · `sev-calm-text` · `sev-calm-tint` | #003fba · #003fba · #e8eefa | #4a6b8a · #4a6b8a · #edf1f5 | |
| severity 2 (serious) | `sev-warn` · `sev-warn-text` · `sev-warn-tint` | #c98a2e · #7d5210 · #f8eedd | #c08a2e · #7a5512 · #f6efe3 | |
| severity 3 (very serious) | `sev-danger` · `sev-danger-text` · `sev-danger-tint` | #b53d3d · #a63434 · #fbeaea | #a32020 · #a32020 · #f7e9e9 | |
| logo artwork | — | #1800ad (in the file) | #1b4fd8 | never used for UI |

Rules: at most two text colours per background (`ink` + `fog` on light, `paper` + `on-inverse-muted` on dark).
Badges = tint background + `*-text` colour + a 6px dot in the fill colour (never colour alone).
`gold`, `gold-soft`, `navy-soft`, `copper`, `copper-dk` are legacy aliases: do not use in new code.

## 2. Typography

Families. Beton: Epilogue (UI, body, headings; italic 400 for the accent word), Abel 400 for meta labels only (never
bold: it has no bold cut). Rondva: Source Serif 4 600 for display/headings (`.rv-display`), Inter for everything else.
Dashboard: Epilogue on Beton, Inter on Rondva (swapped by `data-brand`).

**Minimum size anywhere: 12px. Form controls are 16px below 640px** (iOS zooms on focus otherwise; enforced in
`globals.css`).

Beton marketing scale (`@theme` tokens; fluid, rem so they follow the user's text size):

| Utility | Size | Line height | Tracking | Use |
|---|---|---|---|---|
| `text-display` | clamp(2.5rem, 7vw, 5.25rem) | 1.0 | -0.035em | home hero H1 only |
| `text-h1` | clamp(2.25rem, 6vw, 4rem) | 1.04 | -0.03em | every other page H1 |
| `text-h2` | clamp(1.875rem, 4.2vw, 3rem) | 1.08 | -0.03em | section headings |
| `text-h3` | clamp(1.375rem, 2.4vw, 1.625rem) | 1.25 | -0.015em | cards, legal sections |
| `text-h4` | 1.25rem | 1.35 | -0.01em | FAQ, feature titles |
| `text-lead` | 1.125rem | 1.65 | 0 | intros |
| (`text-base`) | 1rem | 1.65 | 0 | body |
| (`text-sm`) | 0.875rem | | | meta, buttons, tables |
| `text-label` | 0.75rem, uppercase | 1.4 | 0.12em | eyebrows, nav, field labels |

Rondva marketing keeps its scale in `rondva.css` (`.rv-display`, `.rv-eyebrow` = 12px/600/+0.14em). Legal pages,
404 and new pages use `.rv-display` for the H1, like the home page.

Dashboard scale (both brands): page title `text-2xl font-semibold` (one `<h1>` per page) · section
`text-lg font-semibold` (`<h2>`) · card title `text-base font-semibold` · body `text-sm` (fields 16px on phones) ·
meta `text-xs text-fog`. Heading levels never skip.

Long words: Beton text runs in Icelandic with long compounds, so headings use `hyphens-auto` + `wrap-break-word`
(and `&shy;` in titles that still overflow at 320px).

## 3. Spacing and layout

- 4px grid (Tailwind spacing). Prefer 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32.
- One left edge per page: section = horizontal padding (`px-6 lg:px-14` Beton, `px-6` Rondva) → inner
  `mx-auto max-w-[1280px]` (Beton) / `max-w-[1180px]` (Rondva). Header, hero, sections and footer all use the
  same pattern; never put the padding inside the max-width box on one section and outside on another.
- Section rhythm `py-20 lg:py-28`; hero and dark bands `py-24 lg:py-32`.
- Dashboard: `mx-auto max-w-6xl px-4 sm:px-6 py-6`; sticky/fixed bars use the same container.
- Sticky headers: `html { scroll-padding-top }` keeps anchors and focus visible below them.
- Full-height layouts use `min-h-dvh`, not `min-h-screen`.

## 4. Radius

| Where | Cards / panels | Controls (fields) | Buttons, badges, chips |
|---|---|---|---|
| Beton marketing | `rounded-sharp` (2px) | `rounded-sharp` or line style | `rounded-full` |
| Dashboard (both brands) | `rounded-xl` (12px) | `rounded-lg` (8px) | `rounded-full` |
| Rondva marketing | `rounded-card` (14px) | `rounded-lg` (8px) | `rounded-full` |

No other radii (illustrations exempt).

## 5. Elevation

Beton is flat: borders separate surfaces; one photo shadow on portrait/hero photos. Dashboard: `shadow-sm` on
cards at most. Rondva marketing: `shadow-sm` for controls, one raised shadow for the featured pricing card, one
overlay shadow for the consent banner and dialogs.

## 6. Components

**Button** (`btn()` in `src/lib/ui.ts`; `rvBtn()` for Rondva marketing). Pill, `text-sm font-semibold`, sentence
case, trailing arrow allowed.
- Sizes: `sm` h-9 px-4 (dense dashboard toolbars, desktop only) · `md` min-h-11 px-6 (default) · `lg` min-h-13 px-7.
- Variants: `primary` (accent fill) · `secondary` (1px `line-strong` border, ink text) · `quiet` (text button, accent
  text, underline on hover) · `danger` (danger text + border) · `inverse` (on dark bands).
- Every variant has its own hover, `active:` (pressed: darker + 1px down), `disabled:`/`aria-disabled` (50% opacity,
  not-allowed cursor, no hover) and `focus-visible:` (2px accent outline, offset 2) style.
- Async buttons show a spinner and `aria-busy`, keep their width, and can't be double-submitted.
- **One primary button per screen region.** Re-running something destructive or billable (e.g. regenerate a report)
  is never the primary and always confirms first.

**Field** (`field()`, `label()`, `helpText()`, `fieldError()`): min-h-11, `surface` background, 1px `line-strong`
border, `rounded-lg` (dashboard/Rondva) or `rounded-sharp` (Beton), placeholder `fog`, 16px on phones.
Focus: accent border + 2px accent ring at 25%. Error: `danger` border, message directly under the field
(`aria-invalid`, `aria-describedby`), submit errors in `role="alert"`, success in `role="status"`.
Labels are real `<label htmlFor>`; radio groups are `<fieldset><legend>`. Forms use `noValidate` and our own
localized messages (no English browser bubbles on Icelandic pages).
Beton marketing contact form keeps its **line** variant (no box, bottom border `line-strong`, 2px accent on focus).

**Eyebrow:** Beton = `text-label` in `navy` (on dark: `accent-on-inverse`); meta label = Abel 12px/400 uppercase
`fog`. Rondva = `.rv-eyebrow`. No other label styles.

**Card:** Beton marketing = `paper`/`paper-alt` + 1px `concrete` + `rounded-sharp` + p-8. Dashboard = `surface` +
1px `concrete` + `rounded-xl` + p-6, `<h2>` card title. Rondva = `surface` + 1px `line` + `rounded-card`.

**Badge:** `badge()` — pill, h-6, px-2.5, `text-xs font-semibold`, `whitespace-nowrap`, tint background, `*-text`
colour, 6px dot. Pickers show the selection as a solid fill or 2px ring + `aria-pressed`/`aria-checked`, never opacity.

**Dashboard page header:** back link on its own line (`← Label`, min-h-11) → H1 → muted subline; actions on the right
from `sm`. Same on every dashboard page.

**Header / nav:** current page marked (`aria-current="page"` + accent underline); no nav item duplicates the CTA;
phones get a menu with ≥44px rows that closes on Escape, outside click and navigation.

**Footer:** dark band, `paper` + `on-inverse-muted` only, ≥12px, links ≥44px tall on phones.

**Dialog / lightbox / menu / banner:** native `<dialog>` (or equivalent) with focus moved in, trapped and restored,
Escape closes, labelled icon buttons, body scroll locked, fade/scale transition 150–200ms.

## 7. States

Every data view has: loading (skeleton `loading.tsx`), empty (heading + one next step), error (`error.tsx` with retry,
localized, branded), not found (`not-found.tsx`, localized, with a way back). Load failures are errors, not 404s.
Unsaved edits warn before leaving. Saves that fail keep the user's input.

## 8. Motion

Colour/opacity transitions 150–200ms. Beton fade-in-up 600ms ease-out. Rondva reveal 900ms
cubic-bezier(.22,1,.36,1), 90ms stagger, never on above-the-fold content (it must be visible without JS).
Everything decorative is off under `prefers-reduced-motion: reduce`, including smooth scrolling.

## 9. Accessibility floor

Text ≥4.5:1 (≥3:1 at ≥24px, or ≥18.66px bold); control borders, focus indicators and meaningful icons ≥3:1;
visible focus on every interactive element; touch targets ≥44×44px on phones (inline text links exempt); skip link
to `main#content`; one `<h1>` per page; every page has its own `<title>`, description and the right favicon.
