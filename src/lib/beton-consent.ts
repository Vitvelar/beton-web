// Samþykki fyrir vafrakökur á beton.is (markaðs- og greiningarkökur í Google
// Tag Manager: Meta pixel, Google Ads). Valið er geymt í localStorage og
// speglað í köku, og sent GTM með Google Consent Mode v2.
//
// Röð atburða á síðu:
//   1. Inline-skrifta í <head> (BetonHtml → consentDefaultScript) setur
//      gtag('consent','default', …) ÁÐUR en GTM hleðst — „denied“ nema vistað
//      samþykki finnist, þá „granted“ strax svo pixel fire-i líka hjá þeim sem
//      þegar samþykktu.
//   2. CookieBanner birtist þeim sem hafa ekki valið. Samþykkja/Hafna →
//      writeConsent(): vistar valið og pushar gtag('consent','update', …) á
//      dataLayer, svo töggin í GTM bregðast við strax án endurhleðslu.
//
// Ingvar stýrir töggunum í GTM og setur consent-skilyrði þar (ad_storage o.fl.).

export const CONSENT_STORAGE_KEY = "beton_cookie_consent";
export const CONSENT_COOKIE = "beton_cookie_consent";
export const CONSENT_VERSION = 1;
/** 12 mánuðir: þá er spurt aftur. */
export const CONSENT_MAX_AGE_DAYS = 365;
export const CONSENT_CHANGED_EVENT = "beton-consent-changed";
export const CONSENT_OPEN_EVENT = "beton-consent-open";

export type ConsentChoice = "granted" | "denied";

export interface ConsentState {
  v: number;
  choice: ConsentChoice;
  ts: string;
}

type GtagConsentFlags = Record<
  "ad_storage" | "analytics_storage" | "ad_user_data" | "ad_personalization",
  ConsentChoice
>;

function consentFlags(choice: ConsentChoice): GtagConsentFlags {
  return {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  };
}

/** Vistað val, eða null ef gesturinn hefur ekki valið (eða valið er útrunnið/ógilt). */
export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.v !== CONSENT_VERSION) return null;
    if (parsed.choice !== "granted" && parsed.choice !== "denied") return null;
    if (typeof parsed.ts !== "string") return null;
    const age = Date.now() - new Date(parsed.ts).getTime();
    if (!Number.isFinite(age) || age > CONSENT_MAX_AGE_DAYS * 86_400_000) return null;
    return { v: CONSENT_VERSION, choice: parsed.choice, ts: parsed.ts };
  } catch {
    return null;
  }
}

/** Vistar valið og lætur GTM vita strax (Consent Mode v2 „update“). */
export function writeConsent(choice: ConsentChoice): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, choice, ts: new Date().toISOString() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // einkavafri / lokað fyrir geymslu — valið gildir samt þessa heimsókn
  }
  try {
    document.cookie = `${CONSENT_COOKIE}=${choice}; Max-Age=${CONSENT_MAX_AGE_DAYS * 86_400}; Path=/; SameSite=Lax; Secure`;
  } catch {
    // ignore
  }
  pushConsentUpdate(choice);
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_CHANGED_EVENT, { detail: state }));
  return state;
}

/** Opnar borðann aftur (t.d. úr fæti) svo gestur geti breytt vali. */
export function openConsentBanner() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

// gtag() verður að pusha `arguments`-hlutnum sjálfum (ekki fylki) — GTM þekkir
// consent-skipanir aðeins á því formi. Sama skilgreining og í head-skriftunni.
function pushConsentUpdate(choice: ConsentChoice) {
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  const gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  } as (...args: unknown[]) => void;
  gtag("consent", "update", consentFlags(choice));
}

/**
 * Inline-skrifta fyrir <head>, keyrð ÁÐUR en GTM-ræsiskriftan: sjálfgefið
 * „denied“ á öllu (Consent Mode v2), nema gilt vistað samþykki finnist.
 * Engin ytri köll, engin innsetning gagna frá notanda — fastur strengur.
 */
export function consentDefaultScript(): string {
  const denied = JSON.stringify(consentFlags("denied"));
  const granted = JSON.stringify(consentFlags("granted"));
  return (
    "(function(w){w.dataLayer=w.dataLayer||[];function g(){w.dataLayer.push(arguments);}" +
    "var c=false;try{var r=w.localStorage.getItem('" + CONSENT_STORAGE_KEY + "');" +
    "if(r){var p=JSON.parse(r);c=p&&p.v===" + CONSENT_VERSION + "&&p.choice==='granted'&&" +
    "typeof p.ts==='string'&&(Date.now()-new Date(p.ts).getTime())<" + CONSENT_MAX_AGE_DAYS * 86_400_000 + ";}}catch(e){}" +
    "g('consent','default',c?" + granted + ":" + denied + ");" +
    "})(window);"
  );
}
