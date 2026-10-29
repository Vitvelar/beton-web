import { SAMPLE_REPORT_URL, HAS_SAMPLE } from "@/lib/rondva-links";
import { SectionHeading } from "@/components/rondva/SectionHeading";

// „Frá glósu til skýrslu“: ein raunveruleg athugasemd úr sýnisskýrslunni (sample-nzs4306.pdf, bls. 13,
// athugasemd 9.2). Vinstra megin er nákvæmlega það sem skoðunarmaðurinn sló inn
// (plan/rondva/sample-reports/nz-spec.mjs, „bath-1“), hægra megin textinn sem Rondva skrifaði
// (sami texti og í PDF-inu). Ef sýnisskýrslan er endurgerð verður að uppfæra báða textana hér.
const SAMPLE_PAGE = 13;

function Reading() {
  return <mark className="rounded-sm bg-blue/10 px-1 font-semibold text-ink">24% WME</mark>;
}

function Rating() {
  return <span className="rv-sev shrink-0 bg-surface text-sev-severe">Significant defect</span>;
}

export function NoteToReport() {
  return (
    <section aria-labelledby="note-title" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeading id="note-title" eyebrow="From your note to the report">
          You write the note. <em>Rondva writes the finding.</em>
        </SectionHeading>
        <p className="rv-reveal mt-6 max-w-2xl text-lg leading-relaxed text-muted" style={{ "--i": 1 } as React.CSSProperties}>
          No more evenings retyping site notes into a document. You type a few words on site, meter still in
          hand, and Rondva drafts the finding your client reads. This one is from our sample NZS 4306 report,
          for a fictional property.
        </p>

        <div className="mt-12 grid items-stretch gap-3 md:gap-6 md:grid-cols-[minmax(0,0.85fr)_auto_minmax(0,1.15fr)]">
          {/* Það sem skoðunarmaðurinn skráði */}
          <figure className="rv-reveal flex flex-col rounded-card border border-line bg-paper-alt p-6 sm:p-7" style={{ "--i": 0 } as React.CSSProperties}>
            <figcaption className="text-sm font-semibold text-ink">What you recorded on site</figcaption>
            <div className="mt-5 flex flex-1 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">Bathroom · Moisture</p>
                <Rating />
              </div>
              <p className="mt-4 leading-relaxed text-ink">
                Thermal image shows cool area at base of shower wall beside mixer. Meter (non-invasive) <Reading /> there.
                Grout cracked, silicone at tray failed.
              </p>
              <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">Next step:</span> Specialist invasive moisture testing, then
                repair shower waterproofing and any damaged framing.
              </p>
            </div>
          </figure>

          <div className="flex items-center justify-center text-blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6 rotate-90 md:h-7 md:w-7 md:rotate-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15m-5-6 6 6-6 6" />
            </svg>
          </div>

          {/* Það sem Rondva skrifaði — eins og í skýrslunni */}
          <figure className="rv-reveal flex flex-col rounded-card border border-line bg-surface p-6 shadow-sm sm:p-7" style={{ "--i": 1 } as React.CSSProperties}>
            <figcaption className="text-sm font-semibold text-ink">What Rondva drafted for the report</figcaption>
            <div className="mt-5 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-semibold leading-snug text-ink">
                  <span className="rv-tnum mr-2 text-blue">9.2</span>Elevated moisture at base of shower wall
                </p>
                <Rating />
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Moisture</p>
              <p className="mt-4 leading-relaxed text-ink">
                Thermal imaging showed a cool area at the base of the shower wall beside the mixer, and a non-invasive
                meter recorded <Reading /> at this location. The grout is cracked and the silicone at the tray has
                failed, indicating moisture entering the wall structure.
              </p>
              <p className="mt-4 rounded-lg bg-paper-alt p-4 text-sm leading-relaxed text-ink">
                <span className="font-semibold text-blue">Recommendation:</span> Arrange specialist invasive moisture
                testing, then repair the shower waterproofing and any damaged framing. This should be undertaken by a
                suitably qualified specialist.
              </p>
            </div>
          </figure>
        </div>

        <ul className="rv-reveal mt-8 grid gap-x-10 gap-y-4 text-base leading-snug text-ink sm:grid-cols-3" style={{ "--i": 2 } as React.CSSProperties}>
          {[
            "Your rating comes through unchanged. The AI can’t alter it.",
            "24% WME is the number you entered. Figures must match your notes.",
            "Every word is yours to change before the report leaves the app.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <svg viewBox="0 0 20 20" className="mt-px h-5 w-5 shrink-0 text-blue" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m4 10.5 4 4 8-9" />
              </svg>
              {line}
            </li>
          ))}
        </ul>

        {HAS_SAMPLE ? (
          <p className="rv-reveal mt-8" style={{ "--i": 3 } as React.CSSProperties}>
            <a
              href={`${SAMPLE_REPORT_URL}#page=${SAMPLE_PAGE}`}
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue underline-offset-4 hover:underline"
            >
              Read the whole sample report (PDF, page {SAMPLE_PAGE})
              <span aria-hidden="true">→</span>
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
