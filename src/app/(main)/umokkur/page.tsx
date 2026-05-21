import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Um okkur — Bragi Michaelsson, húsaskoðunarmaður",
  description:
    "Kynntu þér Beton ehf. og stofnanda fyrirtækisins, Braga Michaelsson. Húsasmíðameistari með áralanga reynslu í byggingageiranum á Íslandi og í Danmörku.",
  alternates: { canonical: "https://beton.is/umokkur" },
};

const educations = [
  { degree: "Húsasmíðameistari", school: "Iðnskólinn í Hafnarfirði" },
  {
    degree: "BSc. í Byggingafræði",
    school: "KEA – Copenhagen School of Design and Technology",
  },
  {
    degree: "Nám til löggildingar Fasteigna- og skipasala",
    school: "Endurmenntun Háskóla Íslands",
  },
  { degree: "MCF í Fjármálum fyrirtækja", school: "Háskólinn í Reykjavík" },
  { degree: "BSc. í Viðskiptafræði", school: "Háskóli Íslands" },
];

const courses = [
  { name: "Húsaskoðun og matstækni", school: "Endurmenntun HÍ" },
  { name: "Frágangur votrýma I", school: "Iðan fræðslusetur" },
  { name: "Raki og mygla í húsum", school: "Iðan fræðslusetur" },
  { name: "Rakamælingar í byggingum", school: "Iðan fræðslusetur" },
  { name: "Ábyrgð byggingastjóra", school: "Iðan fræðslusetur" },
  { name: "Svansvottaðar byggingar", school: "Iðan fræðslusetur" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] tracking-[0.18em] uppercase font-semibold text-navy mb-7 pb-4 border-b border-concrete-dk">
      {children}
    </h3>
  );
}

export default function UmOkkur() {
  return (
    <section className="px-6 lg:px-14 pt-20 lg:pt-28 pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-14 lg:gap-20 items-start">
          {/* Left: bio + Menntun + Námskeið */}
          <div>
            <h1 className="text-[44px] lg:text-[64px] leading-[1.02] font-medium tracking-[-0.025em] text-ink mb-10">
              Bragi Michaelsson
            </h1>
            <div className="text-[17.5px] leading-[1.7] text-ink/85 space-y-4 mb-16 max-w-[640px]">
              <p>
                Bragi Michaelsson er með áralanga reynslu úr byggingageiranum bæði á
                Íslandi og í Danmörku.
              </p>
              <p>
                Störf hans hafa meðal annars falist í verkefnastjórnun
                byggingaverkefna, byggingaeftirliti, þakviðgerðum og smíðum.
              </p>
            </div>

            {/* Menntun */}
            <div className="mb-16">
              <SectionLabel>Menntun</SectionLabel>
              <div>
                {educations.map((e, i) => (
                  <div
                    key={e.degree}
                    className={`grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-2 md:gap-8 py-5 ${
                      i === 0 ? "" : "border-t border-concrete"
                    }`}
                  >
                    <div className="text-[16.5px] font-medium text-ink leading-[1.4]">
                      {e.degree}
                    </div>
                    <div className="text-[14.5px] text-fog md:text-right leading-[1.4]">
                      {e.school}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Námskeið */}
            <div>
              <SectionLabel>Námskeið</SectionLabel>
              <div>
                {courses.map((c, i) => (
                  <div
                    key={c.name}
                    className={`grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-2 md:gap-8 py-5 ${
                      i === 0 ? "" : "border-t border-concrete"
                    }`}
                  >
                    <div className="text-[16.5px] font-medium text-ink leading-[1.4]">
                      {c.name}
                    </div>
                    <div className="text-[14.5px] text-fog md:text-right leading-[1.4]">
                      {c.school}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: portrait — sticky on desktop, B&W */}
          <div className="lg:sticky lg:top-32 self-start order-first lg:order-last">
            <div className="relative aspect-[4/5] rounded-[2px] overflow-hidden bg-concrete shadow-[0_30px_60px_-30px_rgba(10,13,46,0.25)]">
              <Image
                src="/images/bragi.webp"
                alt="Bragi Michaelsson, stofnandi Beton ehf."
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
