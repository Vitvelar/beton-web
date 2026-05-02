import type { Metadata } from "next";
import { Eyebrow } from "@/components/Editorial";

export const metadata: Metadata = {
  title: "Skilmálar",
  description:
    "Skilmálar og fyrirvarar ástandsskoðunar Beton ehf. Lestu um umfang skoðunar, takmarkanir ábyrgðar og greiðsluskilmála.",
  alternates: { canonical: "https://beton.is/skilmalar" },
};

const sections = [
  {
    n: "01",
    title: "Markmið",
    body: "Markmið ástandsskoðunar er að veita kaupanda eða eiganda fasteignar hlutlausa og faglega úttekt á sýnilegu ástandi eignarinnar á skoðunardegi. Skoðunin er ekki ætluð sem trygging gegn framtíðarbilunum né jafngildir hún ítarlegri tæknilegri úttekt á burðarvirki.",
  },
  {
    n: "02",
    title: "Umfang",
    body: "Skoðun nær til sýnilegra hluta innanhúss og utanhúss, þar á meðal gólfa, veggja, lofta, glugga, hurða, þaks (þar sem örugglega er hægt að skoða), kjallara, bílskúrs og garðs. Lagnir og raflagnir eru skoðaðar sjónrænt og prófaðar í þeim mæli sem aðstæður leyfa.",
  },
  {
    n: "03",
    title: "Það sem ekki er hluti",
    body: "Skoðun felur ekki í sér að taka upp gólfefni, opna veggi eða loft, eða framkvæma eyðileggjandi prófanir. Hún felur ekki í sér úttekt á asbesti, myglusveppum með rannsóknarstofuprófum, hávaðamælingum eða lögfræðilegum athugunum á eignarheimildum.",
  },
  {
    n: "04",
    title: "Rakamælingar",
    body: "Rakamælingar eru framkvæmdar með kvörðuðum rakamælum á völdum stöðum þar sem grunur leikur á raka eða þar sem byggingareðli kallar á slíka mælingu. Niðurstöður eru leiðbeinandi og endurspegla ástand á skoðunardegi.",
  },
  {
    n: "05",
    title: "Framkvæmd",
    body: "Skoðun er framkvæmd af húsasmíðameistara og byggingafræðingi. Skoðunarmaður kemur með nauðsynleg verkfæri og ljósmyndar allar athugasemdir. Eigandi eða umboðsmaður skal vera viðstaddur eða hafa veitt aðgang að öllum rýmum.",
  },
  {
    n: "06",
    title: "Skýrslugerð",
    body: "Skrifleg skýrsla er afhent á rafrænu formi (PDF) innan 5 virkra daga frá skoðun. Skýrslan inniheldur lýsingu á eign, athugasemdir flokkaðar eftir alvarleikastigi, ljósmyndir, mælingar og tillögur að úrbótum þar sem við á.",
  },
  {
    n: "07",
    title: "Takmörkun ábyrgðar",
    body: "Ábyrgð Beton ehf. takmarkast við vinnu og skýrslugerð á skoðunardegi. Beton ehf. ber ekki ábyrgð á göllum sem ekki eru sýnilegir, eru huldir á bak við klæðningar eða innréttingar, eða koma fram síðar vegna venjulegrar slits eða notkunar.",
  },
  {
    n: "08",
    title: "Öryggi",
    body: "Öryggi skoðunarmanns hefur forgang. Þök eru aðeins skoðuð þar sem örugglega er hægt að komast að þeim án sérstaks öryggisbúnaðar. Þar sem það er ekki mögulegt er framkvæmd sjónræn úttekt frá jörðu eða með dróna eftir samkomulagi.",
  },
  {
    n: "09",
    title: "Frekari athuganir",
    body: "Þegar þörf krefur er mælt með frekari athugunum sérfræðinga (t.d. pípulagningameistara, rafvirkjameistara eða burðarþolsverkfræðings). Slíkar athuganir eru ekki innifaldar í verði ástandsskoðunar.",
  },
  {
    n: "10",
    title: "Hlutleysi",
    body: "Beton ehf. hefur engin fjárhagsleg eða önnur tengsl við seljendur, fasteignasala eða aðra hagsmunaaðila. Skoðunarmaður tjáir sig um eignina út frá fagmennsku einni saman.",
  },
  {
    n: "11",
    title: "Greiðsla",
    body: "Greiðsla fyrir skoðun fer fram að lokinni skoðun og fyrir afhendingu skýrslu. Greitt er með millifærslu samkvæmt reikningi sem sendur er á netfang viðskiptavinar. Reikningur er gjalddagi við móttöku.",
  },
];

export default function Skilmalar() {
  return (
    <>
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24">
            <div>
              <Eyebrow>Skilmálar</Eyebrow>
              <div className="text-xs text-fog font-mono mt-12 lg:mt-14 tracking-[0.08em]">
                Síðast uppfært
                <br />
                01.01.2026
              </div>
            </div>
            <div>
              <h1 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Almennir skilmálar fyrir ástandsskoðun.
              </h1>
              <p className="text-[17px] leading-[1.55] text-fog max-w-[640px]">
                Eftirfarandi skilmálar gilda um alla ástandsskoðun framkvæmda af Beton ehf.
                Skilmálar eru hluti af samningi á milli viðskiptavinar og Beton ehf.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TOC + sections */}
      <section className="px-6 lg:px-14 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 items-start">
            {/* Sticky TOC */}
            <div className="md:sticky md:top-32">
              <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase mb-5 pb-4 border-b border-concrete-dk">
                Efnisyfirlit
              </div>
              <div className="flex flex-col gap-3">
                {sections.map((s) => (
                  <a
                    key={s.n}
                    href={`#sect-${s.n}`}
                    className="grid grid-cols-[32px_1fr] gap-3 text-sm text-ink hover:text-navy py-1"
                  >
                    <span className="font-mono text-[11px] text-copper tracking-[0.05em]">
                      {s.n}
                    </span>
                    <span>{s.title}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              {sections.map((s, i) => (
                <div
                  key={s.n}
                  id={`sect-${s.n}`}
                  className={`py-10 ${i === sections.length - 1 ? "" : "border-b border-concrete"} ${i === 0 ? "pt-0" : ""}`}
                >
                  <div className="flex items-baseline gap-5 mb-4">
                    <span className="font-mono text-[13px] text-copper tracking-[0.05em] min-w-[32px]">
                      {s.n}
                    </span>
                    <h2 className="text-[26px] font-medium tracking-[-0.015em] m-0 text-ink">
                      {s.title}
                    </h2>
                  </div>
                  <p className="text-base leading-[1.7] text-ink/85 m-0 pl-[52px] max-w-[720px]">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
