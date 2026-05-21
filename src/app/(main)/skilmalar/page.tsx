import type { Metadata } from "next";
import { Eyebrow } from "@/components/Editorial";

export const metadata: Metadata = {
  title: "Skilmálar",
  description:
    "Skilmálar og fyrirvarar ástandsskoðunar Beton ehf. Lestu um umfang skoðunar, takmarkanir ábyrgðar og greiðsluskilmála.",
  alternates: { canonical: "https://beton.is/skilmalar" },
};

type Section = {
  n: string;
  title: string;
  body: string[];
  bullets?: string[];
};

const sections: Section[] = [
  {
    n: "01",
    title: "Markmið og gildissvið",
    body: [
      "Markmið ástandsskoðunar er að veita verkkaupa upplýsingar um almennt og sýnilegt ástand fasteignar á þeim tímapunkti sem skoðun fer fram. Ástandsskoðun byggir á hlutlausri skoðun og stöðluðum verkferlum Beton ehf. og er ætluð til upplýsingaöflunar vegna fasteignaviðskipta eða mats á ástandi eigin eignar.",
      "Ástandsskoðun og skýrsla eiga eingöngu við um þá fasteign sem skoðuð er og taka einungis til þeirra atriða sem sérstaklega eru nefnd í skýrslu.",
    ],
  },
  {
    n: "02",
    title: "Umfang skoðunar",
    body: [
      "Ástandsskoðun nær eingöngu til þeirra atriða sem skoðunarmaður getur séð eða athugað með sjónskoðun og einföldum tækjum, án inngrips.",
      "Eign er skoðuð að innan sem utan. Að utan eru einungis aðgengileg svæði skoðuð, að öðrum kosti frá jörðu eða götu. Byggingarhlutar ofar en 3 metrar frá jörðu eru ekki skoðaðir vegna fallhættu nema sérstaklega hafi verið samið um það. Allur kostnaður vegna sérstakra ráðstafana eða tækjaleigu fellur á verkkaupa.",
    ],
  },
  {
    n: "03",
    title: "Það sem er ekki hluti af ástandsskoðun",
    body: [
      "Eftirfarandi er ekki hluti af ástandsskoðun nema sérstaklega sé samið um það skriflega:",
    ],
    bullets: [
      "Skoðun inn í veggi, undir gólfefni, inn í stokka eða bak við innréttingar, hreinlætistæki (s.s. baðkör og sturtubotna), fasta spegla, klæðningar, listaverk eða stóra fataskápa/kommóður.",
      "Tæknileg skoðun á burðarvirki, kerfum eða íhlutum fasteignar.",
      "Skoðun á þaki, þakköntum og þakrennum nema hægt sé að skoða þau frá jörðu, svölum eða sérstaklega hafi verið samið um þakskoðun.",
      "Skoðun á drenlögnum, fráveitu- og skólplögnum.",
      "Skoðun á raflögnum, neysluvatns-, hita- eða ofnalögnum sem og dren – og fráveitulögnum, nema um sé að ræða sjónskoðun á utanáliggjandi lögnum eða lagnagrind.",
      "Yfirferð opinberra gagna, teikninga eða annarra skjala.",
      "Staðfesting á því að fasteign uppfylli ákvæði byggingarreglugerða, staðla eða fyrirmæli framleiðenda.",
      "Mat á framtíðarástandi, endingartíma eða nothæfi byggingarhluta.",
    ],
  },
  {
    n: "04",
    title: "Rakamælingar og hitamyndun",
    body: [
      "Rakamælingar eru framkvæmdar án inngrips (non-invasive) með viðeigandi rakamælum. Ekki er um eiginlega hlutfallsrakamælingar að ræða heldur viðmiðunarrakamælingar út frá þeim forsemdum sem eru til staðar við skoðun (þ.e.a.s. mælingar á sambærilegu byggingarefni innan rýmis eða fasteignar). Bent er á að þrátt fyrir rakamælingar er aldrei hægt að tryggja að fasteign sé laus við raka, myglu eða örveruvöxt, þar sem slíkir gallar geta leynst innan byggingarhluta án sjáanlegra ummerkja.",
    ],
  },
  {
    n: "05",
    title: "Framkvæmd skoðunar",
    body: [
      "Skoðunarmaður beitir sjónskoðun, tekur ljósmyndir og skráir athugasemdir um þá galla eða ágalla sem hann telur geta valdið verulegri skerðingu á notagildi eignar eða geti haft í för með sér verulegan kostnaðarauka fyrir væntanlegan kaupanda. Atriði sem teljast eðlilegt slit eða hafa ekki veruleg áhrif á notagildi eða kostnað eru almennt ekki talin upp. Einnig er ekki talið upp þegar búnaður virkar ekki að fullu en hefur þó hvorki teljandi áhrif á notagildi né í för með sér verulegan kostnað.",
      "Sameign fjölbýlishúsa er ekki skoðuð nema sérstaklega sé um það samið.",
    ],
  },
  {
    n: "06",
    title: "Skýrslugerð og notkun skýrslu",
    body: [
      "Skýrsla er unnin á grundvelli þeirra upplýsinga sem skoðunarmaður hafði aðgang að á skoðunartíma. Allar niðurstöður og ályktanir byggjast á því að framangreindar upplýsingar um tiltekna fasteign séu réttar og fullnægjandi og takmarkast við þá dagsetningu sem fasteign var skoðuð.",
      "Varast skal að byggja ákvörðun um fasteignakaup eingöngu á efni skýrslunnar. Skýrslan má ekki vera notuð í öðrum tilgangi en í tengslum við ákvarðanatöku um fasteignakaup eða til upplýsingaöflunar um ástand eigin eignar.",
      "Dreifing eða afhending skýrslu til þriðja aðila er óheimil nema með skriflegu samþykki Beton ehf.",
    ],
  },
  {
    n: "07",
    title: "Takmörkun ábyrgðar",
    body: [
      "Ábyrgð Beton ehf. og starfsmanna þess vegna ástandsskoðunar, skýrslugerðar eða athugasemda takmarkast, að hámarki, við þá heildarþóknun sem greidd var fyrir viðkomandi skoðun.",
      "Skoðunarmaður veitir enga ábyrgð, hvorki beina né óbeina, á því: – að allir gallar hafi fundist, – að skoðaðir byggingarhlutar séu rétt hannaðir eða framkvæmdir í samræmi við faglega verkhætti, – að byggingarhlutar muni halda áfram að virka með sama hætti í framtíðinni, – eða að fasteign eða einstakir hlutar hennar séu hæfir til tiltekins notkunartilgangs.",
      "Með því að undirrita þennan samning viðurkennir viðskiptavinur að skoðunargjaldið sem greitt er til skoðunarmanns sé lítið miðað við þá áhættu á skaðabótaskyldu sem fylgir fasteignaskoðunum ef ekki væri hægt að takmarka ábyrgð. Viðskiptavinur viðurkennir að án möguleikans á að takmarka ábyrgð væri skoðunarmaðurinn neyddur til að rukka viðskiptavin mun hærra gjald fyrir þjónustu sína en núverandi skoðunargjald.",
    ],
  },
  {
    n: "08",
    title: "Öryggi",
    body: [
      "Skoðunarmaður áskilur sér rétt til að sleppa því að skoða eða mæla hluta fasteignar telji hann að öryggi sínu eða annarra sé stefnt í hættu, svo sem vegna fallhættu, óheilnæms vinnuumhverfis eða loftgæða.",
    ],
  },
  {
    n: "09",
    title: "Frekari athuganir",
    body: [
      "Nánari athugun eða viðgerð á göllum sem nefndir eru í skýrslu getur leitt í ljós frekari galla sem voru ekki sýnilegir eða aðgengilegir á skoðunartíma. Slíkir gallar falla utan ábyrgðar Beton ehf.",
    ],
  },
  {
    n: "10",
    title: "Hlutleysi og fagmennska",
    body: [
      "Skoðunarmaður starfar sem hlutlaus matsaðili, af heilindum og fagmennsku, og hefur engra annarra hagsmuna að gæta en að vinna verk sitt á faglegan hátt samkvæmt bestu vitund.",
    ],
  },
  {
    n: "11",
    title: "Greiðsla og afhending skýrslu vegna ástandsskoðunar",
    body: [
      "Greitt er fyrir ástandsskoðun ásamt skýrslu ekki seinna en 24 klst. fyrir áætlaða skoðun og fer ástandsskoðun ekki fram nema greiðsla hafi borist að fullu innan tilskilins frests.",
      "Skýrsla vegna ástandsskoðunar er afhent innan 48 klst. frá framkvæmd skoðunar, nema um annað hafi verið samið skriflega.",
      "Skilmálar þessir gilda fyrir allar ástandsskoðanir sem Beton ehf. framkvæmir nema annað sé sérstaklega samið skriflega.",
    ],
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
            </div>
            <div>
              <h1 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Skilmálar og fyrirvarar ástandsskoðunar Beton ehf.
              </h1>
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
                    <span className="font-mono text-[11px] text-navy tracking-[0.05em]">
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
                    <span className="font-mono text-[13px] text-navy tracking-[0.05em] min-w-[32px]">
                      {s.n}
                    </span>
                    <h2 className="text-[26px] font-medium tracking-[-0.015em] m-0 text-ink">
                      {s.title}
                    </h2>
                  </div>
                  <div className="pl-[52px] max-w-[720px] flex flex-col gap-4">
                    {s.body.map((p, j) => (
                      <p key={j} className="text-base leading-[1.7] text-ink/85 m-0">
                        {p}
                      </p>
                    ))}
                    {s.bullets && (
                      <ul className="flex flex-col gap-2.5 list-disc pl-5 marker:text-navy">
                        {s.bullets.map((b, j) => (
                          <li key={j} className="text-base leading-[1.7] text-ink/85">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
