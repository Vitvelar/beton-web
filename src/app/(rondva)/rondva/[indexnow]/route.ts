import { rondvaIndexNowKey } from "@/lib/rondva-seo";

// IndexNow lykilskrá: https://rondva.com/<key>.txt (proxy endurskrifar á /rondva/<key>.txt) skilar
// lyklinum sem texta. Aðeins ef RONDVA_SEO.indexNowKey er gildur (32 hex) OG slóðin passar; annars 404.
// Leiðin er undir (rondva) og proxy skilar 404 fyrir /rondva/* á Beton-lénum, svo hún sést aldrei á beton.is.
export const dynamic = "force-static";
export const dynamicParams = true;

export async function GET(_req: Request, ctx: { params: Promise<{ indexnow: string }> }) {
  const { indexnow } = await ctx.params;
  const key = rondvaIndexNowKey();
  if (!key || indexnow.toLowerCase() !== `${key.toLowerCase()}.txt`) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
