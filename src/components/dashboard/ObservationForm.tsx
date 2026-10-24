"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateObservation } from "@/app/(dashboard)/dashboard/[id]/actions";
import { SeverityBadge } from "./SeverityBadge";
import { GuardedLink } from "./GuardedLink";
import { useUnsavedGuard } from "./useUnsavedGuard";
import type { Observation, Severity } from "@/lib/supabase/types";
import { categoryLabel, dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import type { RatingScheme } from "@/lib/report/settings";
import { btn, field, fieldError, fieldLabel, spinner } from "@/lib/ui";

// Geymd gildi (íslenska) — birtingarheitið kemur úr katalóginu.
const CATEGORIES = [
  "Veggir",
  "Gólfefni",
  "Loft",
  "Hurðir",
  "Gluggar",
  "Skápar",
  "Rafmagn",
  "Lagnir",
  "Loftræsting",
  "Þak",
  "Einangrun",
  "Raki",
  "Burðarvirki",
  "Annað",
];

const SEVERITIES: Severity[] = ["athugasemd", "alvarleg", "mjog_alvarleg"];

interface Values {
  title: string;
  category: string;
  severity: Severity;
  description: string;
  suggestion: string;
}

export function ObservationForm({
  observation,
  inspectionId,
  locale,
  scheme = "standard",
  backHref,
  backLabel,
}: {
  observation: Observation;
  inspectionId: string;
  locale: DashboardLocale;
  scheme?: RatingScheme;
  /** Tengill til baka neðst í forminu (sama og efst á síðunni); sjálfgefið skoðunin. */
  backHref?: string;
  backLabel?: string;
}) {
  const copy = dashboardCopy(locale);
  const t = copy.observation;
  const router = useRouter();
  const uid = useId();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  const initial: Values = {
    title: observation.title,
    category: observation.category ?? "",
    severity: observation.severity,
    description: observation.description ?? "",
    suggestion: observation.suggestion ?? "",
  };
  // Síðast vistuðu gildin — óvistaðar breytingar eru munurinn á þeim og reitunum.
  const [baseline, setBaseline] = useState<Values>(initial);
  const [values, setValues] = useState<Values>(initial);

  const dirty =
    values.title !== baseline.title ||
    values.category !== baseline.category ||
    values.severity !== baseline.severity ||
    values.description !== baseline.description ||
    values.suggestion !== baseline.suggestion;
  useUnsavedGuard(dirty, copy.common.unsavedLeave);

  function change(patch: Partial<Values>) {
    setValues((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setError(null);
    if (patch.title !== undefined) setTitleError(null);
  }

  // Flokkur sem er ekki á fastalistanum (t.d. úr kynningargögnum) helst valinn.
  const categories =
    values.category && !CATEGORIES.includes(values.category) ? [values.category, ...CATEGORIES] : CATEGORIES;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;
    setSaved(false);
    setError(null);

    if (!values.title.trim()) {
      setTitleError(t.titleRequired);
      document.getElementById(`${uid}-title`)?.focus();
      return;
    }
    setTitleError(null);

    const snapshot = values;
    startTransition(async () => {
      try {
        const result = await updateObservation(observation.id, {
          title: snapshot.title,
          category: snapshot.category.trim() || null,
          severity: snapshot.severity,
          description: snapshot.description.trim() || null,
          suggestion: snapshot.suggestion.trim() || null,
        });

        if ("error" in result) {
          if (result.field === "title") setTitleError(result.error);
          else setError(result.error);
        } else {
          setBaseline(snapshot);
          setSaved(true);
          router.refresh();
        }
      } catch {
        // Netsambandsrof o.þ.h.: textinn í reitunum helst.
        setError(t.saveFailed);
      }
    });
  }

  const titleId = `${uid}-title`;
  const titleErrorId = `${uid}-title-error`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-xl border border-concrete bg-surface p-6"
    >
      {/* Title */}
      <div>
        <label htmlFor={titleId} className={fieldLabel}>
          {t.title}
        </label>
        <input
          id={titleId}
          type="text"
          value={values.title}
          onChange={(e) => change({ title: e.target.value })}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? titleErrorId : undefined}
          aria-required="true"
          className={field()}
        />
        {titleError ? (
          <p id={titleErrorId} role="alert" className={fieldError}>
            {titleError}
          </p>
        ) : null}
      </div>

      {/* Category + Severity row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${uid}-category`} className={fieldLabel}>
            {t.category}
          </label>
          <select
            id={`${uid}-category`}
            value={values.category}
            onChange={(e) => change({ category: e.target.value })}
            className={field()}
          >
            <option value="">{t.chooseCategory}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(copy, c)}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className={fieldLabel}>{t.severity}</legend>
          <div className="flex flex-wrap gap-2">
            {SEVERITIES.map((s) => {
              const selected = values.severity === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => change({ severity: s })}
                  className={`inline-flex min-h-11 items-center rounded-full px-3 transition-colors duration-150 ${
                    selected
                      ? "bg-surface ring-2 ring-navy"
                      : "ring-1 ring-line-strong hover:bg-paper-alt"
                  }`}
                >
                  <SeverityBadge severity={s} locale={locale} scheme={scheme} />
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Description */}
      <div>
        <label htmlFor={`${uid}-description`} className={fieldLabel}>
          {t.description}
        </label>
        <textarea
          id={`${uid}-description`}
          value={values.description}
          onChange={(e) => change({ description: e.target.value })}
          rows={8}
          placeholder={t.descriptionPlaceholder}
          className={field("box", "resize-y")}
        />
      </div>

      {/* Suggestion */}
      <div>
        <label htmlFor={`${uid}-suggestion`} className={fieldLabel}>
          {t.suggestion}
        </label>
        <textarea
          id={`${uid}-suggestion`}
          value={values.suggestion}
          onChange={(e) => change({ suggestion: e.target.value })}
          rows={6}
          placeholder={t.suggestionPlaceholder}
          className={field("box", "resize-y")}
        />
      </div>

      {/* Save */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} aria-busy={isPending} className={btn("primary")}>
          {isPending ? <span aria-hidden="true" className={spinner} /> : null}
          {isPending ? t.saving : t.save}
        </button>
        <GuardedLink href={backHref ?? `/dashboard/${inspectionId}`} className={btn("quiet")}>
          {backLabel ?? copy.common.back}
        </GuardedLink>

        <div aria-live="polite" className="text-sm">
          {saved ? <span className="text-success">{t.saved}</span> : null}
          {!saved && dirty && !isPending ? <span className="text-fog">{t.unsaved}</span> : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
