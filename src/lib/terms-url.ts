// Slóð á skilmála fyrirtækis (Stillingar → Merki): autt = engin slóð; án http(s):// er
// https:// bætt framan við. Skilar null ef þetta er ekki nothæf vefslóð.
export function normalizeTermsUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    // „fyrirtaeki“ án punkts er ekki vefslóð sem vafrinn nær í.
    if (!url.hostname.includes(".")) return null;
    return withScheme;
  } catch {
    return null;
  }
}
