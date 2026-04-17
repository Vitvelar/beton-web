import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skilmálar",
  description:
    "Skilmálar og fyrirvarar ástandsskoðunar Beton ehf. Lestu um umfang skoðunar, takmarkanir ábyrgðar og greiðsluskilmála.",
  alternates: { canonical: "https://beton.is/skilmalar" },
};

export default function Skilmalar() {
  return (
    <>
      <section className="py-20 px-6 bg-light-gray">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Skilmálar
          </h1>
          <p className="text-lg text-slate">
            Skilmálar og fyrirvarar ástandsskoðunar Beton ehf.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <article className="mx-auto max-w-3xl prose prose-lg prose-charcoal">
          <h2>1. Markmið og gildissvið</h2>
          <p>
            Markmið ástandsskoðunar er að veita verkkaupa upplýsingar um almennt
            og sýnilegt ástand fasteignar á þeim tímapunkti sem skoðun fer fram.
            Ástandsskoðun byggir á hlutlausri skoðun og stöðluðum verkferlum
            Beton ehf. og er ætluð til upplýsingaöflunar vegna fasteignaviðskipta
            eða mats á ástandi eigin eignar.
          </p>
          <p>
            Ástandsskoðun og skýrsla eiga eingöngu við um þá fasteign sem skoðuð
            er og taka einungis til þeirra atriða sem sérstaklega eru nefnd í
            skýrslu.
          </p>

          <h2>2. Umfang skoðunar</h2>
          <p>
            Ástandsskoðun nær eingöngu til þeirra atriða sem skoðunarmaður getur
            séð eða athugað með sjónskoðun og einföldum tækjum, án inngrips.
          </p>
          <p>
            Eign er skoðuð að innan sem utan. Að utan eru einungis aðgengileg
            svæði skoðuð, að öðrum kosti frá jörðu eða götu. Byggingarhlutar ofar
            en 3 metrar frá jörðu eru ekki skoðaðir vegna fallhættu nema
            sérstaklega hafi verið samið um það. Allur kostnaður vegna sérstakra
            ráðstafana eða tækjaleigu fellur á verkkaupa.
          </p>

          <h2>3. Það sem er ekki hluti af ástandsskoðun</h2>
          <p>
            Eftirfarandi er ekki hluti af ástandsskoðun nema sérstaklega sé samið
            um það skriflega:
          </p>
          <ul>
            <li>
              Skoðun inn í veggi, undir gólfefni, inn í stokka eða bak við
              innréttingar, hreinlætistæki (s.s. baðkör og sturtubotna), fasta
              spegla, klæðningar, listaverk eða stóra fataskápa/kommóður.
            </li>
            <li>
              Tæknileg skoðun á burðarvirki, kerfum eða íhlutum fasteignar.
            </li>
            <li>
              Skoðun á þaki, þakköntum og þakrennum nema hægt sé að skoða þau
              frá jörðu, svölum eða sérstaklega hafi verið samið um þakskoðun.
            </li>
            <li>Skoðun á drenlögnum, fráveitu- og skólplögnum.</li>
            <li>
              Skoðun á raflögnum, neysluvatns-, hita- eða ofnalögnum sem og dren-
              og fráveitulögnum, nema um sé að ræða sjónskoðun á utanáliggjandi
              lögnum eða lagnagrind.
            </li>
            <li>
              Yfirferð opinberra gagna, teikninga eða annarra skjala.
            </li>
            <li>
              Staðfesting á því að fasteign uppfylli ákvæði byggingarreglugerða,
              staðla eða fyrirmæli framleiðenda.
            </li>
            <li>
              Mat á framtíðarástandi, endingartíma eða nothæfi byggingarhluta.
            </li>
          </ul>

          <h2>4. Rakamælingar og hitamyndun</h2>
          <p>
            Rakamælingar eru framkvæmdar án inngrips (non-invasive) með viðeigandi
            rakamælum. Ekki er um eiginlega hlutfallsrakamælingar að ræða heldur
            viðmiðunarrakamælingar út frá þeim forsemdum sem eru til staðar við
            skoðun (þ.e.a.s. mælingar á sambærilegu byggingarefni innan rýmis eða
            fasteignar). Bent er á að þrátt fyrir rakamælingar er aldrei hægt að
            tryggja að fasteign sé laus við raka, myglu eða örveruvöxt, þar sem
            slíkir gallar geta leynst innan byggingarhluta án sjáanlegra
            ummerkja.
          </p>

          <h2>5. Framkvæmd skoðunar</h2>
          <p>
            Skoðunarmaður beitir sjónskoðun, tekur ljósmyndir og skráir
            athugasemdir um þá galla eða ágalla sem hann telur geta valdið
            verulegri skerðingu á notagildi eignar eða geti haft í för með sér
            verulegan kostnaðarauka fyrir væntanlegan kaupanda. Atriði sem teljast
            eðlilegt slit eða hafa ekki veruleg áhrif á notagildi eða kostnað eru
            almennt ekki talin upp. Einnig er ekki talið upp þegar búnaður virkar
            ekki að fullu en hefur þó hvorki teljandi áhrif á notagildi né í för
            með sér verulegan kostnað.
          </p>
          <p>
            Sameign fjölbýlishúsa er ekki skoðuð nema sérstaklega sé um það
            samið.
          </p>

          <h2>6. Skýrslugerð og notkun skýrslu</h2>
          <p>
            Skýrsla er unnin á grundvelli þeirra upplýsinga sem skoðunarmaður
            hafði aðgang að á skoðunartíma. Allar niðurstöður og ályktanir
            byggjast á því að framangreindar upplýsingar um tiltekna fasteign séu
            réttar og fullnægjandi og takmarkast við þá dagsetningu sem fasteign
            var skoðuð.
          </p>
          <p>
            Varast skal að byggja ákvörðun um fasteignakaup eingöngu á efni
            skýrslunnar. Skýrslan má ekki vera notuð í öðrum tilgangi en í
            tengslum við ákvarðanatöku um fasteignakaup eða til upplýsingaöflunar
            um ástand eigin eignar.
          </p>
          <p>
            Dreifing eða afhending skýrslu til þriðja aðila er óheimil nema með
            skriflegu samþykki Beton ehf.
          </p>

          <h2>7. Takmörkun ábyrgðar</h2>
          <p>
            Ábyrgð Beton ehf. og starfsmanna þess vegna ástandsskoðunar,
            skýrslugerðar eða athugasemda takmarkast, að hámarki, við þá
            heildarþóknun sem greidd var fyrir viðkomandi skoðun.
          </p>
          <p>
            Skoðunarmaður veitir enga ábyrgð, hvorki beina né óbeina, á því: að
            allir gallar hafi fundist, að skoðaðir byggingarhlutar séu rétt
            hannaðir eða framkvæmdir í samræmi við faglega verkhætti, að
            byggingarhlutar muni halda áfram að virka með sama hætti í
            framtíðinni, eða að fasteign eða einstakir hlutar hennar séu hæfir
            til tiltekins notkunartilgangs.
          </p>
          <p>
            Með því að undirrita þennan samning viðurkennir viðskiptavinur að
            skoðunargjaldið sem greitt er til skoðunarmanns sé lítið miðað við þá
            áhættu á skaðabótaskyldu sem fylgir fasteignaskoðunum ef ekki væri
            hægt að takmarka ábyrgð. Viðskiptavinur viðurkennir að án
            möguleikans á að takmarka ábyrgð væri skoðunarmaðurinn neyddur til að
            rukka viðskiptavin mun hærra gjald fyrir þjónustu sína en núverandi
            skoðunargjald.
          </p>

          <h2>8. Öryggi</h2>
          <p>
            Skoðunarmaður áskilur sér rétt til að sleppa því að skoða eða mæla
            hluta fasteignar telji hann að öryggi sínu eða annarra sé stefnt í
            hættu, svo sem vegna fallhættu, óheilnæms vinnuumhverfis eða
            loftgæða.
          </p>

          <h2>9. Frekari athuganir</h2>
          <p>
            Nánari athugun eða viðgerð á göllum sem nefndir eru í skýrslu getur
            leitt í ljós frekari galla sem voru ekki sýnilegir eða aðgengilegir á
            skoðunartíma. Slíkir gallar falla utan ábyrgðar Beton ehf.
          </p>

          <h2>10. Hlutleysi og fagmennska</h2>
          <p>
            Skoðunarmaður starfar sem hlutlaus matsaðili, af heilindum og
            fagmennsku, og hefur engra annarra hagsmuna að gæta en að vinna verk
            sitt á faglegan hátt samkvæmt bestu vitund.
          </p>

          <h2>11. Greiðsla og afhending skýrslu vegna ástandsskoðunar</h2>
          <p>
            Greitt er fyrir ástandsskoðun ásamt skýrslu ekki seinna en 24 klst.
            fyrir áætlaða skoðun og fer ástandsskoðun ekki fram nema greiðsla hafi
            borist að fullu innan tilskilins frests.
          </p>
          <p>
            Skýrsla vegna ástandsskoðunar er afhent innan 48 klst. frá framkvæmd
            skoðunar, nema um annað hafi verið samið skriflega.
          </p>
          <p className="font-semibold">
            Skilmálar þessir gilda fyrir allar ástandsskoðanir sem Beton ehf.
            framkvæmir nema annað sé sérstaklega samið skriflega.
          </p>
        </article>
      </section>
    </>
  );
}
