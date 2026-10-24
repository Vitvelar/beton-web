"use client";

// Ritill fyrir skýrslutextann: breytir ai_report_data snapshot-inu beint
// (samantekt + lýsing/tillaga hverrar athugasemdar) og endurgerir PDF án þess
// að keyra AI aftur. Fyrir vinnuflæðið "AI-tillagan er skrítin → laga/eyða
// henni → fá lokaskýrslu" sem áður var gert í Canva.

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateReportText,
  type ReportTextEdit,
} from "@/app/(dashboard)/dashboard/[id]/actions";
import { GuardedLink } from "./GuardedLink";
import { ReportProgress } from "./ReportProgress";
import { SeverityBadge } from "./SeverityBadge";
import { useUnsavedGuard } from "./useUnsavedGuard";
import type { Severity } from "@/lib/supabase/types";
import { dashboardCopy, fill, format, plural, type DashboardLocale } from "@/lib/i18n/dashboard";
import { btn, field, fieldHelp, fieldLabel, spinner, tapLink } from "@/lib/ui";
import type { RatingScheme } from "@/lib/report/settings";
import type { Nzs4306Conditions, Nzs4306ReportData } from "@/lib/report/nzs4306";

export interface EditorReport {
  /** "nzs_4306" = NZS 4306-skýrsla (ai_report_data.report_standard). */
  report_standard?: string;
  nzs4306?: Nzs4306ReportData;
  inspection?: { property_data?: { nzs4306?: Nzs4306Conditions } & Record<string, unknown> };
  ai_summary: {
    introduction: string;
    property_description: string;
    conclusion: string;
  };
  rooms: Array<{
    name: string;
    slug: string;
    observations: Array<{
      id: string;
      number: string | null;
      category: string;
      title: string;
      description: string;
      suggestion: string;
      severity: Severity;
    }>;
  }>;
}

interface ObsText {
  description: string;
  suggestion: string;
}

