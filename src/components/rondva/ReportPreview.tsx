// Sýnishorn af skýrslusíðu, teiknað í HTML. Sýnir uppbygginguna sem Rondva
// skilar (rými → athugun → alvarleiki með texta → kostnaðarmat). Efnið er
// tilbúið dæmi; engin raunveruleg eign.
export function ReportPreview({ className }: { className?: string }) {
  return (
    <div
      className={`relative rounded-[10px] bg-white text-ink shadow-[0_30px_80px_-20px_rgba(16,20,24,0.45)] ring-1 ring-ink/10 ${className ?? ""}`}
      aria-label="Example page from a Rondva report"
    >
      <div className="px-7 pt-7 pb-6 sm:px-9 sm:pt-9">
        <div className="flex items-start justify-between gap-6 border-b border-line pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Inspection report · Page 7 of 19
            </div>
            <div className="mt-1 font-serif text-[22px] font-semibold leading-tight tracking-tight">
              Bathroom, first floor
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-1.5 text-[10px] font-medium text-muted">
            <span className="h-3.5 w-3.5 rounded-sm bg-ink/80" aria-hidden="true" />
            Your logo
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_1.15fr] gap-5">
          <div className="space-y-2">
            <div className="aspect-[4/3] w-full rounded-md bg-[linear-gradient(135deg,#e8ecf0,#cfd6de)]" aria-hidden="true" />
            <div className="aspect-[4/3] w-full rounded-md bg-[linear-gradient(135deg,#1c2d5a_0%,#3f5cc4_35%,#e2b64a_70%,#c0392b_100%)] opacity-90" aria-hidden="true" />
            <div className="text-[9px] text-muted">Photo 12 · Thermal 12b — 14:32</div>
          </div>
          <div className="text-[12px] leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="rv-sev text-[#C2571F]">Significant</span>
              <span className="text-[10px] text-muted">Observation 7.2</span>
            </div>
            <p className="mt-2 font-serif text-[15px] font-semibold leading-snug">
              Moisture behind the shower wall
            </p>
            <p className="mt-1.5 text-muted">
              Thermal image shows a cold band along the lower tile course, consistent with
              moisture ingress at the shower tray joint. Surface reading 19.2 % at the
              skirting. Grout is cracked in two places.
            </p>
            <p className="mt-2 text-ink">
              <span className="font-semibold">Recommendation.</span> Re-seal the tray
              joint and regrout; verify the substrate before retiling.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-md bg-paper-alt px-3 py-2 rv-tnum">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Cost estimate</span>
              <span className="text-[13px] font-semibold">€ 1,200 – 1,800</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-[9px] text-muted">
          <span>Severity set by the inspector. Text drafted by Rondva, reviewed before export.</span>
          <span className="rv-tnum">7 / 19</span>
        </div>
      </div>
    </div>
  );
}
