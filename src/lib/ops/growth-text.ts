import type { DashboardLocale } from "@/lib/i18n/dashboard";
import { format, type StadaCopy } from "@/lib/i18n/stada";
import { countryName, type GrowthAlert } from "@/lib/ops/growth";

// Sniðföll og viðvörunartextar sem stöðusíðan og stöðupósturinn deila (sömu tölur, sama snið).

export function fmtInt(n: number, locale: DashboardLocale): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

/** USD: tveir aukastafir undir 100, annars heil tala. */
export function fmtUsd(n: number, locale: DashboardLocale): string {
  const digits = Math.abs(n) < 100 && !Number.isInteger(n) ? 2 : 0;
  return `$${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)}`;
}

export function fmtPct(n: number | null, locale: DashboardLocale, digits = 1): string {
  if (n === null) return "–";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n)}%`;
}

/** Breyting frá fyrri viku: ▲ +3 / ▼ −2 / – 0 (örvar svo litur sé ekki eina vísbendingin). */
export function fmtDelta(current: number, previous: number, locale: DashboardLocale, money = false): { text: string; dir: "up" | "down" | "flat" } {
  const d = current - previous;
  const num = money ? fmtUsd(Math.abs(d), locale) : fmtInt(Math.abs(d), locale);
  if (Math.abs(d) < 0.005) return { text: `– ${money ? "$0" : "0"}`, dir: "flat" };
  return d > 0 ? { text: `▲ +${num}`, dir: "up" } : { text: `▼ −${num}`, dir: "down" };
}

/** „2026-10-26 09:00" (UTC). */
export function fmtStamp(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

/** „26. okt" / „Oct 26" fyrir dagsetningu ('YYYY-MM-DD'). */
export function fmtShortDate(date: string, locale: DashboardLocale): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function alertMessage(t: StadaCopy["alerts"], a: GrowthAlert, locale: DashboardLocale): string {
  const country = a.cc ? countryName(a.cc, locale) : "";
  const value = a.value !== undefined ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(a.value) : "";
  switch (a.kind) {
    case "bounce":
      return format(t.bounce, { value });
    case "bounce_country":
      return format(t.bounceCountry, { country, value });
    case "inventory":
      return format(t.inventory, { country, value });
    case "kill_switch":
      return a.cc ? format(t.killSwitchCountry, { country }) : t.killSwitchGlobal;
    case "fx_missing":
      return format(t.fxMissing, { value });
  }
}
