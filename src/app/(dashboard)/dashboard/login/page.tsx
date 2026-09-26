import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BetonLogin } from "@/components/dashboard/BetonLogin";
import { RondvaLogin } from "@/components/rondva/RondvaLogin";
import { createClient } from "@/lib/supabase/server";
import { checkDashboardAccess } from "@/lib/access";
import { getRequestBrand } from "@/lib/request-brand";

// admin.beton.is fær óbreytta Beton-innskráningu; app.rondva.com fær Rondva.
//
// „Sign in with Apple" birtist aðeins þegar RONDVA_APPLE_SIGNIN=1 er sett á
// Vercel — þ.e. eftir að Services ID + lykill eru komin í Supabase (sjá
// scripts/apple-signin-secret.mjs). Fyrr myndi hnappurinn enda á villu.

export async function generateMetadata(): Promise<Metadata> {
  return (await getRequestBrand()) === "rondva" ? { title: "Sign in" } : {};
}

export default async function DashboardLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const brand = await getRequestBrand();

  if (brand === "rondva") {
    // „Log in" á rondva.com vísar hingað; sá sem er þegar inni fer beint á
    // stjórnborðið. Ekki ef villa er í slóðinni (þá á hann að sjá hana).
    const { error } = await searchParams;
    if (!error && (await hasActiveSession())) redirect("/dashboard");

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

async function hasActiveSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    return (await checkDashboardAccess(supabase, user.email)).allowed;
  } catch {
    return false;
  }
}
