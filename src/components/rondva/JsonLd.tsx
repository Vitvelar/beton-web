import { jsonLdString } from "@/lib/rondva-seo";

// Eitt <script type="application/ld+json"> á síðu. Gögnin koma úr src/lib/rondva-seo.ts.
export function JsonLd({ nodes }: { nodes: Parameters<typeof jsonLdString>[0] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(nodes) }} />;
}
