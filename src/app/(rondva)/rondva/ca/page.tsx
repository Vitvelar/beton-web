import { CountryPage } from "@/components/rondva/CountryPage";
import { CA, countryMetadata } from "@/lib/rondva-countries";

// rondva.com/ca — texti og verð í src/lib/rondva-countries.ts, útlit í CountryPage.
export const metadata = countryMetadata(CA);

export default function RondvaCaPage() {
  return <CountryPage country={CA} />;
}
