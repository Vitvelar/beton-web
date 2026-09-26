import { Inter, Source_Serif_4 } from "next/font/google";

// Rondva-letur fyrir stjórnborðsskelina á app.rondva.com (RondvaAppHtml).
// Skelin býr í (dashboard)-rótarútlitinu sem admin.beton.is og PDF-worker nota
// líka, og next/font forhleður ÖLL letur sem skráin sem er flutt inn skilgreinir,
// óháð því hvor skelin birtist. Því: sér skrá (ekki fonts/rondva.ts, þar sem
// kynningarsíðuletrið er með preload) og preload: false → Beton-síður sækja
// ekki Rondva-letur að óþörfu.
export const interApp = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});

export const sourceSerifApp = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif",
  preload: false,
});
