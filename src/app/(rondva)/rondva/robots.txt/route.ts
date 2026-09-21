import { BRANDS } from "@/lib/brand";

// rondva.com/robots.txt (proxy endurskrifar á /rondva/robots.txt). Beton á
// src/app/robots.ts; það gildir áfram fyrir beton.is.
export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /dashboard",
    "",
    `Sitemap: ${BRANDS.rondva.marketingUrl}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
