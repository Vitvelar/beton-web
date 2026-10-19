import { betonFontClassName } from "@/lib/fonts/beton";
import "@/app/globals.css";

// Sameiginleg <html>/<body>-skel allra Beton-rótarútlita. Áður lá þetta í
// src/app/layout.tsx; nú hefur hvert vörumerki eigið rótarútlit (Rondva er
// á ensku og með annað letur), svo Beton-hlutinn er dreginn hingað.
//
// gtmId: Google Tag Manager-gámur. Sé hann gefinn fer ræsiskriftan efst í
// <head> og <noscript>-ramminn strax eftir opnun <body>, eins og GTM mælir
// með. Við notum hrá <script>-tög (ekki next/script) svo skriftan lendi örugglega
// í <head> í vefþjónsútgáfunni; gámurinn hleður sjálfur gtm.js async.
export function BetonHtml({
  children,
  gtmId,
}: {
  children: React.ReactNode;
  gtmId?: string;
}) {
  return (
    <html lang="is" className={`${betonFontClassName} h-full antialiased`}>
      {gtmId && (
        // App Router: <head> í rótarútliti er leyft og Next sameinar metadata
        // inn í það. Lint-reglan á við pages/-leiðina (next/head).
        // eslint-disable-next-line @next/next/no-head-element
        <head>
          <script
            id="gtm-init"
            dangerouslySetInnerHTML={{ __html: gtmInitScript(gtmId) }}
          />
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
