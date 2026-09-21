# Bragi report feedback — 21 September 2026

- Report generation now requests a coherent executive conclusion based on the whole inspection: related findings, implications, priority actions and uncertainty, rather than a room/observation/severity roll-call. Urgent safety findings must not be omitted. The existing AI call is reused; there is no extra model pass or provider change.
- Report dates and download names use `dd.mm.yyyy`, preserving the recorded calendar day across device/server time zones. The same helper is present in mobile inspection and estimate exporters. AI introduction instructions use this format too.
- Web reports bundle static Noto Sans regular/bold under the OFL license. Report rendering waits for both fonts and fails on missing assets instead of silently printing fallback glyphs. Marketing typography is unchanged.

Validation: production Next build, TypeScript, scoped ESLint; synthetic real report-page/production-PDF-renderer check (`node scripts/verify-report-format.cjs`, after build, requires Chrome plus Poppler); extracted Þak and every Icelandic accented letter, embedded Unicode fonts, date/filename edge cases and missing-font failure. Web/mobile prompt/date parity is checked when sibling beton-app checkout is present. PDF summary and roof pages were visually inspected. Mobile local-PDF checks also pass.

AI output quality has not yet been evaluated on a newly generated customer report; the synthetic fixture is a rendering test, not evidence of model quality. Canva import was not tested. Existing stored PDFs and manually edited summaries are not rewritten automatically. PDF-only regeneration applies typography/date changes while retaining saved report prose; a new AI generation uses the revised summary instructions and can overwrite manual report text.

The optional legacy beton-pdf Python service is not part of this rollout. The active queued PDF worker uses the Next report page and Chromium renderer. Native date changes require a new app build; server-side changes do not.
