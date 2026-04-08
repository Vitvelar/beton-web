import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { SectionHeading } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Um okkur",
  description:
    "Kynntu þér Beton ehf. og stofnanda fyrirtækisins, Braga Michaelsson. Áratuga reynsla í byggingaiðnaði á Íslandi og í Danmörku.",
};

const education = [
  {
    title: "Húsasmíðameistari",
    institution: "Iðnskólinn í Hafnarfirði",
  },
  {
    title: "BSc. í Byggingafræði",
    institution: "KEA — Copenhagen School of Design and Technology",
  },
  {
    title: "Nám til löggildingar Fasteigna- og skipasala",
    institution: "Endurmenntun Háskóla Íslands",
  },
  {
    title: "MCF í Fjármálum fyrirtækja",
    institution: "Háskólinn í Reykjavík",
  },
  {
    title: "BSc. í Viðskiptafræði",
    institution: "Háskóli Íslands",
  },
];

const courses = [
  "Húsaskoðun og matstækni — Endurmenntun HÍ",
  "Frágangur votrýma I — Iðan fræðslusetur",
  "Raki og mygla í húsum — Iðan fræðslusetur",
  "Rakamælingar í byggingum — Iðan fræðslusetur",
  "Ábyrgð byggingastjóra — Iðan fræðslusetur",
  "Svansvottaðar byggingar — Iðan fræðslusetur",
];

export default function UmOkkur() {
  return (
    <>
      <HeroSection
        title="Um okkur"
        subtitle="Fagmennska, reynsla og traust í öndvegi."
        imageSrc="/images/about.jpg"
        imageAlt="Fagleg byggingarverkefni"
      />

      {/* Company description */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-lg mx-auto text-slate">
            <p className="text-xl leading-relaxed">
              Við sérhæfum okkur í ástandsskoðunum fasteigna og veitum faglega
              og hlutlausa ráðgjöf fyrir bæði kaupendur og seljendur.
            </p>
            <p className="leading-relaxed">
              Við leggjum áherslu á vandaða vinnubrögð, nákvæma skjalfestingu og
              gæðaþjónustu. Með reynslu úr byggingaiðnaðinum metum við eignir og
              greinum helstu áhættuþætti með faglegum aðferðum.
            </p>
            <p className="leading-relaxed">
              Við trúum því að traust og gagnsæi skipti öllu máli. Okkar markmið
              er að útskýra niðurstöður á skýru og aðgengilegu máli svo viðskiptavinir
              okkar geti tekið upplýsta ákvörðun.
            </p>
          </div>
        </div>
      </section>

      {/* Founder profile */}
      <section className="py-24 px-6 bg-light-gray">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            title="Bragi Michaelsson"
            subtitle="Stofnandi og húsaskoðunarmaður"
          />

          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-slate leading-relaxed mb-12 text-center">
              Bragi hefur áratuga reynslu í byggingaiðnaðinum á Íslandi og í
              Danmörku. Hann hefur starfað við verkefnastjórnun, byggingareftirlit,
              þakviðgerðir og framkvæmdir.
            </p>

            {/* Education */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-charcoal mb-6">Menntun</h3>
              <div className="space-y-4">
                {education.map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl p-5 ring-1 ring-gray-200"
                  >
                    <p className="font-semibold text-charcoal">{item.title}</p>
                    <p className="text-sm text-slate mt-1">{item.institution}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div>
              <h3 className="text-2xl font-bold text-charcoal mb-6">Námskeið</h3>
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course}
                    className="bg-white rounded-xl p-5 ring-1 ring-gray-200"
                  >
                    <p className="text-charcoal">{course}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
