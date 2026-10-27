// Hverjir mega sjá vaxtar- og stöðusíðu Rondva (/dashboard/stada) og stöðupóstinn?
// Aðeins eigendur Vitvéla. Gamli netfangalistinn (src/lib/allowed-users.ts) inniheldur líka
// Braga (beton@beton.is) — hann á EKKI að sjá sölu- og tekjutölur Rondva, svo listinn er þrengri hér.
export const GROWTH_ADMIN_EMAILS = ["hjalti@vitvelar.is", "alex@vitvelar.is"];

export function isGrowthAdmin(email: string | null | undefined): boolean {
  return !!email && GROWTH_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
