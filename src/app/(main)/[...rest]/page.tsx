import { notFound } from "next/navigation";

// Allar slóðir á beton.is sem ekki passa við neina síðu enda hér, svo 404-síðan
// birtist inni í haus og fæti markaðssíðunnar ((main)/not-found.tsx) en ekki sem
// sjálfgefin síða Next.
export default function CatchAll() {
  notFound();
}
