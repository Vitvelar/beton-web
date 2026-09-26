"use client";

// Ritill fyrir skýrslutextann: breytir ai_report_data snapshot-inu beint
// (samantekt + lýsing/tillaga hverrar athugasemdar) og endurgerir PDF án þess
// að keyra AI aftur. Fyrir vinnuflæðið "AI-tillagan er skrítin → laga/eyða
// henni → fá lokaskýrslu" sem áður var gert í Canva.

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateReportText,
  type ReportTextEdit,
} from "@/app/(dashboard)/dashboard/[id]/actions";
import { ReportProgress } from "./ReportProgress";
import { SeverityBadge } from "./SeverityBadge";
import type { Severity } from "@/lib/supabase/types";
import { dashboardCopy, fill, plural, type DashboardLocale } from "@/lib/i18n/dashboard";

export interface EditorReport {
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
}: {
  inspectionId: string;
  address: string;
  report: EditorReport;
  initialToken: string;
  locale: DashboardLocale;
}) {
  const copy = dashboardCopy(locale);
  const t = copy.reportEditor;
  const router = useRouter();
  const [reportRequest, setReportRequest] = useState(0);
  const [isPending, startTransition] = useTransition();
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
    };
  }

  function handleSave(regeneratePdf: boolean) {
    setMessage(null);
    setReportRequest(0);
    startTransition(async () => {
      try {
        const result = await updateReportText(
          inspectionId,
          buildEdit(),
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
      }
    });
  }

  const textareaCls =
    "w-full rounded-lg border border-concrete px-3 py-2 text-sm text-ink focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-colors resize-y";

  return (
    <div className={reportRequest > 0 ? "pb-80" : "pb-24"}>
      <div className="mb-6">
        <Link
          href={`/dashboard/${inspectionId}`}
          className="text-sm text-fog hover:text-ink transition-colors"
        >
          {copy.common.backLink}
        </Link>
        <h1 className="text-xl font-semibold text-ink mt-1">
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
      <div className="rounded-xl border border-concrete bg-white p-6 space-y-5 mb-6">
        <h2 className="text-sm font-semibold text-navy">{t.summary}</h2>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t.introduction}
          </label>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            rows={4}
            className={textareaCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t.propertyDescription}
          </label>
          <textarea
            value={propertyDescription}
            onChange={(e) => setPropertyDescription(e.target.value)}
            rows={3}
            className={textareaCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t.conclusion}
          </label>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={6}
            className={textareaCls}
          />
        </div>
      </div>

      {/* Athugasemdir eftir rýmum */}
      {(report.rooms ?? []).map((room, roomIdx) => (
        <div
          key={room.slug}
          className="rounded-xl border border-concrete bg-white mb-6"
        >
          <div className="px-6 py-3 border-b border-concrete/50">
            <h2 className="text-sm font-semibold text-navy">
              {roomIdx + 2}. {room.name}
            </h2>
          </div>
          {(room.observations ?? []).length === 0 ? (
            <p className="px-6 py-4 text-sm text-fog italic">
              {t.noObservations}
            </p>
          ) : (
            <div className="divide-y divide-concrete/40">
              {room.observations.map((obs, obsIdx) => (
                <div key={obs.id} className="px-6 py-5 space-y-3">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-navy text-sm">
                      {roomIdx + 2}.{obsIdx + 1}
                    </span>
                    <span className="font-semibold text-sm text-ink flex-1">
                      {obs.title}
                    </span>
                    <SeverityBadge severity={obs.severity} locale={locale} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-fog mb-1">
                      {t.description}
                    </label>
                    <textarea
                      value={obsText[obs.id]?.description ?? ""}
                      onChange={(e) =>
                        setObsField(obs.id, "description", e.target.value)
                      }
                      rows={3}
                      className={textareaCls}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-fog">
                        {t.suggestion}
                      </label>
                      {(obsText[obs.id]?.suggestion ?? "") !== "" && (
                        <button
                          type="button"
                          onClick={() => setObsField(obs.id, "suggestion", "")}
                          className="text-xs text-sev-danger hover:underline"
                        >
                          {t.deleteSuggestion}
                        </button>
                      )}
                    </div>
                    <textarea
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
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Fast vistunarborði neðst */}
      <div className="fixed bottom-0 left-0 right-0 max-h-[45vh] overflow-y-auto border-t border-concrete bg-white/95 backdrop-blur px-6 py-3 z-10">
        {reportRequest > 0 && <div className="max-w-4xl mx-auto mb-2"><ReportProgress key={reportRequest} inspectionId={inspectionId} requestKey={reportRequest} locale={locale} /></div>}
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors disabled:opacity-60"
          >
            {isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {t.saveAndRegenerate}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="rounded-lg border border-navy px-5 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors disabled:opacity-60"
          >
            {t.saveWithoutPdf}
          </button>
          <Link
            href={`/dashboard/${inspectionId}/report`}
            className="text-sm text-fog hover:text-ink transition-colors"
          >
            {t.viewReport}
          </Link>
          {message && (
            <span
              className={`text-sm ${
                message.type === "error"
                  ? "text-sev-danger"
                  : message.type === "warning"
                    ? "text-amber-700"
                    : "text-emerald-700"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
