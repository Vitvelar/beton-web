import { CountryPage } from "@/components/rondva/CountryPage";
import { IE, countryMetadata } from "@/lib/rondva-countries";

// rondva.com/ie — texti og verð í src/lib/rondva-countries.ts, útlit í CountryPage.
export const metadata = countryMetadata(IE);

export default function RondvaIePage() {
  return <CountryPage country={IE} />;
}
