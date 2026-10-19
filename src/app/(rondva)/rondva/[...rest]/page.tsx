import { RondvaNotFoundView } from "@/components/rondva/NotFoundView";
import { rondvaNotFoundMetadata } from "@/components/rondva/page-meta";

// Allar óþekktar slóðir á rondva.com enda hér → Rondva-404 (ekki Beton).
//
// Hér er viljandi EKKI kallað á notFound(): forritið hefur tvö rótarútlit (Beton og Rondva) og
// ekkert app/layout.tsx, og þá skilar Next 16 við keyrslu `<html id="__next_error__">` með tómum
// <body> (404-síðan teiknast aðeins í vafranum, ekkert í HTML fyrir skriðla eða án JavaScript).
// Síðan er því teiknuð hér á þjóninum með noindex, nofollow og engu canonical. Staðan er 200 en
// ekki 404; sjá skýrsluna (global-not-found eða 404 í proxy.ts myndi gefa rétta stöðu).
export const metadata = rondvaNotFoundMetadata;
export const dynamic = "force-dynamic";

export default function RondvaCatchAll() {
  return <RondvaNotFoundView />;
}
