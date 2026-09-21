import { notFound } from "next/navigation";

// Allar óþekktar slóðir á rondva.com enda hér → Rondva not-found (ekki Beton).
export default function RondvaCatchAll() {
  notFound();
}
