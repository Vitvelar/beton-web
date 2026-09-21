import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Skoðunarappið — aðstoð og upplýsingar",
  description:
    "Stuðningssíða Beton skoðunarappsins. Um appið, aðgang, verkflæði á vettvangi og algeng úrlausnarefni — samstilling, myndavélarheimild og PDF-skýrslur.",
  alternates: { canonical: "https://beton.is/app" },
};

const workflow = [
  {
    n: "01",
    title: "Skoðun stofnuð",
    text: "Skoðunarmaður skráir heimilisfang, verkkaupa og dagsetningu. Opinberar upplýsingar um eignina sækjast sjálfkrafa úr fasteignaskrá þegar tenging er til staðar.",
  },
  {
    n: "02",
    title: "Rými og athugasemdir",
    text: "Farið er í gegnum eignina rými fyrir rými. Athugasemdir eru skráðar með lýsingu, tillögu og alvarleikamati.",
  },
  {
    n: "03",
    title: "Myndir",
    text: "Skoðunarmyndir eru teknar beint í appinu og hitamyndir fluttar inn úr myndasafni. Myndir tengjast rýmum og athugasemdum.",
  },
  {
    n: "04",
    title: "Skýrsla",
    text: "Ýtt er á „Búa til skýrslu“. Notandinn velur hvort AI aðstoðar við skýrslutextann (krefst nettengingar og staðfestingar) eða hvort skýrslan er unnin á tækinu án AI. Fullbúinni PDF-skýrslu má deila, vista eða senda í skjalasafn Beton.",
  },
];

const faq = [
  {
    q: "Virkar appið án nettengingar?",
    a: "Já. Allar skoðanir, athugasemdir og myndir vistast fyrst staðbundið á tækinu, svo hægt er að vinna heila skoðun án tengingar. Gögnin samstillast við skýjaþjónustuna þegar tenging næst og notandi er innskráður.",
  },
  {
    q: "Samstilling virðist ekki ganga",
    a: "Athugaðu nettengingu og að þú sért innskráð(ur) — í flipanum Stillingar á að standa „Tengt skýjaþjónustu“. Samstilling fer sjálfkrafa í gang þegar appið er opnað aftur. Ósamstilltar breytingar bíða á tækinu og samstillast þegar tenging og innskráning eru komnar í lag; ef staðan lagast ekki, hafðu samband.",
  },
  {
    q: "Myndavél eða myndasafn opnast ekki",
    a: "Appið þarf heimild fyrir myndavél (skoðunarmyndir) og myndasafn (hitamyndir). Ef heimild var hafnað: opnaðu Stillingar símans → Beton → leyfðu Myndavél og Myndir. Appið notar aðeins myndir sem þú tekur eða velur sjálf(ur).",
  },
  {
    q: "Skýrslan verður ekki til eða vantar AI-texta",
    a: "Skýrslu má búa til á tækinu án nettengingar, út frá skráðum athugasemdum og myndum. AI-aðstoð við textann og PDF af vefþjóni krefjast nettengingar, innskráningar og staðfestingar — ef sá hluti bregst reynir appið að ljúka skýrslunni með staðbundnu útgáfunni. Ef skýrslugerð stöðvast alveg: opnaðu skoðunina aftur og reyndu á ný, og hafðu samband ef það dugar ekki.",
  },
  {
    q: "Ég fæ ekki innskráningarkóða í tölvupósti",
    a: "Aðgangur er bundinn við samþykkt netföng á vegum Beton — netfang sem ekki hefur heimild fær ekki kóða. Athugaðu einnig ruslpóstmöppuna. Ef vandinn er viðvarandi, hafðu samband í netfangið hér að neðan.",
  },
];

export default function AppSupport() {
  return (
    <>
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24">
            <div>
              <Eyebrow>Skoðunarappið</Eyebrow>
            </div>
            <div>
              <h1 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Beton skoðunarappið — aðstoð og upplýsingar
              </h1>
              <p className="text-base leading-[1.7] text-ink/70 max-w-[640px]">
                Skoðunarappið er vinnutæki Beton ehf. fyrir ástandsskoðanir og
                kostnaðarmöt á vettvangi. Aðgangur er bundinn við samþykkta
                notendur á vegum Beton; ekki er hægt að stofna aðgang í appinu
                sjálfu. Kynningarútgáfu með sýnigögnum má þó skoða án
                innskráningar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verkflæði */}
      <section className="px-6 lg:px-14 pb-16 lg:pb-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 items-start">
            <div className="md:sticky md:top-32">
              <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase pb-4 border-b border-concrete-dk">
                Svona virkar appið
              </div>
            </div>
            <div>
              {workflow.map((s, i) => (
                <div
                  key={s.n}
                  className={`py-8 ${i === workflow.length - 1 ? "" : "border-b border-concrete"} ${i === 0 ? "pt-0" : ""}`}
                >
                  <div className="flex items-baseline gap-5 mb-3">
                    <span className="font-mono text-[13px] text-navy tracking-[0.05em] min-w-[32px]">
                      {s.n}
                    </span>
                    <h2 className="text-[22px] font-medium tracking-[-0.015em] m-0 text-ink">
                      {s.title}
                    </h2>
                  </div>
                  <p className="pl-[52px] max-w-[720px] text-base leading-[1.7] text-ink/85 m-0">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Algeng úrlausnarefni */}
      <section className="px-6 lg:px-14 pb-16 lg:pb-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 items-start">
            <div className="md:sticky md:top-32">
              <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase pb-4 border-b border-concrete-dk">
                Algeng úrlausnarefni
              </div>
            </div>
            <div>
              {faq.map((f, i) => (
                <div
                  key={f.q}
                  className={`py-8 ${i === faq.length - 1 ? "" : "border-b border-concrete"} ${i === 0 ? "pt-0" : ""}`}
                >
                  <h2 className="text-[19px] font-medium tracking-[-0.01em] text-ink mb-3">
                    {f.q}
                  </h2>
                  <p className="max-w-[720px] text-base leading-[1.7] text-ink/85 m-0">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Aðstoð + persónuvernd */}
      <section className="px-6 lg:px-14 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 items-start">
            <div>
              <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase pb-4 border-b border-concrete-dk">
                Aðstoð
              </div>
            </div>
            <div className="max-w-[720px]">
              <p className="text-base leading-[1.7] text-ink/85 m-0">
                Þarftu aðstoð með appið, aðgang eða gögn? Sendu tölvupóst á{" "}
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-navy underline underline-offset-2"
                >
                  {COMPANY.email}
                </a>{" "}
                og lýstu vandanum — hvaða skref var í gangi og hvaða skilaboð
                birtust. Ekki senda skjámyndir eða gögn með upplýsingum um
                viðskiptavini nema sérstaklega sé óskað eftir því.
              </p>
              <p className="text-base leading-[1.7] text-ink/85 mt-4">
                Upplýsingar um vinnslu persónuupplýsinga í appinu eru í{" "}
                <Link
                  href="/personuvernd"
                  className="text-navy underline underline-offset-2"
                >
                  persónuverndarstefnu skoðunarappsins
                </Link>
                .
              </p>
              <p className="text-[13px] leading-[1.7] text-fog mt-8">
                English: Beton Inspection is the internal field app of Beton
                ehf. for property condition inspections. Access is limited to
                approved Beton personnel. For support, email{" "}
                <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-2">
                  {COMPANY.email}
                </a>
                . Privacy policy: beton.is/personuvernd.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
