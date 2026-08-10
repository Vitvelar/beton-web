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
import { SeverityBadge } from "./SeverityBadge";
import type { Severity } from "@/lib/supabase/types";

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
}: {
  inspectionId: string;
  address: string;
  report: EditorReport;
  initialToken: string;
}) {
  const router = useRouter();
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
    startTransition(async () => {
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
          text: "Breytingar vistaðar. PDF-ið uppfærist ekki fyrr en það er endurgert.",
        });
      } else if (queued) {
        setMessage({
          type: "success",
          text: "Vistað — nýtt PDF er í vinnslu og verður tilbúið eftir ~1–2 mínútur.",
        });
      } else {
        // Starf var þegar í miðri keyrslu með eldri texta — lofum ekki fersku
        // PDF-i; notandinn ýtir aftur þegar það starf er búið.
        setMessage({
          type: "warning",
          text:
            "Vistað — en PDF-gerð var þegar í gangi með eldri texta. Ýttu aftur á „Vista og endurgera PDF“ eftir ~1 mínútu svo breytingarnar skili sér í PDF-ið.",
        });
      }
      router.refresh();
    });
  }

  const textareaCls =
    "w-full rounded-lg border border-concrete px-3 py-2 text-sm text-ink focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-colors resize-y";

  return (
    <div className="pb-24">
      <div className="mb-6">
        <Link
          href={`/dashboard/${inspectionId}`}
          className="text-sm text-fog hover:text-ink transition-colors"
        >
          &larr; Til baka
        </Link>
        <h1 className="text-xl font-semibold text-ink mt-1">
          Breyta skýrslutexta
        </h1>
        <p className="text-sm text-fog">
          {address} — {totalObs} athugasemdir
        </p>
        <p className="mt-2 text-sm text-fog max-w-2xl">
          Hér má lagfæra eða eyða texta sem AI skrifaði án þess að keyra
          skýrslugerðina aftur. Tóm tillaga birtist ekki í skýrslunni.
        </p>
      </div>

      {/* Samantekt */}
      <div className="rounded-xl border border-concrete bg-white p-6 space-y-5 mb-6">
        <h2 className="text-sm font-semibold text-navy">1. Samantekt</h2>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Inngangur
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
            Eignalýsing
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
            Niðurstaða
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
              Engar athugasemdir í þessu rými.
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
                    <SeverityBadge severity={obs.severity} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-fog mb-1">
                      Lýsing
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
                        Tillaga
                      </label>
                      {(obsText[obs.id]?.suggestion ?? "") !== "" && (
                        <button
                          type="button"
                          onClick={() => setObsField(obs.id, "suggestion", "")}
                          className="text-xs text-sev-danger hover:underline"
                        >
                          Eyða tillögu
                        </button>
                      )}
                    </div>
                    <textarea
                      value={obsText[obs.id]?.suggestion ?? ""}
                      onChange={(e) =>
                        setObsField(obs.id, "suggestion", e.target.value)
                      }
                      rows={2}
                      placeholder="(engin tillaga — birtist ekki í skýrslu)"
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-concrete bg-white/95 backdrop-blur px-6 py-3 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors disabled:opacity-60"
          >
            {isPending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Vista og endurgera PDF
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="rounded-lg border border-navy px-5 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors disabled:opacity-60"
          >
            Vista án PDF
          </button>
          <Link
            href={`/dashboard/${inspectionId}/report`}
            className="text-sm text-fog hover:text-ink transition-colors"
          >
            Skoða skýrslu
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
