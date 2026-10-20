import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetonLogin } from "@/components/dashboard/BetonLogin";
import { RondvaLogin } from "@/components/rondva/RondvaLogin";
import { createClient } from "@/lib/supabase/server";
import { checkDashboardAccess } from "@/lib/access";
import { ONBOARDING_PATH, onboardingFor } from "@/lib/onboarding";
import type { Brand } from "@/lib/brand";
import { getRequestBrand } from "@/lib/request-brand";
import { shellCopy } from "@/lib/i18n/dashboard-shell";

// admin.beton.is fær óbreytta Beton-innskráningu; app.rondva.com fær Rondva.
//
// „Sign in with Apple" birtist aðeins þegar RONDVA_APPLE_SIGNIN=1 er sett á
// Vercel — þ.e. eftir að Services ID + lykill eru komin í Supabase (sjá
// scripts/apple-signin-secret.mjs). Fyrr myndi hnappurinn enda á villu.

export async function generateMetadata(): Promise<Metadata> {
  // Innskráðir notendur eru á stjórnborðinu sjálfu; síðan sést óinnskráðum: Beton á
  // íslensku, Rondva á ensku (tungumálið er óþekkt fyrr en notandinn er innskráður).
  const brand = await getRequestBrand();
  return { title: shellCopy(brand === "rondva" ? "en" : "is").meta.loginTitle };
}

export default async function DashboardLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const brand = await getRequestBrand();

  // „Log in“ á kynningarsíðunni vísar hingað; sá sem er þegar inni fer beint á
  // stjórnborðið. Ekki ef villa er í slóðinni (þá á hann að sjá hana, og það rýfur
  // endurvísunarhringi við proxy.ts). Rondva: innskráður notandi án fyrirtækis (eða sem
  // bíður samþykkis) fer á nýskráninguna.
  const { error } = await searchParams;
  const destination = error ? null : await signedInDestination(brand);
  if (destination) redirect(destination);

  if (brand === "rondva") {
    return (
      <Suspense>
        <RondvaLogin appleEnabled={process.env.RONDVA_APPLE_SIGNIN === "1"} />
      </Suspense>
    );
  }

  return (
    <Suspense>
      <BetonLogin />
    </Suspense>
  );
}

async function signedInDestination(brand: Brand): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const access = await checkDashboardAccess(supabase, user.email, brand);
    if (access.allowed) return "/dashboard";
    return onboardingFor(brand, access) ? ONBOARDING_PATH : null;
  } catch {
    return null;
  }
}
