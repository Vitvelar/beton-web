// Prentstílar skýrslusíðunnar (report/page.tsx), fluttir óbreyttir úr <style>-blokkinni
// (NZS 4306-sniðið notar sömu stíla). Úttakið er bæti fyrir bæti það sama og áður —
// scripts/verify-report-identity.cjs ber markup saman við golden úr main.
//
// isPdfMode = ?pdf=1 (server-PDF um render-pdf.ts); annars window.print().
export function reportPrintCss(isPdfMode: boolean): string {
  return `
        /* SPÁSSÍU-SKEMA — tvær leiðir, ein samræmd regla:

           1) window.print() (Prenta/Vista PDF hnappur, varaleið):
              Spássíurnar (Word "Normal" = 2,54 cm) eru í EFNINU sjálfu (padding),
              EKKI í @page. Þannig haldast þær sama hvað "Margins" stillingin í
              prentglugga Chrome er stillt á (None/Default) — áður var reitt á
              @page margin sem Chrome hunsar þegar notandi velur "None".

           2) Server-PDF (?pdf=1, report/pdf/route.ts):
              puppeteer page.pdf() leggur til ALLAR spássíur (18mm/16mm/25.4mm)
              OG blaðsíðunúmer. Þá DROPPUM við láréttu section-padding-i. MIKILVÆGT:
              við megum EKKI setja @page { margin: 0 } í þessu tilviki — það
              YFIRSKRIFAR puppeteer-spássíurnar og skilar 0 spássíum. Í print-
              ham (window.print) höldum við @page margin:0 (efnið sér um padding). */
        @page { size: A4; ${isPdfMode ? "" : "margin: 0;"} }
        @media print {
          html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          main { max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .report-article {
            border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
            background: #fff !important; max-width: none !important; overflow: visible !important;
          }
          ${isPdfMode ? `
          /* Server-PDF: puppeteer sér um hliðarspássíur — aðeins lítið lóðrétt
             bil milli efnis og brúnar puppeteer-spássíunnar. */
          .report-article > section {
            padding: 4mm 0 !important; border: 0 !important;
          }
          .report-article > section.rpt-cover { padding: 0 !important; }
          .report-article > section.rpt-terms { padding: 4mm 0 !important; }
          ` : `
          /* window.print(): 25,4mm til hliðanna á öllum efnissíðum, hóflegt að ofan/neðan. */
          .report-article > section {
            padding: 18mm 25.4mm !important; border: 0 !important;
          }
          .report-article > section.rpt-cover { padding: 20mm 25.4mm !important; }
          .report-article > section.rpt-terms { padding: 25.4mm !important; }
          `}
          /* Myndir/töflur klofna ekki milli síðna. Athugasemda-/rýmismyndir sýna FULLA
             mynd (engin klipping) — náttúrulegt hlutfall, takmarkað í hæð. */
          img, table, thead, tbody, tr, .rpt-keep { break-inside: avoid; page-break-inside: avoid; }
          .rpt-photo { height: auto !important; max-height: 78mm !important; object-fit: contain !important; }
          /* Halda fyrirsögnum við efnið sem fylgir (engar munaðarlausar fyrirsagnir
             neðst á síðu). .rpt-obs-title = haus hverrar athugasemdar (númer + titill
             + alvarleikamerki). */
          h2, h3, .rpt-obs-title { break-after: avoid; }
        }
      `;
}
