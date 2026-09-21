import { betonFontClassName } from "@/lib/fonts/beton";
import "@/app/globals.css";

// Sameiginleg <html>/<body>-skel allra Beton-rótarútlita. Áður lá þetta í
// src/app/layout.tsx; nú hefur hvert vörumerki eigið rótarútlit (Rondva er
// á ensku og með annað letur), svo Beton-hlutinn er dreginn hingað.
export function BetonHtml({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is" className={`${betonFontClassName} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
