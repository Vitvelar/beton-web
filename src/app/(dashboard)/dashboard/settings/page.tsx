import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CompanyBrandingForm } from "@/components/dashboard/CompanyBrandingForm";

export const metadata = { title: "Stillingar" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: inspector } = await supabase
    .from("inspectors")
    .select("full_name, company_name, company_logo_url, company_terms_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-fog">Stillingar</p>
          <h1 className="text-2xl font-bold text-ink">Fyrirtæki og merki</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-fog hover:text-ink">
          ← Skoðanir
        </Link>
      </div>

      {inspector ? (
        <CompanyBrandingForm
          userId={user.id}
          initial={{
            company_name: inspector.company_name ?? "",
            company_logo_url: inspector.company_logo_url ?? "",
            company_terms_url: inspector.company_terms_url ?? "",
          }}
        />
      ) : (
        <p className="rounded-xl border border-concrete bg-white p-6 text-sm text-fog">
          Enginn skoðunarmaður er skráður á þennan aðgang ennþá. Opnaðu appið einu sinni svo
          skoðunarmannsprófíllinn verði til, og komdu svo aftur hingað.
        </p>
      )}

      <p className="mt-6 text-xs text-fog">
        Skoðunarmaður: {inspector?.full_name ?? user.email}. Nafnið á skýrslunni kemur úr
        skoðuninni sjálfri ef það er skráð þar.
      </p>
    </div>
  );
}
