import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bóka ástandsskoðun í Reykjavík og nágrenni",
  description:
    "Bókaðu ástandsskoðun fasteigna hjá Beton ehf. á höfuðborgarsvæðinu. Fagleg skoðun með ítarlegri skýrslu.",
  alternates: { canonical: "https://beton.is/skodun" },
};

function NavBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-10 h-10 border border-concrete-dk bg-transparent text-base text-ink hover:bg-paper-alt transition-colors">
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  last,
}: {
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline py-3.5 ${
        last ? "" : "border-b border-paper/12"
      }`}
    >
      <span className="text-[13px] text-paper/60">{label}</span>
      <span
        className={`${
          muted ? "text-[13px] text-paper/60 font-normal" : "text-[15px] text-paper font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Skodun() {
  // December 2026 calendar
  const days = ["M", "Þ", "M", "F", "F", "L", "S"];
  const cells: { d?: number; empty?: boolean; booked?: boolean; selected?: boolean; disabled?: boolean }[] = [];
  for (let i = 0; i < 1; i++) cells.push({ empty: true });
  for (let d = 1; d <= 31; d++) {
    const wd = d % 7;
    const isWeekend = wd === 5 || wd === 6;
    cells.push({
      d,
      booked: [3, 7, 14, 18, 22].includes(d),
      selected: d === 11,
      disabled: isWeekend || d < 4,
    });
  }
  const slots = ["09:00", "11:00", "13:30", "15:30"];

  return (
    <>
      {/* Intro */}
      <section className="px-6 lg:px-14 pt-16 lg:pt-20 pb-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24">
            <div>
              <Eyebrow>Bóka skoðun</Eyebrow>
              <div className="text-xs text-fog font-mono mt-12 lg:mt-14 tracking-[0.08em]">
                Skref 1 / 3
                <br />
                Veldu dagsetningu
              </div>
            </div>
            <div>
              <h1 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Bóktu skoðun á þeim degi sem hentar þér.
              </h1>
              <p className="text-[17px] leading-[1.55] text-fog max-w-[640px]">
                Skoðanir fara fram virka daga frá 09:00 til 15:30. Bókun er staðfest með
                tölvupósti innan 24 klst.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section className="px-6 lg:px-14 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px] grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Calendar */}
          <div className="bg-paper border border-concrete-dk p-6 md:p-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase mb-1.5">
                  Dagatal
                </div>
                <div className="text-[26px] font-medium tracking-[-0.015em]">Desember 2026</div>
              </div>
              <div className="flex gap-1">
                <NavBtn>←</NavBtn>
                <NavBtn>→</NavBtn>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => (
                <div
                  key={`day-${i}`}
                  className="text-center py-2 text-[11px] font-mono tracking-[0.12em] text-fog uppercase"
                >
                  {d}
                </div>
              ))}
              {cells.map((c, i) => {
                if (c.empty) return <div key={`empty-${i}`} />;
                const cls = c.selected
                  ? "bg-ink text-paper border-0"
                  : c.booked
                    ? "bg-copper/[0.12] text-ink border border-concrete"
                    : c.disabled
                      ? "text-concrete-dk border border-concrete cursor-not-allowed"
                      : "text-ink border border-concrete hover:border-ink cursor-pointer";
                return (
                  <div
                    key={`cell-${i}`}
                    className={`aspect-square flex flex-col items-center justify-center text-base font-medium relative ${cls}`}
                  >
                    <div>{c.d}</div>
                    {c.booked && !c.selected && (
                      <div className="w-1 h-1 rounded-full bg-copper mt-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="mt-10 pt-8 border-t border-concrete">
              <div className="flex justify-between items-baseline mb-5">
                <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase">
                  Lausir tímar — föstudagur 11. des.
                </div>
                <div className="text-[13px] text-fog">4 tímar lausir</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {slots.map((s, i) => (
                  <div
                    key={s}
                    className={`py-4 text-center font-mono text-base font-medium cursor-pointer ${
                      i === 1
                        ? "border border-ink bg-ink text-paper"
                        : "border border-concrete-dk text-ink hover:border-ink"
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-4">
            <div className="bg-ink text-paper p-8">
              <div className="font-mono text-[11px] tracking-[0.12em] text-copper uppercase mb-6">
                Bókunaryfirlit
              </div>
              <SummaryRow label="Dagsetning" value="11. desember 2026" />
              <SummaryRow label="Tími" value="11:00" />
              <SummaryRow label="Áætluð lengd" value="2–3 klst." />
              <SummaryRow label="Þrep" value="Velja eftir m²" muted />
              <SummaryRow label="Verð" value="Frá 129.900 kr." last />

              <a
                href={`mailto:${COMPANY.email}`}
                className="mt-6 w-full px-6 py-4 bg-paper text-ink text-[14.5px] font-semibold flex justify-between items-center"
              >
                <span>Halda áfram</span>
                <span>→</span>
              </a>
            </div>

            <div className="bg-paper-alt p-7">
              <div className="text-[13px] text-fog leading-[1.6]">
                <strong className="text-ink font-semibold">Þarftu hjálp við bókun?</strong>
                <br />
                Sendu okkur línu á{" "}
                <Link
                  href={`mailto:${COMPANY.email}`}
                  className="text-ink border-b border-ink"
                >
                  {COMPANY.email}
                </Link>{" "}
                og við finnum tíma sem hentar.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
