import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // puppeteer-core og @sparticuz/chromium nota Node-eiginleika og mega ekki
  // vera bundluð af Next. Þessir pakkar eru reyndar í sjálfgefnum lista Next
  // yfir ytri pakka, en við erum skýr hér til öryggis (og fyrir læsileika).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Tryggjum að Chromium-binaríið (bin/*.br skrárnar í @sparticuz/chromium —
  // m.a. 64MB chromium.br) fylgi með í standalone/serverless output-i fyrir
  // PDF-leiðina. Án þessa sleppir file-tracing brotli-skránum og
  // chromium.executablePath() fellur í framleiðslu.
  //
  // ATH (pnpm): raunverulegu skrárnar liggja undir node_modules/.pnpm/...,
  // toppstigs node_modules/@sparticuz/chromium er aðeins symlink. Þess vegna
  // tökum við bæði mynstrin með svo glob-ið hitti raunverulegu skrárnar.
  //
  // Lyklarnir eru ROUTE-GLOBS (picomatch) borið saman við URL-leiðina — EKKI
  // manifest-lykilinn. Route-group ((dashboard)) birtist EKKI í URL-leiðinni.
  // Hornklofar í dýnamískum hlutum ([id]) eru picomatch character-class, svo
  // þeir verða annaðhvort að vera escape-aðir eða við notum '/dashboard/**'.
  // Við notum breiða '/dashboard/**' til öryggis (over-include skaðar ekki).
  //
  // Gildin eru glob-mynstur leyst frá rót verkefnis. Með pnpm liggja
  // raunverulegu skrárnar undir node_modules/.pnpm/...; toppstigs slóðin er
  // symlink. Við tökum bæði til öryggis svo chromium.br (~64MB) fylgi með.
  outputFileTracingIncludes: {
    // ATH 2026-09-22: "/dashboard/**" var áður hér líka, frá því að PDF var
    // rendrað í report/pdf-leiðinni. Sú leið sækir nú tilbúið PDF úr Storage
    // (sjá report/pdf/route.ts) og ekkert undir /dashboard flytur inn
    // render-pdf.ts lengur — aðeins tick-leiðin hér að neðan. Að hafa
    // Chromium (~64MB) með í HVERRI dashboard-function fyllti "Functions
    // Storage" (16 GB af 10 GB á Vercel). Ef PDF-render flyst aftur undir
    // /dashboard þarf færsluna aftur.
    // Bakgrunns-workerinn (tick) rendrar nú PDF á Vercel með @sparticuz —
    // sama binary þarf að fylgja ÞEIRRI leið, annars: "input directory .../bin
    // does not exist" í framleiðslu (nákvæmlega villan sem kom 2026-08-10).
    "/api/report/worker/tick": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**",
    ],
  },
};

export default nextConfig;
