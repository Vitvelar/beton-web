import { CountryPage } from "@/components/rondva/CountryPage";
import { US, countryMetadata } from "@/lib/rondva-countries";

// rondva.com/us — texti og verð í src/lib/rondva-countries.ts, útlit í CountryPage.
export const metadata = countryMetadata(US);

export default function RondvaUsPage() {
  return <CountryPage country={US} />;
}
