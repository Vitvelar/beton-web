import { notFound } from "next/navigation";

// Allar óþekktar slóðir á rondva.com enda hér → Rondva not-found (ekki Beton).
// Metadata og útlit 404 eru í ../not-found.tsx.
export default function RondvaCatchAll() {
  notFound();
}