export function ReportTextEditor({
  inspectionId,
  address,
  report,
  initialToken,
  locale,
  scheme = "standard",
}: {
  inspectionId: string;
  address: string;
  report: EditorReport;
  initialToken: string;
  locale: DashboardLocale;
  /** Matskerfið sem stimplað var í skýrsluna (sama og PDF-ið sýnir). */
  scheme?: RatingScheme;
}) {
  const copy = dashboardCopy(locale);
  const t = copy.reportEditor;
  const router = useRouter();
  const uid = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const [reportRequest, setReportRequest] = useState(0);
  const [isPending, startTransition] = useTransition();
  // Hvor hnappurinn var ýttur — aðeins hann sýnir snúðinn.
  const [pressed, setPressed] = useState<"pdf" | "nopdf" | null>(null);
  // Árekstravörn: token fylgir hverri vistun; server hafnar ef snapshot-ið
  // breyttist annars staðar. Uppfærist eftir hverja vistun.
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const [introduction, setIntroduction] = useState(
    report.ai_summary.introduction ?? ""
  );
  const [propertyDescription, setPropertyDescription] = useState(
    report.ai_summary.property_description ?? ""
  );
  const [conclusion, setConclusion] = useState(
    report.ai_summary.conclusion ?? ""
  );
  const [obsText, setObsText] = useState<Record<string, ObsText>>(() => {
    const initial: Record<string, ObsText> = {};
    for (const room of report.rooms ?? []) {
      for (const obs of room.observations ?? []) {
        initial[obs.id] = {
          description: obs.description ?? "",
          suggestion: obs.suggestion ?? "",
        };
      }
    }
    return initial;
  });

  // NZS 4306: samantektir, takmarkanir (orðrétt) og eyðing mælilína. Aðeins fyrir
  // skýrslur á því sniði — aðrar skýrslur senda engan nzs4306-hluta (óbreytt hegðun).
  const nz = report.report_standard === "nzs_4306" && report.nzs4306 ? report.nzs4306 : null;
  const [nzSignificant, setNzSignificant] = useState(nz?.significant_defects_summary ?? "");
  const [nzMaintenance, setNzMaintenance] = useState(nz?.maintenance_summary ?? "");
  const [nzLimitations, setNzLimitations] = useState(
    (nz?.conditions?.limitations ?? report.inspection?.property_data?.nzs4306?.limitations ?? "") as string
  );
  const nzRows = Array.isArray(nz?.moisture_readings) ? nz!.moisture_readings! : [];
  const [removedRows, setRemovedRows] = useState<Set<number>>(() => new Set());

  const totalObs = useMemo(
    () =>
      (report.rooms ?? []).reduce(
        (n, r) => n + (r.observations?.length ?? 0),
        0
      ),
    [report]
  );

  function setObsField(id: string, field: keyof ObsText, value: string) {
    setObsText((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function buildEdit(): ReportTextEdit {
    return {
      introduction,
      property_description: propertyDescription,
      conclusion,
      observations: Object.entries(obsText).map(([id, t]) => ({
        id,
        description: t.description,
        suggestion: t.suggestion,
      })),
      ...(nz
        ? {
            nzs4306: {
              significant_defects_summary: nzSignificant,
              maintenance_summary: nzMaintenance,
              limitations: nzLimitations,
              keep_moisture_rows: nzRows.map((_, i) => i).filter((i) => !removedRows.has(i)),
            },
          }
        : {}),
    };
  }

  function toggleRow(i: number) {
    setRemovedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // Óvistaðar breytingar = munur á reitunum og síðast vistuðu útgáfu.
  const [baseline, setBaseline] = useState(() => JSON.stringify(buildEdit()));
  const dirty = JSON.stringify(buildEdit()) !== baseline;
  useUnsavedGuard(dirty, copy.common.unsavedLeave);

  // Fasta vistunarstikan má ekki hylja reitinn sem er í fókus: skrunbil neðst = hæð stikunnar.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const apply = () => {
      root.style.scrollPaddingBottom = `${bar.offsetHeight + 24}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.scrollPaddingBottom = "";
    };
  }, []);

  function handleSave(regeneratePdf: boolean) {
    setMessage(null);
    setReportRequest(0);
    setPressed(regeneratePdf ? "pdf" : "nopdf");
    const edit = buildEdit();
    startTransition(async () => {
      try {
        const result = await updateReportText(
          inspectionId,
          edit,
          regeneratePdf,
          token
        );
        // Token uppfærist ALLTAF þegar það fylgir svari — líka með villu (t.d.
        // biðröð klikkaði eftir að textinn var kominn í grunninn); annars stoppar
        // hver endurvistun á villandi "breytt annars staðar" villu.
        if ("token" in result && result.token) {
          setToken(result.token);
        }
        if ("error" in result && result.error) {
          setMessage({ type: "error", text: result.error });
          return;
        }
        setBaseline(JSON.stringify(edit));
        const queued = "queued" in result && result.queued;
        if (!regeneratePdf) {
          setMessage({
            type: "success",
            text: t.savedNoPdf,
          });
        } else if (queued) {
          setReportRequest(Date.now());
        } else {
          // Starf var þegar í miðri keyrslu með eldri texta — lofum ekki fersku
          // PDF-i; notandinn ýtir aftur þegar það starf er búið.
          setMessage({
            type: "warning",
            text: t.savedWhileRendering,
          });
        }
        router.refresh();
      } catch {
        setMessage({ type: "error", text: t.saveUnconfirmed });
      } finally {
        setPressed(null);
      }
    });
  }

  const textareaCls = field("box", "resize-y");
  const cardCls = "rounded-xl border border-concrete bg-surface";

  return (
    <div>
      <div className="mb-6">
        <GuardedLink
          href={`/dashboard/${inspectionId}`}
          className={`${tapLink} text-sm text-fog hover:text-ink`}
        >
          {copy.common.backLink}
        </GuardedLink>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          {t.title}
        </h1>
        <p className="text-sm text-fog">
          {fill(plural(locale, totalObs, t.subtitle), { address, count: totalObs })}
        </p>
        <p className="mt-2 text-sm text-fog max-w-2xl">
          {t.intro}
        </p>
      </div>

      {/* Samantekt */}
      <div className={`${cardCls} p-6 space-y-5 mb-6`}>
        <h2 className="text-lg font-semibold text-ink">{t.summary}</h2>
        <div>
          <label htmlFor={`${uid}-introduction`} className={fieldLabel}>
            {t.introduction}
          </label>
          <textarea
            id={`${uid}-introduction`}
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            rows={4}
            className={textareaCls}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-property`} className={fieldLabel}>
            {t.propertyDescription}
          </label>
          <textarea
            id={`${uid}-property`}
            value={propertyDescription}
            onChange={(e) => setPropertyDescription(e.target.value)}
            rows={3}
            className={textareaCls}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-conclusion`} className={fieldLabel}>
            {t.conclusion}
          </label>
          <textarea
            id={`${uid}-conclusion`}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={6}
            className={textareaCls}
          />
        </div>
      </div>

      {nz ? (
        <div className={`${cardCls} p-6 space-y-5 mb-6`}>
          <h2 className="text-lg font-semibold text-ink">{t.nzHeading}</h2>
          <div>
            <label htmlFor={`${uid}-nz-significant`} className={fieldLabel}>{t.nzSignificant}</label>
            <textarea id={`${uid}-nz-significant`} value={nzSignificant} onChange={(e) => setNzSignificant(e.target.value)} rows={4} className={textareaCls} />
            <p className={fieldHelp}>{t.nzSignificantHint}</p>
          </div>
          <div>
            <label htmlFor={`${uid}-nz-maintenance`} className={fieldLabel}>{t.nzMaintenance}</label>
            <textarea id={`${uid}-nz-maintenance`} value={nzMaintenance} onChange={(e) => setNzMaintenance(e.target.value)} rows={4} className={textareaCls} />
          </div>
          <div>
            <label htmlFor={`${uid}-nz-limitations`} className={fieldLabel}>{t.nzLimitations}</label>
            <textarea id={`${uid}-nz-limitations`} value={nzLimitations} onChange={(e) => setNzLimitations(e.target.value)} rows={5} className={textareaCls} />
            <p className={fieldHelp}>{t.nzLimitationsHint}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">{t.nzMoisture}</h3>
            <p className={`mb-2 ${fieldHelp}`}>{t.nzMoistureHint}</p>
            {nzRows.length === 0 ? (
              <p className="text-sm text-fog italic">{t.nzNoMoisture}</p>
            ) : (
              <ul className="divide-y divide-concrete rounded-lg border border-concrete">
                {nzRows.map((row, i) => {
                  const removed = removedRows.has(i);
                  return (
                    <li key={`${row.source_id}-${i}`} className="flex items-center gap-3 px-3 py-1 text-sm">
                      <span className={`flex-1 ${removed ? "text-fog line-through" : "text-ink"}`}>
                        {row.location} — <strong>{row.reading}</strong> {row.unit}
                        {row.assessment ? ` (${row.assessment})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRow(i)}
                        className={`inline-flex min-h-11 items-center px-2 text-sm font-medium underline-offset-4 hover:underline ${removed ? "text-navy" : "text-danger"}`}
                      >
                        {removed ? t.nzRestoreRow : t.nzRemoveRow}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* Athugasemdir eftir rýmum */}
      {(report.rooms ?? []).map((room, roomIdx) => (
        <div key={room.slug} className={`${cardCls} mb-6`}>
          <div className="px-6 py-3 border-b border-concrete">
            <h2 className="text-lg font-semibold text-ink">
              {roomIdx + 2}. {room.name}
            </h2>
          </div>
          {(room.observations ?? []).length === 0 ? (
            <p className="px-6 py-4 text-sm text-fog italic">
              {t.noObservations}
            </p>
          ) : (
            <div className="divide-y divide-concrete">
              {room.observations.map((obs, obsIdx) => {
                const number = `${roomIdx + 2}.${obsIdx + 1}`;
                const label = `${number} ${obs.title}`;
                return (
                  <div key={obs.id} className="px-6 py-5 space-y-3">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-ink text-sm">
                        {number}
                      </span>
                      <h3 className="font-semibold text-sm text-ink flex-1">
                        {obs.title}
                      </h3>
                      <SeverityBadge severity={obs.severity} locale={locale} scheme={scheme} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-${obs.id}-description`} className={fieldLabel}>
                        {t.description}
                      </label>
                      <textarea
                        id={`${uid}-${obs.id}-description`}
                        aria-label={format(t.descriptionOf, { label })}
                        value={obsText[obs.id]?.description ?? ""}
                        onChange={(e) =>
                          setObsField(obs.id, "description", e.target.value)
                        }
                        rows={3}
                        className={textareaCls}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${uid}-${obs.id}-suggestion`} className={fieldLabel}>
                          {t.suggestion}
                        </label>
                        {(obsText[obs.id]?.suggestion ?? "") !== "" && (
                          <button
                            type="button"
                            onClick={() => setObsField(obs.id, "suggestion", "")}
                            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-danger underline-offset-4 hover:underline"
                          >
                            {t.deleteSuggestion}
                          </button>
                        )}
                      </div>
                      <textarea
                        id={`${uid}-${obs.id}-suggestion`}
                        aria-label={format(t.suggestionOf, { label })}
                        value={obsText[obs.id]?.suggestion ?? ""}
                        onChange={(e) =>
                          setObsField(obs.id, "suggestion", e.target.value)
                        }
                        rows={2}
                        placeholder={t.emptySuggestion}
                        className={textareaCls}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Vistunarstika: föst neðst en inni í síðunni (sama breidd), svo hún hylur ekki reitinn í fókus. */}
      <div
        ref={barRef}
        className="sticky bottom-3 z-10 max-h-[45dvh] overflow-y-auto rounded-xl border border-concrete bg-surface p-3 shadow-sm"
      >
        {reportRequest > 0 && (
          <div className="mb-2">
            <ReportProgress key={reportRequest} inspectionId={inspectionId} requestKey={reportRequest} locale={locale} />
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            aria-busy={pressed === "pdf"}
            className={btn("primary")}
          >
            {pressed === "pdf" && <span aria-hidden="true" className={spinner} />}
            {t.saveAndRegenerate}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isPending}
            aria-busy={pressed === "nopdf"}
            className={btn("secondary")}
          >
            {pressed === "nopdf" && <span aria-hidden="true" className={spinner} />}
            {t.saveWithoutPdf}
          </button>
          <GuardedLink href={`/dashboard/${inspectionId}/report`} className={btn("quiet")}>
            {t.viewReport}
          </GuardedLink>
          <div aria-live="polite" className="text-sm">
            {dirty && !isPending ? <span className="text-fog">{t.unsaved}</span> : null}
            {!dirty && message && message.type !== "error" ? (
              <span className={message.type === "warning" ? "text-sev-warn-text" : "text-success"}>
                {message.text}
              </span>
            ) : null}
          </div>
          {message?.type === "error" ? (
            <p role="alert" className="text-sm text-danger">
              {message.text}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
