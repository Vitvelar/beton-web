import { betonFontClassName } from "@/lib/fonts/beton";
import { consentDefaultScript } from "@/lib/beton-consent";
import "@/app/globals.css";

// Sameiginleg <html>/<body>-skel allra Beton-rótarútlita. Áður lá þetta í
// src/app/layout.tsx; nú hefur hvert vörumerki eigið rótarútlit (Rondva er
// á ensku og með annað letur), svo Beton-hlutinn er dreginn hingað.
//
// gtmId: Google Tag Manager-gámur. Sé hann gefinn fer ræsiskriftan efst í
// <head> og <noscript>-ramminn strax eftir opnun <body>, eins og GTM mælir
// með. Við notum hrá <script>-tög (ekki next/script) svo skriftan lendi örugglega
// í <head> í vefþjónsútgáfunni; gámurinn hleður sjálfur gtm.js async.
//
// consentMode: Google Consent Mode v2 (src/lib/beton-consent.ts). Setur
// gtag('consent','default', denied…) á undan GTM-ræsiskriftunni svo engin
// markaðs-/greiningartögg fire-i fyrr en gestur samþykkir í CookieBanner.
// Gefið á markaðssíðunni líka utan framleiðslu (án GTM) svo borðinn og
// dataLayer-uppfærslan séu prófanleg á preview/localhost.
export function BetonHtml({
  children,
  gtmId,
  consentMode = false,
}: {
  children: React.ReactNode;
  gtmId?: string;
  consentMode?: boolean;
}) {
  return (
    <html lang="is" className={`${betonFontClassName} h-full antialiased`}>
      {(consentMode || gtmId) && (
        // App Router: <head> í rótarútliti er leyft og Next sameinar metadata
        // inn í það. Lint-reglan á við pages/-leiðina (next/head).
        // eslint-disable-next-line @next/next/no-head-element
        <head>
          {consentMode && (
            <script
              id="consent-default"
              dangerouslySetInnerHTML={{ __html: consentDefaultScript() }}
            />
          )}
          {gtmId && (
            <script
              id="gtm-init"
              dangerouslySetInnerHTML={{ __html: gtmInitScript(gtmId) }}
            />
          )}
        </head>
      )}
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}

// Staðlaða GTM-ræsiskriftan, óbreytt nema gámanúmerið er sett inn.
function gtmInitScript(id: string): string {
  if (!/^GTM-[A-Z0-9]+$/.test(id)) throw new Error(`Ógilt GTM-auðkenni: ${id}`);
  return (
    "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
    "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
    "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
    "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
    `})(window,document,'script','dataLayer','${id}');`
  );
}
