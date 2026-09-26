import { interApp, sourceSerifApp } from "@/lib/fonts/rondva-app";
import "@/app/globals.css";

// <html>/<body>-skel stjórnborðsins á app.rondva.com. Notar sama stílblað og
// Beton-stjórnborðið (globals.css) en data-brand="rondva" skiptir litum og
// letri yfir í Rondva (sjá neðst í globals.css). rondva.css er EKKI flutt inn
// hér: það er sjálfstæð Tailwind-bygging sem myndi rekast á Beton-klasana.
export function RondvaAppHtml({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-brand="rondva"
      className={`${interApp.variable} ${sourceSerifApp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
