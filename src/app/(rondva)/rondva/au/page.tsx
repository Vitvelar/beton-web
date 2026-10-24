import { CountryPage } from "@/components/rondva/CountryPage";
import { AU, countryMetadata } from "@/lib/rondva-countries";

// rondva.com/au — texti og verð í src/lib/rondva-countries.ts, útlit í CountryPage.
export const metadata = countryMetadata(AU);

export default function RondvaAuPage() {
  return <CountryPage country={AU} />;
}
