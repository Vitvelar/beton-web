// Home inspection (US/Canada, system order) — skýrslusnið `isop` + matskerfi `isop_terms`.
// Samningur: plan/rondva/ISOP-SNID-HONNUN.md (W1). Valið á stillingasíðunni er FALIÐ þar til
// DB-flutningurinn (beton-app PR #61: companies.report_standard/rating_scheme leyfa 'isop') er
// keyrður í framleiðslu og ISOP_ENABLED=1 er sett á Vercel. Þangað til er allt óbreytt.

const ISOP_COUNTRIES = new Set(["US", "CA"]);

/** Einn fasti: sjálfgefið óvirkt. Aðeins `ISOP_ENABLED=1` (þjónn) kveikir á valkostinum. */
export function isopEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.ISOP_ENABLED === "1";
}

/** Valkosturinn sést aðeins fyrirtækjum í US/CA (aldrei Beton/IS) og aðeins þegar kveikt er á honum. */
export function isopOfferedTo(country: unknown, enabled: boolean = isopEnabled()): boolean {
  return enabled && typeof country === "string" && ISOP_COUNTRIES.has(country.trim().toUpperCase());
}

/**
 * Texas-viðvörun (hönnun §6.4): satt fyrir state 'TX', ZIP 733xx/75xxx–79xxx/885xx eða heimilisfang
 * sem endar á „, TX“/„Texas“. Aldrei læsing. Fyrirtæki hafa ekkert fylki í gagnagrunninum í dag,
 * svo stillingasíðan sendir null þar til slík uppspretta er til.
 */
export function texasNotice({ state, postalCode, address }: { state?: string | null; postalCode?: string | null; address?: string | null }): boolean {
  if ((state ?? "").trim().toUpperCase() === "TX") return true;
  const zip = (postalCode ?? "").trim().match(/^(\d{3})\d{2}(?:-\d{4})?$/);
  if (zip) {
    const prefix = Number(zip[1]);
    if (prefix === 733 || (prefix >= 750 && prefix <= 799) || prefix === 885) return true;
  }
  return /(,\s*(TX|Texas)\.?)\s*$/i.test((address ?? "").trim());
}
