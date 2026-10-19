import { RondvaNotFoundView } from "@/components/rondva/NotFoundView";
import { rondvaNotFoundMetadata } from "@/components/rondva/page-meta";

// Notað ef einhver síða á rondva.com kallar á notFound() sjálf. Óþekktar slóðir fara í
// [...rest]/page.tsx (sjá athugasemd þar).
export const metadata = rondvaNotFoundMetadata;

export default function RondvaNotFound() {
  return <RondvaNotFoundView />;
}
