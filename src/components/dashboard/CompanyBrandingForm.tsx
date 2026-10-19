"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { normalizeTermsUrl } from "@/lib/terms-url";
import { btn, field, fieldError, fieldHelp, fieldLabel, spinner } from "@/lib/ui";

interface Props {
  userId: string;
  initial: {
    company_name: string;
    company_logo_url: string;
    company_terms_url: string;
    company_terms_text: string;
    qualifications?: string;
  };
  locale: DashboardLocale;
  /** Eigin skilmálatexti (ekki fyrir Beton, sem hefur fasta skilmála í skýrslunni). */
  showTermsText?: boolean;
  /** Réttindi skoðunarmanns (inspectors.qualifications) — aðeins á app.rondva.com og
   *  aðeins þegar NZS 4306-flutningurinn er kominn (annars er dálkurinn ekki til). */
  showQualifications?: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const ACCEPTED_TYPES = ACCEPT.split(",");
const MAX_BYTES = 2 * 1024 * 1024;

export function CompanyBrandingForm({ userId, initial, locale, showTermsText = false, showQualifications = false }: Props) {
  const t = dashboardCopy(locale).branding;
  const uid = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [companyName, setCompanyName] = useState(initial.company_name);
  const [termsUrl, setTermsUrl] = useState(initial.company_terms_url);
  const [termsText, setTermsText] = useState(initial.company_terms_text);
  const [qualifications, setQualifications] = useState(initial.qualifications ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.company_logo_url);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // Forskoðun úr vali á skrá: hreinsuð þegar valið breytist og þegar formið hverfur.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearFile() {
    setFile(null);
    setPreviewUrl(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setLogoError(null);
    setMessage(null);
    if (!next) {
      clearFile();
      return;
    }
    // Staðfest strax, svo villan sjáist undir reitnum en ekki fyrst við vistun.
    if (!ACCEPTED_TYPES.includes(next.type)) {
      clearFile();
      setLogoError(t.logoBadType);
      return;
    }
    if (next.size > MAX_BYTES) {
      clearFile();
      setLogoError(t.logoTooLarge);
      return;
    }
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  function onTermsBlur() {
    const normalized = normalizeTermsUrl(termsUrl);
    if (normalized === null) {
      setTermsError(t.termsUrlInvalid);
    } else {
      setTermsError(null);
      if (normalized !== termsUrl.trim()) setTermsUrl(normalized);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setMessage(null);

    const normalizedTerms = normalizeTermsUrl(termsUrl);
    if (normalizedTerms === null) {
      setTermsError(t.termsUrlInvalid);
      document.getElementById(`${uid}-terms-url`)?.focus();
      return;
    }
    setTermsError(null);
    if (logoError) return;

    setSaving(true);
    try {
      const supabase = createClient();
      let nextLogoUrl = logoUrl.trim();

      if (file) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
        // Ný slóð í hvert sinn svo vafrar og PDF-skyndiminni sæki nýja merkið.
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("company-logos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          console.error("logo upload failed:", upErr.message);
          setMessage({ kind: "error", text: t.uploadFailed });
          return;
        }
        nextLogoUrl = supabase.storage.from("company-logos").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase
        .from("inspectors")
        .update({
          company_name: companyName.trim() || null,
          company_terms_url: normalizedTerms || null,
          company_logo_url: nextLogoUrl || null,
          // Aðeins þegar reiturinn sést — Beton-síðan snertir aldrei þennan dálk.
          ...(showTermsText ? { company_terms_text: termsText.trim() || null } : {}),
          // Eigin röð skoðunarmanns (RLS), eins og hinir reitirnir; aðeins þegar reiturinn sést.
          ...(showQualifications ? { qualifications: qualifications.trim() || null } : {}),
        })
        .eq("user_id", userId);
      if (error) {
        console.error("branding save failed:", error.message);
        setMessage({ kind: "error", text: t.saveFailed });
        return;
      }

      setLogoUrl(nextLogoUrl);
      setTermsUrl(normalizedTerms);
      clearFile();
      setMessage({ kind: "ok", text: t.saved });
    } catch (err) {
      console.error("branding save threw:", err);
      setMessage({ kind: "error", text: t.genericError });
    } finally {
      setSaving(false);
    }
  }

  const preview = previewUrl ?? (logoUrl || null);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 rounded-xl border border-concrete bg-surface p-6">
      <div>
        <label htmlFor={`${uid}-company-name`} className={fieldLabel}>
          {t.companyName}
        </label>
        <input
          id={`${uid}-company-name`}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder={t.companyNamePlaceholder}
          aria-describedby={`${uid}-company-name-hint`}
          className={field()}
        />
        <p id={`${uid}-company-name-hint`} className={fieldHelp}>{t.companyNameHint}</p>
      </div>

      <div>
        <label htmlFor={`${uid}-terms-url`} className={fieldLabel}>
          {t.termsUrl}
        </label>
        <input
          id={`${uid}-terms-url`}
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          value={termsUrl}
          onChange={(e) => {
            setTermsUrl(e.target.value);
            setTermsError(null);
          }}
          onBlur={onTermsBlur}
          placeholder="https://…"
          aria-invalid={termsError ? true : undefined}
          aria-describedby={termsError ? `${uid}-terms-url-error` : `${uid}-terms-url-hint`}
          className={field()}
        />
        {termsError ? (
          <p id={`${uid}-terms-url-error`} role="alert" className={fieldError}>{termsError}</p>
        ) : (
          <p id={`${uid}-terms-url-hint`} className={fieldHelp}>{t.termsUrlHint}</p>
        )}
      </div>

      {showTermsText ? (
        <div>
          <label htmlFor={`${uid}-terms-text`} className={fieldLabel}>
            {t.termsText}
          </label>
          <textarea
            id={`${uid}-terms-text`}
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            rows={8}
            maxLength={20000}
            aria-describedby={`${uid}-terms-text-hint`}
            className={field("box", "resize-y")}
          />
          <p id={`${uid}-terms-text-hint`} className={fieldHelp}>{t.termsTextHint}</p>
        </div>
      ) : null}

      {showQualifications ? (
        <div>
          <label htmlFor={`${uid}-qualifications`} className={fieldLabel}>
            {t.qualifications}
          </label>
          <input
            id={`${uid}-qualifications`}
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            placeholder={t.qualificationsPlaceholder}
            maxLength={300}
            aria-describedby={`${uid}-qualifications-hint`}
            className={field()}
          />
          <p id={`${uid}-qualifications-hint`} className={fieldHelp}>{t.qualificationsHint}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${uid}-logo`} className={fieldLabel}>{t.logo}</label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-line-strong bg-paper-alt p-2 sm:w-40 sm:shrink-0">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={t.logoAlt} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-fog">{t.noLogo}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              ref={fileInput}
              id={`${uid}-logo`}
              type="file"
              accept={ACCEPT}
              onChange={onFileChange}
              aria-invalid={logoError ? true : undefined}
              aria-describedby={logoError ? `${uid}-logo-error` : `${uid}-logo-hint`}
              className="block w-full text-sm text-ink file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border-0 file:bg-navy file:px-5 file:text-sm file:font-semibold file:text-paper hover:file:bg-navy-deep"
            />
            {logoError ? (
              <p id={`${uid}-logo-error`} role="alert" className={fieldError}>{logoError}</p>
            ) : (
              <p id={`${uid}-logo-hint`} className="text-xs text-fog">{t.logoHint}</p>
            )}
            <div className="flex flex-wrap gap-x-4">
              {file ? (
                <button
                  type="button"
                  onClick={clearFile}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-navy underline-offset-4 hover:underline"
                >
                  {t.clearLogoSelection}
                </button>
              ) : null}
              {logoUrl && !file ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-danger underline-offset-4 hover:underline"
                >
                  {t.removeLogo}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div role="status" className="min-h-5 text-sm text-success">
        {message?.kind === "ok" ? message.text : null}
      </div>
      {message?.kind === "error" ? (
        <p role="alert" className="text-sm text-danger">{message.text}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} aria-busy={saving} className={btn("primary")}>
          {saving ? <span aria-hidden="true" className={spinner} /> : null}
          {saving ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
