---
target: rondva.com landing page
total_score: 22
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 3
target_identity: "file:/Users/hjaltisigmundsson/Developer/VS Code/Beton/beton-web/src/app/(rondva)/rondva/page.tsx"
target_fingerprint: "sha256:7e1222b2d1a290297933c99d12ea8b4130f8f557f454e522afcba508874b694e"
target_path: /Users/hjaltisigmundsson/Developer/VS Code/Beton/beton-web/src/app/(rondva)/rondva/page.tsx
timestamp: 2026-10-29T11-27-46Z
slug: src-app-rondva-rondva-page-tsx
---
Method: dual-agent (A: design review, Opus · B: detector + browser, Sonnet)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Desktop hero film shows an empty blueprint frame ~2 s before first scene |
| 2 | Match System / Real World | 3 | Inspector vocabulary strong; NZ/AU readers get US$ headline prices |
| 3 | User Control and Freedom | 3 | Film pause, equal "Essential only" consent choice |
| 4 | Consistency and Standards | 2 | Severity vocabulary drifts (film vs screenshot); "get the app" in 3 forms; pricing baselines misaligned; arbitrary text-[Npx] |
| 5 | Error Prevention | 3 | Honest terms ("Nothing can be bought on this page") |
| 6 | Recognition Rather Than Recall | 2 | Trial rules in one ~60-word sentence |
| 7 | Flexibility and Efficiency | n/a | One-visit marketing page |
| 8 | Aesthetic and Minimalist Design | 2 | 11,164 px on mobile (13 screens); "edits are free" said 5×, "bought in app" 3× |
| 9 | Error Recovery | 2 | Non-iPhone path is an email at the very bottom |
| 10 | Help and Documentation | 2 | No FAQ on home (exists on /nz) |
| **Total** | | **22/36** | Acceptable (61%) |

## Design Specificity Verdict
LLM: copy is authored for inspectors; structure is a stock SaaS template (glow blob hero, eyebrow+H2 every section, 5 icon tiles, 3-tier pricing with dark Recommended card). The product's output, the drafted report, never appears on the page.
Deterministic: 1 advisory, codex-grid-background at src/app/(rondva)/rondva.css:113 (+ .rv-blueprint-light :122). Brand texture, low contrast, kept as incumbent identity. Components clean. Overlay injection failed (Playwright never fetched localhost script from HTTPS page).

## Priority Issues
- [P1] Drafted report never shown on the page; proof is a PDF download. Fix: note → report band after hero using real sample finding 9.2. (shape/craft)
- [P1] Hero CTA cluster overloaded (7 actions in first viewport), offer line buried in small grey text. Fix: badge + sample only, offer line promoted. (distill)
- [P1] Mobile length/section order: pricing at screen 10, Where the AI stops at screen 7; heavy repetition. Fix: drop "Who it's for", reorder, de-duplicate. (layout)
- [P2] Pricing undermines itself: Pro "Recommended" at same per-report price, pack blurb argues against itself, "Live now" badge, baseline misalignment. (clarify)
- [P2] No FAQ, no closing CTA; page ends on "Not on iPhone?". (onboard)

## Persona Red Flags
Jordan: can't see a drafted report without downloading a PDF; Log in / Create company account / Get the app order unclear.
Riley: Pro recommended at same unit price; only time-saving figure is one anonymous Reykjavík firm.
Casey: cookie banner covers CTAs; 13 screens; NZ link 17px tall.
NZ inspector from cold email: US$ prices + Reykjavík case; /nz is the better landing.

## Minor Observations
- Global "tnum" on body (rondva.css:69) widens hyphens in running text.
- Three decorative layers in hero (grid, grain, glow blob page.tsx:131).
- Severity vocabulary drift between film, overview-nz.webp and tokens.
- Founder shows initials, not a photo.
- Hero eyebrow orphans "STORE" on mobile.
- "Questions first?" links to privacy.

## Questions to Consider
- Why is "Where the AI stops", the core claim, section 5?
- Should the home page route cold-email visitors to their country page?
- Does Solo vs Pro belong here when the only decision is the free month?
