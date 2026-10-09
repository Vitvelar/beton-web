import { BRANDS } from "@/lib/brand";

// rondva.com/robots.txt (proxy endurskrifar á /rondva/robots.txt). Beton á
// src/app/robots.ts; það gildir áfram fyrir beton.is.
//
// Ákvörðun (2026-10-09, PROMPT-EFTIR-SAMTHYKKI §E): öllum leitar- og gervigreindarskriðlum er
// LEYFT að lesa rondva.com. Rondva vill að svarvélar (ChatGPT, Claude, Perplexity, Google AI
// Overviews, Bing/Copilot) vitni í síðuna. Blokkirnar fyrir einstaka skriðla eru skýrar svo
// ákvörðunin sé skjalfest og enginn þeirra erfi einhverja aðra reglu síðar. Stjórnborð og API
// eru áfram bönnuð öllum.
export const dynamic = "force-static";

const AI_AND_SEARCH_CRAWLERS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Bingbot"];

export function GET() {
  const body = [
    "# Allt er leyft nema stjórnborð og API. Gervigreindarskriðlar eru vísvitandi velkomnir.",
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /dashboard",
    "",
    ...AI_AND_SEARCH_CRAWLERS.flatMap((agent) => [
      `User-agent: ${agent}`,
      "Allow: /",
      "Disallow: /api/",
      "Disallow: /dashboard",
      "",
    ]),
    `Sitemap: ${BRANDS.rondva.marketingUrl}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
