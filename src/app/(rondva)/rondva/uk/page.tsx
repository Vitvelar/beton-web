import { CountryPage } from "@/components/rondva/CountryPage";
import { UK, countryMetadata } from "@/lib/rondva-countries";

// rondva.com/uk — texti og verð í src/lib/rondva-countries.ts, útlit í CountryPage.
export const metadata = countryMetadata(UK);

export default function RondvaUkPage() {
  return <CountryPage country={UK} />;
}
