import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Persónuvernd — Beton skoðunarappið",
  description:
    "Persónuverndarstefna Beton skoðunarappsins. Hvaða gögn appið vinnur, hvar þau eru vistuð, hvaða þjónustuaðilar koma að vinnslunni og hvernig þú getur haft samband.",
  alternates: { canonical: "https://beton.is/personuvernd" },
};

type Section = {
  n: string;
  title: string;
  body: string[];
  bullets?: string[];
  after?: string[];
};

const sections: Section[] = [
  {
    n: "01",
    title: "Um þessa stefnu",
    body: [
      `Þessi stefna lýsir því hvernig ${COMPANY.name}, kt. ${COMPANY.kennitala}, ${COMPANY.location}, vinnur persónuupplýsingar í Beton skoðunarappinu og þeim þjónustum sem það tengist. Beton ehf. er ábyrgðaraðili vinnslunnar.`,
      `Fyrirspurnir um persónuvernd má senda á ${COMPANY.email}.`,
    ],
  },
  {
    n: "02",
    title: "Hverjir nota appið",
    body: [
      "Skoðunarappið er vinnutæki Beton ehf. og er notað af skoðunarmönnum fyrirtækisins við ástandsskoðanir fasteigna. Aðgangur er bundinn við samþykkta notendur á vegum Beton — ekki er hægt að stofna aðgang í appinu sjálfu heldur eru aðgangar settir upp fyrirfram fyrir heimilaða notendur.",
      "Innskráning fer fram með Google-aðgangi eða með 6 stafa kóða sem sendur er í tölvupósti. Einnig er hægt að opna kynningarútgáfu appsins án innskráningar; hún vinnur með sýnigögn.",
    ],
  },
  {
    n: "03",
    title: "Hvaða gögn appið vinnur",
    body: [
      "Appið vinnur eftirfarandi upplýsingar í þeim tilgangi að framkvæma ástandsskoðanir, útbúa skýrslur og kostnaðarmöt og halda utan um verkefni Beton:",
    ],
    bullets: [
      "Notandaupplýsingar: netfang, auðkenni og nafn innskráðs notanda, ef nafn fylgir innskráningu.",
      "Upplýsingar um eign sem skoðunarmaður skráir: heimilisfang, póstnúmer, sveitarfélag, fastanúmer, byggingarár og stærð.",
      "Upplýsingar um verkkaupa: nafn verkkaupa og hverjir voru viðstaddir skoðun.",
      "Skoðunargögn: rými, athugasemdir, lýsingar, tillögur, alvarleikamat, veður og dagsetning skoðunar.",
      "Ljósmyndir: myndir sem teknar eru á vettvangi og hitamyndir sem fluttar eru inn úr myndasafni.",
      "Kostnaðarmöt: heimilisfang, nafn verkkaupa og kostnaðarliðir.",
    ],
    after: [
      "Upplýsingar um verkkaupa og eignir eru skráðar af skoðunarmanni í tengslum við þjónustu sem Beton veitir viðkomandi. Appið inniheldur hvorki auglýsingar né auglýsingarakningu og sækir ekki staðsetningu tækisins. Tæknileg gögn sem fylgja uppfærslum og rekstri eru talin upp í kafla 07.",
    ],
  },
  {
    n: "04",
    title: "Vistun á tæki og í skýjaþjónustu",
    body: [
      "Gögn vistast fyrst staðbundið á tækinu (í gagnagrunni appsins og sem myndaskrár) svo appið virki án nettengingar á vettvangi.",
      "Þegar notandi er innskráður samstillast skoðanir, athugasemdir og myndir við skýjaþjónustu Beton, sem rekin er á Supabase og hýst í gagnaveri innan EES (Írlandi). Kostnaðarmöt samstillast ekki við skýjaþjónustuna. Innskráður notandi getur valið að senda fullbúið PDF-skjal kostnaðarmats í skjalasafn Beton í Google Drive.",
    ],
  },
  {
    n: "05",
    title: "Myndavél og myndasafn",
    body: [
      "Appið biður um aðgang að myndavél tækisins til að taka skoðunarmyndir og aðgang að myndasafni til að flytja inn hitamyndir úr hitamyndavél. Appið vinnur aðeins með þær myndir sem notandinn tekur eða velur sjálfur.",
      "Heimildum má breyta hvenær sem er í stillingum símans; appið virkar áfram að öðru leyti þótt heimild sé ekki veitt.",
    ],
  },
  {
    n: "06",
    title: "AI-aðstoð við skýrslugerð",
    body: [
      "Innskráður notandi getur valið AI-aðstoð við skýrslutexta og staðfestir það val sérstaklega í hvert sinn. Þá eru gögn skoðunarinnar send til Anthropic (Claude), þjónustuaðila í Bandaríkjunum: texti athugasemda, upplýsingar um eignina, nafn verkkaupa, hverjir voru viðstaddir skoðun og skoðunarmyndir. Þessi vinnsla fer aðeins fram þegar notandinn hefur staðfest hana.",
      "Skoðunarmaður fer yfir textann og ber ábyrgð á endanlegri skýrslu. Einnig er hægt að búa skýrsluna til á tækinu án AI-aðstoðar, og það gerist sjálfkrafa ef unnið er án nettengingar, í kynningarham eða ef AI-vinnslan bregst. Um varðveislu innsendra gagna hjá Anthropic gilda skilmálar þeirra, sjá privacy.claude.com. Sending fullbúinnar skoðunarskýrslu í skjalasafn Beton í Google Drive er sérstakt val í appinu.",
    ],
  },
  {
    n: "07",
    title: "Þjónustuaðilar",
    body: [
      "Eftirfarandi þjónustuaðilar koma að rekstri appsins og vinna gögn í umboði Beton:",
    ],
    bullets: [
      "Supabase — innskráning, gagnagrunnur, skráageymsla og bakvinnsla skýjaþjónustunnar.",
      "Anthropic — AI-textagerð við skýrslugerð, eins og lýst er í kafla 06.",
      "Google — innskráning með Google-aðgangi (sé sú leið valin) og vistun fullbúinna PDF-skjala í Google Drive skjalasafni Beton.",
      "Vercel — hýsing vefþjónustu Beton (beton.is og admin.beton.is), þar sem endanleg PDF-útfærsla skýrslu er unnin.",
      "Expo — appið sækir hugbúnaðaruppfærslur frá Expo-þjónustum. Með uppfærslubeiðnum fylgir fast, handahófskennt uppsetningarauðkenni appsins á tækinu, stýrikerfis- og útgáfuupplýsingar og, hafi appið stöðvast vegna villu í síðustu keyrslu, stutt villulýsing.",
    ],
    after: [
      "Þjónustuaðilar sem hýsa kerfið vinna jafnframt hefðbundin öryggis- og rekstrargögn sem fylgja netumferð, svo sem IP-tölur í netþjónaskrám.",
    ],
  },
  {
    n: "08",
    title: "Varðveisla og eyðing",
    body: [
      "Skoðunargögn eru varðveitt á meðan þau eru nauðsynleg vegna þjónustunnar, viðskiptasambandsins og lagaskyldna, svo sem bókhaldsskyldu.",
      "Þegar skoðun er eytt í appinu eyðast færslur hennar úr gagnagrunni appsins. Afrit geta þó verið áfram til í útgefnum skýrslum, skjalasafni fyrirtækisins og öryggisafritum þar til þeim er eytt. Spurningum um varðveislu tiltekinna gagna og óskum um eyðingu er hægt að beina til Beton, sjá kafla 09.",
    ],
  },
  {
    n: "09",
    title: "Réttindi þín og samband",
    body: [
      `Þú getur óskað eftir aðgangi að, leiðréttingu á eða eyðingu persónuupplýsinga sem Beton vinnur um þig með því að senda tölvupóst á ${COMPANY.email}. Við bregðumst við beiðnum eins fljótt og kostur er.`,
      "Appið býður ekki upp á sjálfvirka eyðingu aðgangs. Þar sem aðgangar eru settir upp fyrir heimilaða notendur á vegum Beton er aðgangi lokað og notandagögnum eytt samkvæmt beiðni til Beton.",
      "Ef þú telur að vinnsla Beton samræmist ekki lögum um persónuvernd getur þú beint kvörtun til Persónuverndar (personuvernd.is).",
    ],
  },
];

export default function Personuvernd() {
  return (
    <>
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24">
            <div>
              <Eyebrow>Persónuvernd</Eyebrow>
            </div>
            <div>
              <h1 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Persónuverndarstefna Beton skoðunarappsins
              </h1>
              <p className="text-base leading-[1.7] text-ink/70 max-w-[640px]">
                Hér er lýst hvernig Beton ehf. vinnur persónuupplýsingar í
                skoðunarappinu og tengdum þjónustum. Nánari upplýsingar um appið
                sjálft eru á{" "}
                <Link href="/app" className="text-navy underline underline-offset-2">
                  stuðningssíðu appsins
                </Link>
                .
              </p>
              <p className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase mt-6">
                Síðast uppfært: 21. september 2026
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
                    {s.after?.map((p, j) => (
                      <p key={j} className="text-base leading-[1.7] text-ink/85 m-0">
                        {p}
                      </p>
                    ))}
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
