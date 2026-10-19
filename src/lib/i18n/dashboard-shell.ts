import type { DashboardLocale } from "./dashboard";
export { fill, format, plural } from "./format";

// Textar stjórnborðsskeljarins (haus, skrár, listi, nýskráning, innskráning) sem bættust
// við í UX-yfirferðinni 2026-10. Sama lögun og src/lib/i18n/dashboard.ts: einn hlutur á
// hvert tungumál, TypeScript krefst allra lykla í `en`, og sömu hjálparföll (fill/format).
// Eldri textar skeljarins búa áfram í dashboard.ts; hér er aðeins það sem er nýtt.
//
// Beton (admin.beton.is) er alltaf `is`. Rondva er `en` nema notandinn hafi valið annað.

const is = {
  skipToContent: "Fara í efni",
  header: {
    nav: "Stjórnborð",
    signingOut: "Skrái út…",
  },
  meta: {
    betonDescription: "Stjórnborð Beton ehf. fyrir skoðunarmenn.",
    loginTitle: "Innskráning",
  },
  list: {
    emptyNext: "Opnaðu appið, byrjaðu skoðun og hún samstillist hingað sjálfkrafa.",
  },
  settings: {
    autoSave: "Tungumál og skýrslustillingar vistast um leið og þú breytir þeim.",
  },
  // Innskráning Beton (admin.beton.is).
  betonLogin: {
    heading: "Innskráning í stjórnborð",
    googleSignIn: "Innskrá með Google",
    googleOpening: "Opna Google…",
    logoAlt: "Beton ehf.",
    errorUnauthorized: "Þetta netfang hefur ekki aðgang að Beton stjórnborðinu.",
    errorOauth: "Innskráning með Google mistókst. Reyndu aftur.",
  },
  // Innskráning Rondva — aðeins lýsingar fyrir skjálesara og villur (aðalefnið er á ensku).
  rondvaLogin: {
    homeLabel: "Rondva, forsíða",
    googleOpening: "Opna Google…",
    appleOpening: "Opna Apple…",
    signInFailed: "Innskráningin fór ekki af stað. Reyndu aftur.",
    metaTitle: "Innskráning",
  },
  onboarding: {
    homeLabel: "Rondva, forsíða",
    signingOut: "Skrái út…",
    checkingAgain: "Athuga…",
    stillReviewing: "Við erum enn að fara yfir fyrirtækið. Síðast athugað kl. {time}.",
    checkFailed: "Ekki tókst að athuga stöðuna. Reyndu aftur eftir smástund.",
    navStalled: "Fyrirtækið var skráð en næsta síða opnaðist ekki. Reyndu aftur.",
    signedInAs: "Skráð inn sem {email}",
  },
  emptyRondva: {
    title: "Engar skoðanir ennþá",
    intro: "Skoðanir sem samstillast úr appinu birtast hér. Þrjú skref til að byrja:",
    step1Title: "Náðu í Rondva í iPhone",
    step1Body: "Skráðu þig inn með sama aðgangi og hér.",
    step2Title: "Settu inn merki og skilmála skýrslna",
    step2Body: "Þetta fer á forsíðu og aftast í hverri skýrslu.",
    step2Link: "Opna stillingar",
    step3Title: "Byrjaðu fyrstu skoðunina",
    offerLine: "Fyrsti mánuðurinn er ókeypis — {count} skýrslur samdar með gervigreind fyrsta mánuðinn. Ekkert kort.",
  },
};

export type DashboardShellCopy = typeof is;

const en: DashboardShellCopy = {
  skipToContent: "Skip to content",
  header: {
    nav: "Dashboard",
    signingOut: "Signing out…",
  },
  meta: {
    betonDescription: "Stjórnborð Beton ehf. fyrir skoðunarmenn.",
    loginTitle: "Sign in",
  },
  list: {
    emptyNext: "Open the app, start an inspection, and it syncs here automatically.",
  },
  settings: {
    autoSave: "Language and report settings save as soon as you change them.",
  },
  betonLogin: {
    heading: "Sign in to the dashboard",
    googleSignIn: "Sign in with Google",
    googleOpening: "Opening Google…",
    logoAlt: "Beton ehf.",
    errorUnauthorized: "This email address does not have access to the Beton dashboard.",
    errorOauth: "Signing in with Google failed. Please try again.",
  },
  rondvaLogin: {
    homeLabel: "Rondva home",
    googleOpening: "Opening Google…",
    appleOpening: "Opening Apple…",
    signInFailed: "Sign-in didn't start. Please try again.",
    metaTitle: "Sign in",
  },
  onboarding: {
    homeLabel: "Rondva home",
    signingOut: "Signing out…",
    checkingAgain: "Checking…",
    stillReviewing: "We're still reviewing your company. Last checked at {time}.",
    checkFailed: "We couldn't check the status. Please try again in a moment.",
    navStalled: "Your company was registered, but the next page didn't open. Please try again.",
    signedInAs: "Signed in as {email}",
  },
  emptyRondva: {
    title: "No inspections yet",
    intro: "Inspections synced from the app appear here. Three steps to get going:",
    step1Title: "Get Rondva on your iPhone",
    step1Body: "Sign in with the same account you used here.",
    step2Title: "Add your logo and report terms",
    step2Body: "They go on the cover and the last page of every report.",
    step2Link: "Open settings",
    step3Title: "Start your first inspection",
    offerLine: "First month free — {count} AI-drafted reports in your first month. No card.",
  },
};

export const DASHBOARD_SHELL_COPY: Readonly<Record<DashboardLocale, DashboardShellCopy>> = { is, en };

export function shellCopy(locale: DashboardLocale): DashboardShellCopy {
  return DASHBOARD_SHELL_COPY[locale];
}
