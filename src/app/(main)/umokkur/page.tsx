import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { betonPageMetadata } from "@/lib/beton-metadata";
import { btn } from "@/lib/ui";

export const metadata: Metadata = betonPageMetadata({
  title: "Um okkur — Bragi Michaelsson, húsaskoðunarmaður",
  description:
    "Kynntu þér Beton ehf. og stofnanda fyrirtækisins, Braga Michaelsson. Húsasmíðameistari með áralanga reynslu í byggingageiranum á Íslandi og í Danmörku.",
  path: "/umokkur",
});

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
    <h2 className="mb-7 border-b border-concrete-dk pb-4 text-label font-semibold uppercase text-navy">
      {children}
    </h2>
  );
}

export default function UmOkkur() {
  return (
    <section className="px-6 pt-20 pb-20 lg:px-14 lg:pt-28 lg:pb-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[1.55fr_1fr] lg:gap-20">
          {/* Left: bio + Menntun + Námskeið */}
          <div>
            <h1 className="mb-10 text-h1 font-medium text-ink">Bragi Michaelsson</h1>
            <div className="mb-10 max-w-[640px] space-y-4 text-lead text-ink">
              <p>
                Bragi Michaelsson er með áralanga reynslu úr byggingageiranum bæði á
                Íslandi og í Danmörku.
              </p>
              <p>
                Störf hans hafa meðal annars falist í verkefnastjórnun
                byggingaverkefna, byggingaeftirliti, þakviðgerðum og smíðum.
              </p>
            </div>
            <div className="mb-16 flex flex-wrap items-center gap-4">
              <Link href="/samband" className={btn("primary", "lg")}>
                Hafa samband <span aria-hidden="true">→</span>
              </Link>
              <Link href="/verdskra" className={btn("secondary", "lg")}>
                Sjá verðskrá
              </Link>
            </div>

            {/* Menntun */}
            <div className="mb-16">
              <SectionLabel>Menntun</SectionLabel>
              <div>
                {educations.map((e, i) => (
                  <div
                    key={e.degree}
                    className={`grid grid-cols-1 gap-2 py-5 md:grid-cols-[1.2fr_1fr] md:gap-8 ${
                      i === 0 ? "" : "border-t border-concrete"
                    }`}
                  >
                    <div className="text-base font-medium leading-snug text-ink">
                      {e.degree}
                    </div>
                    <div className="text-sm leading-snug text-fog md:text-right">
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
                    className={`grid grid-cols-1 gap-2 py-5 md:grid-cols-[1.2fr_1fr] md:gap-8 ${
                      i === 0 ? "" : "border-t border-concrete"
                    }`}
                  >
                    <div className="text-base font-medium leading-snug text-ink">
                      {c.name}
                    </div>
                    <div className="text-sm leading-snug text-fog md:text-right">
                      {c.school}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: portrait — sticky on desktop, B&W */}
          <div className="order-first self-start lg:sticky lg:top-32 lg:order-last">
            <div className="relative aspect-4/5 overflow-hidden rounded-sharp bg-concrete shadow-xl">
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
