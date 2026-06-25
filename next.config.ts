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
    "/dashboard/**": [
      "node_modules/@sparticuz/chromium/**",
      "node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/**",
    ],
  },
};

export default nextConfig;
