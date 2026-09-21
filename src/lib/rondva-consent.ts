// Samþykkisstaða fyrir vafrakökur á rondva.com. Geymt í localStorage og
// speglað í köku svo þjónn geti lesið síðar ef þarf. Sjá /cookies.

export const CONSENT_STORAGE_KEY = "rv_consent";
export const CONSENT_COOKIE = "rv_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_CHANGED_EVENT = "rv-consent-changed";
export const CONSENT_OPEN_EVENT = "rv-consent-open";

export interface ConsentState {
  v: number;
  analytics: boolean;
  marketing: boolean;
  ts: string;
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      v: CONSENT_VERSION,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      ts: typeof parsed.ts === "string" ? parsed.ts : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    v: CONSENT_VERSION,
    analytics: choice.analytics,
    marketing: choice.marketing,
    ts: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // einkavafri / lokað fyrir geymslu — höldum áfram í minni
  }
  try {
    const value = `${state.analytics ? "a" : ""}${state.marketing ? "m" : ""}` || "none";
    document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax; Secure`;
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: state }));
  return state;
}

export function openConsentDialog() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** Tilkynna umbreytingu (t.d. biðlistaskráningu) til þeirra mælitækja sem eru hlaðin. */
export function trackLead(source: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  try {
    w.gtag?.("event", "generate_lead", { event_category: "waitlist", event_label: source });
  } catch {
    // ignore
  }
  try {
    w.fbq?.("track", "Lead", { content_name: source });
  } catch {
    // ignore
  }
}
