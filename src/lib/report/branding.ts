// Fyrirtækjamerki og -nafn í skýrslum (white-label). Hver skoðunarmaður á
// `inspectors.company_*`; sé ekkert skráð fellur allt á Beton-sjálfgildin svo
// eldri gögn og eldri skýrslur breytast ekki.

export interface InspectorBrandingRow {
  full_name?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  company_terms_url?: string | null;
}

export interface ReportBranding {
  /** Lögheiti fyrirtækis eins og það birtist í skýrslu, t.d. "Beton ehf." */
  name: string;
  /** Stutt form í hástöfum fyrir forsíðu, t.d. "BETON EHF." */
  nameUpper: string;
  /** Slóð á merki; null = ekkert merki (aðeins nafn) */
  logoUrl: string | null;
  /** Slóð á skilmála; null = sleppa setningunni um skilmála */
  termsUrl: string | null;
  /** Nafn skoðunarmanns; propertyData.inspectorName hefur forgang */
  inspectorName: string;
}

export const DEFAULT_BRANDING: ReportBranding = {
  name: "Beton ehf.",
  nameUpper: "BETON EHF.",
  logoUrl: "/images/beton-logo.webp",
  termsUrl: "https://www.betonehf.is/s/skilmalarbetonehf.pdf",
  inspectorName: "Bragi Michaelsson",
};

export function resolveBranding(
  inspector: InspectorBrandingRow | null | undefined,
  propertyInspectorName?: unknown
): ReportBranding {
  const name = inspector?.company_name?.trim() || DEFAULT_BRANDING.name;
  const isDefaultCompany = name === DEFAULT_BRANDING.name;
  const logoUrl =
    inspector?.company_logo_url?.trim() ||
    (isDefaultCompany ? DEFAULT_BRANDING.logoUrl : null);
  const termsUrl =
    inspector?.company_terms_url?.trim() ||
    (isDefaultCompany ? DEFAULT_BRANDING.termsUrl : null);
  const inspectorName =
    (typeof propertyInspectorName === "string" && propertyInspectorName.trim()) ||
    inspector?.full_name?.trim() ||
    DEFAULT_BRANDING.inspectorName;
  return {
    name,
    nameUpper: name.toUpperCase(),
    logoUrl,
    termsUrl,
    inspectorName,
  };
}
