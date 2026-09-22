"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  initial: {
    company_name: string;
    company_logo_url: string;
    company_terms_url: string;
  };
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 2 * 1024 * 1024;

export function CompanyBrandingForm({ userId, initial }: Props) {
  const [companyName, setCompanyName] = useState(initial.company_name);
  const [termsUrl, setTermsUrl] = useState(initial.company_terms_url);
  const [logoUrl, setLogoUrl] = useState(initial.company_logo_url);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const supabase = createClient();
      let nextLogoUrl = logoUrl.trim();

      if (file) {
        if (file.size > MAX_BYTES) throw new Error("Merkið má mest vera 2 MB.");
        const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
        // Ný slóð í hvert sinn svo vafrar og PDF-skyndiminni sæki nýja merkið.
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("company-logos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error(`Upphleðsla mistókst: ${upErr.message}`);
        nextLogoUrl = supabase.storage.from("company-logos").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase
        .from("inspectors")
        .update({
          company_name: companyName.trim() || null,
          company_terms_url: termsUrl.trim() || null,
          company_logo_url: nextLogoUrl || null,
        })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);

      setLogoUrl(nextLogoUrl);
      setFile(null);
      setMessage({ kind: "ok", text: "Vistað. Nýjar skýrslur nota þessar upplýsingar." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Villa kom upp." });
    } finally {
      setSaving(false);
    }
  }

  const preview = file ? URL.createObjectURL(file) : logoUrl || null;

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-concrete bg-white p-6">
      <div>
        <label htmlFor="company_name" className="block text-xs font-mono uppercase tracking-wider text-fog mb-1.5">
          Nafn fyrirtækis
        </label>
        <input
          id="company_name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="t.d. Beton ehf."
          className="w-full rounded-md border border-concrete-dk bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
        />
        <p className="mt-1 text-xs text-fog">Birtist á forsíðu skýrslu, í inngangi og í skilmálum.</p>
      </div>

      <div>
        <label htmlFor="company_terms_url" className="block text-xs font-mono uppercase tracking-wider text-fog mb-1.5">
          Slóð á skilmála (valfrjálst)
        </label>
        <input
          id="company_terms_url"
          type="url"
          value={termsUrl}
          onChange={(e) => setTermsUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-md border border-concrete-dk bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
        />
        <p className="mt-1 text-xs text-fog">Ef tómt er setningin um skilmála ekki í skýrslunni.</p>
      </div>

      <div>
        <span className="block text-xs font-mono uppercase tracking-wider text-fog mb-1.5">Merki</span>
        <div className="flex items-start gap-5">
          <div className="flex h-24 w-40 items-center justify-center rounded-md border border-dashed border-concrete-dk bg-stone-50 p-2">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Merki" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-fog">Ekkert merki</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept={ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-navy-deep"
            />
            <p className="text-xs text-fog">PNG, JPG, WebP eða SVG, mest 2 MB. Best er merki með gegnsæjum bakgrunni, a.m.k. 600 px á breidd.</p>
            {logoUrl && !file ? (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="text-xs text-sev-danger hover:underline"
              >
                Fjarlægja merki
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {message ? (
        <p className={`text-sm ${message.kind === "ok" ? "text-emerald-700" : "text-sev-danger"}`}>{message.text}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-50"
        >
          {saving ? "Vista…" : "Vista"}
        </button>
      </div>
    </form>
  );
}
