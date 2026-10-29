# Product

<!-- impeccable:product-schema 1 -->

This repo serves two products from one Next app (routed by host): **Rondva** (rondva.com, app.rondva.com) and
**Beton** (beton.is, admin.beton.is). This record covers Rondva; Beton notes are at the end.

Source of this record: written 2026-10-29 from the repo, `../plan/rondva/**` and owner decisions on file. The owner
delegated every decision for this pass ("take all decisions"), so facts marked *(inferred)* are drawn from that
evidence and were not separately confirmed in an interview.

## Platform

web

## Users

- **Primary:** independent pre-purchase / residential property inspectors and small inspection firms (1–3 people),
  first in New Zealand, then Australia, UK, Ireland and the US. They inspect on site for 1.5–2.5 h (subfloors, roof
  spaces, often no signal, gloves and a torch in hand), then traditionally spend 2–4 h at a desk writing the report.
  They charge roughly NZ$500–1,000+ per report.
- **Their job on rondva.com:** decide in a few minutes whether Rondva can take the desk session off their evening
  without putting their name on something they did not write; then install the iPhone app or set up a company
  account.
- **Arriving from:** cold outreach emails (NZ/AU/UK/IE/US), App Store, country pages (`/nz`, `/au`, `/uk`, `/ie`,
  `/us`, `/ca`), search. Many read on a phone first. *(inferred from outreach routines and traffic sources)*
- **Secondary:** the inspector's own clients only ever see the finished report (PDF / web report), never the
  marketing site.

## Product Purpose

Rondva is an iPhone field app plus web dashboard. The inspector records rooms, photos, thermal images, notes and
severity on site; Rondva drafts the report wording and summary with AI in the inspector's structure, the inspector
reviews and edits, and exports a branded PDF. Success = inspectors run their first AI report during the free month
and keep paying. Current goal: 5 paying companies by 19 Dec 2026; leading metric is companies that have run ≥1 AI
report.

## Positioning

The only tool (as far as the competitor sweep of 2026-10-07 found) that combines a country-standard report
(NZS 4306 live; AS 4349.1 / ISOP sample formats) with AI that reads the inspector's photos and notes and writes the
whole report, **while the AI is mechanically prevented from changing the inspector's judgement**: ratings are locked,
figures and moisture readings must match numbers the inspector entered, every report discloses AI-assisted text,
nothing is sent to a client automatically. Competitors either have the standard but no AI (InspectPro) or are US
tools with templates and comment libraries (Spectora). The "Where the AI stops" promise is the core claim, not a
footnote.

## Operating Context

- iPhone only (App Store, live since 2026-10-19; v1.3.1). No Android. Web dashboard at app.rondva.com for company
  setup, report review and editing.
- Works offline on site; syncs later.
- Purchases happen only in the iPhone app through Apple (IAP); nothing can be bought on the website.
- Reports: AI draft → manual edits (free, unlimited) → PDF re-export (free).
- Data stored in the EU (Ireland).

## Capabilities and Constraints

- Pricing (source of truth `src/lib/rondva-pricing.ts`): first month free = 20 AI-drafted reports within 30 days of
  the first AI report, no card, nothing renews; Solo US$49.99/mo (15 reports), Pro US$99.99/mo (30, recommended),
  Report pack US$69.99 one-time (10, never expire). Local prices charged by Apple incl. GST/VAT.
- 2 AI revisions included per report; manual edits and re-exports never count.
- Report formats: NZS 4306 (live), sample AU / UK / IE / US / CA formats. US/CA copy is gated by `ISOP_ENABLED`.
- **Never** show cost estimates in Rondva copy or UI (owner decision 2026-09-25).
- No email-code login (owner decision 2026-09-26); sign-in is Apple / Google.
- Never show an Icelandic screenshot on rondva.com.
- The report article/PDF (`src/components/report/**`, `src/lib/report/**`) is frozen and pixel-identical; it is
  the customer's document, not a marketing surface.
- Above-the-fold content must render without JavaScript.

## Brand Commitments

- Name: Rondva. Operated by Vitvélar ehf., Reykjavík (reg. no. and address in `BRANDS.rondva`).
- Voice: plain, direct, honest about limits; speaks to a working professional, never hypey. Sentence case.
  "You stay the author of every judgement in it." No superlatives the evidence does not support. *(inferred from
  approved copy)*
- Founder is visible: Hjalti Sigmundsson, hjalti@rondva.com. Contact: rondva@rondva.com.
- Logo and mark: `public/rondva/logo.svg`, `mark.svg` (+ white variants). Hero film: `public/rondva/hero/**`.
- Visual system already documented in `DESIGN.md` (Rondva section) and `src/components/rondva/ui.ts`.

## Evidence on Hand

- One real customer case (anonymous, permission 2026-10-09): a Reykjavík pre-purchase inspection firm writes every
  report in Rondva; a typical write-up went from ~3 h 40 min to ~30 min.
- Real AI-generated sample reports: `public/rondva/sample-nzs4306.pdf`, `sample-report-au.pdf`,
  `sample-home-inspection-us.pdf`, `sample-home-inspection-ca.pdf`.
- Real English app screenshots (NZ release): `public/rondva/screens/*.webp`.
- **Absent, must not be fabricated:** testimonials with names, customer logos, star ratings, review counts, user
  numbers, press, certifications, accuracy percentages, NZ-local customers.

## Product Principles

1. The inspector's judgement is sacred; every claim about AI must be true in code.
2. Show the real report, not adjectives: the sample PDF is the strongest proof we have.
3. One decision per visit: get the app (or set up the company account). Purchases stay in the app.
4. Honest numbers only: prices from `rondva-pricing.ts`, one real time-saving figure, nothing invented.
5. Built for one-person operations: no enterprise language, no sales-call funnels.

## Accessibility & Inclusion

WCAG 2.2 AA floor as written in `DESIGN.md` §9 (contrast, 44px targets, focus, reduced motion, one h1, no-JS
above the fold). Readers are often outdoors on a phone; small grey text is a real cost. *(inferred)*

---

## Beton (beton.is)

Icelandic marketing site and admin for Beton ehf., a pre-purchase property inspection firm in Iceland (the first
Rondva customer). Icelandic only, its own palette and type (see `DESIGN.md`). Not covered by this record beyond that.
