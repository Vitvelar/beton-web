import type { Metadata } from "next";
import Image from "next/image";
import { Eyebrow, NumberedDivider } from "@/components/Editorial";

export const metadata: Metadata = {
  title: "Um okkur — Bragi Michaelsson, húsaskoðunarmaður",
  description:
    "Kynntu þér Beton ehf. og stofnanda fyrirtækisins, Braga Michaelsson. Húsasmíðameistari með áratuga reynslu í byggingaiðnaði á Íslandi og í Danmörku.",
  alternates: { canonical: "https://beton.is/umokkur" },
};

const educations = [
  { year: "1998", degree: "Húsasmíðameistari", school: "Iðnskólinn í Hafnarfirði" },
  { year: "2003", degree: "BSc Byggingafræði", school: "KEA Copenhagen" },
  { year: "2008", degree: "Nám til löggildingar Fasteigna- og skipasala", school: "Endurmenntun HÍ" },
  { year: "2014", degree: "MCF í Fjármálum fyrirtækja", school: "Háskólinn í Reykjavík" },
  { year: "2019", degree: "BSc Viðskiptafræði", school: "Háskóli Íslands" },
];

const courses = [
  "Húsaskoðun",
  "Frágangur votrýma",
  "Raki og mygla",
  "Rakamælingar",
  "Ábyrgð byggingastjóra",
  "Svansvottaðar byggingar",
];

const values = [
  {
    t: "Hlutleysi",
    b: "Engin hagsmunatengsl við kaupanda, seljanda eða fasteignasala. Skýrslan endurspeglar húsið — ekki samninginn.",
  },
  {
    t: "Mæling fram yfir mat",
    b: "Þar sem hægt er að mæla, er mælt: rakamælar, hitamyndavél, hallamælar. Tölurnar fylgja athugasemdunum.",
  },
  {
    t: "Skýrt orðalag",
    b: "Athugasemdir flokkaðar í þrjú alvarleikastig með skýrum tillögum að úrbótum. Ekkert tæknimál án skýringar.",
  },
];

export default function UmOkkur() {
  return (
    <>
      {/* Intro */}
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 items-start">
            <div>
              <Eyebrow>Um okkur</Eyebrow>
              <div className="text-xs text-fog font-mono mt-12 lg:mt-16 tracking-[0.08em]">
                Stofnað 2025
                <br />
                Hafnarfjörður, ÍS
              </div>
            </div>
            <div>
              <h1 className="text-[44px] lg:text-[64px] leading-none font-medium tracking-[-0.03em] mb-12 text-balance">
                Fyrirtæki sem byggir
                <br />
                á <span className="italic-accent">tveimur áratugum</span>
                <br />
                af reynslu og námi.
              </h1>
              <div className="text-lg leading-[1.6] text-ink/85 max-w-[720px] space-y-5">
                <p>
                  Beton ehf. var stofnað til þess að bjóða upp á eina af því sem mest er
                  þörf á í íslenska fasteignamarkaðinum: hlutlausa, faglega ástandsskoðun
                  framkvæmda af einstaklingi sem hefur bæði verkkunnáttu húsasmíðameistara
                  og fræðilega þekkingu byggingafræðings.
                </p>
                <p>
                  Við skoðum húsið eins og við værum að kaupa það sjálf — og við skrifum
                  skýrsluna eins og við ætluðum að lifa með afleiðingunum.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder profile */}
      <section className="px-6 lg:px-14 py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-16">
            <div>
              <div className="relative aspect-[4/5] rounded-[2px] overflow-hidden bg-concrete">
                <Image
                  src="/images/about.jpg"
                  alt="Bragi Michaelsson, stofnandi Beton ehf."
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-paper/92 backdrop-blur-sm">
                  <div className="text-[11px] font-mono tracking-[0.1em] text-fog uppercase">
                    Stofnandi · Skoðunarmaður
                  </div>
                  <div className="text-[22px] font-medium text-ink mt-1.5 tracking-[-0.01em]">
                    Bragi Michaelsson
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Eyebrow>Stofnandi</Eyebrow>
              <h2 className="text-[32px] lg:text-[44px] leading-[1.05] font-medium tracking-[-0.025em] mt-5 mb-8">
                Húsasmíðameistari, byggingafræðingur, viðskiptafræðingur.
              </h2>
              <p className="text-[16.5px] leading-[1.65] text-ink/80 mb-14 max-w-[620px]">
                Bragi byrjaði ferilinn sinn á byggingastað, lærði iðnina sjálfa frá grunni
                og bætti síðar við fræðilegri þekkingu — fyrst í Kaupmannahöfn, síðan í
                Reykjavík. Þessi blanda af handverki, fræðum og rekstrarþekkingu er það
                sem gerir Beton einstakt.
              </p>

              <NumberedDivider n="01" label="Menntun" />
              <div className="flex flex-col">
                {educations.map((e, i) => (
                  <div
                    key={e.degree}
                    className={`grid grid-cols-1 md:grid-cols-[80px_1fr_200px] gap-4 md:gap-6 py-5 items-baseline ${
                      i === 0 ? "" : "border-t border-concrete"
                    }`}
                  >
                    <div className="font-mono text-xs text-copper tracking-[0.05em]">
                      {e.year}
                    </div>
                    <div className="text-[17px] font-medium text-ink">{e.degree}</div>
                    <div className="text-[13.5px] text-fog md:text-right">{e.school}</div>
                  </div>
                ))}
              </div>

              <div className="mt-16 lg:mt-20">
                <NumberedDivider n="02" label="Fagnámskeið" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                  {courses.map((c, i) => (
                    <div key={c} className="flex items-center gap-3 text-[15px] text-ink">
                      <span className="font-mono text-[11px] text-fog tracking-[0.05em] min-w-6">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values band */}
      <section className="bg-paper-alt px-6 lg:px-14 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <Eyebrow>Vinnubrögð</Eyebrow>
          <h2 className="text-[36px] lg:text-[48px] leading-[1.05] font-medium tracking-[-0.03em] mt-5 mb-16 max-w-[800px]">
            Þrjár reglur sem skoðun Beton hvílir á.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {values.map((v, i) => (
              <div key={v.t}>
                <div className="text-[56px] font-medium text-copper leading-none mb-6 font-mono tracking-[-0.02em]">
                  0{i + 1}
                </div>
                <h3 className="text-[22px] font-medium tracking-[-0.015em] mb-3.5">{v.t}</h3>
                <p className="text-[15px] leading-[1.65] text-fog">{v.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
