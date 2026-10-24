"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ReportProgress } from "@/components/dashboard/ReportProgress";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { btn, spinner } from "@/lib/ui";
import { generateReport, sendToDrive } from "./actions";

type Dialog = null | "regenerate" | "extraCredit";

export function ReportActions({
  inspectionId,
  reportUrl,
  hasAiReport,
  canSendToDrive,
  locale,
  observationCount,
}: {
  inspectionId: string;
  reportUrl: string | null;
  hasAiReport: boolean;
  canSendToDrive: boolean;
  locale: DashboardLocale;
  /** Fjöldi athugasemda í skoðuninni; 0 slekkur á „Búa til skýrslu“. Óskilgreint = ekki athugað. */
  observationCount?: number;
}) {
  const copy = dashboardCopy(locale);
  const t = copy.reportActions;
  const hintId = useId();
  const [reportRequest, setReportRequest] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hasReport = hasAiReport || justGenerated || !!reportUrl;
  const noObservations = observationCount === 0;

  async function handleGenerate(confirmAdditionalCredit = false) {
    setDialog(null);
    setGenerating(true);
    setMessage(null);
    setReportRequest(0);
    try {
      const result = await generateReport(
        inspectionId,
        confirmAdditionalCredit ? { confirmAdditionalCredit: true } : undefined
      );
      if ("error" in result) {
        // Innifaldar endurgerðir búnar: spyrja um eina skýrsluinneign í stað þess að stranda.
        if (result.code === "additional_credit_confirmation_required") {
          setDialog("extraCredit");
        } else {
          setMessage({ type: "error", text: result.error });
        }
      } else {
        setJustGenerated(true);
        setReportRequest(Date.now());
      }
    } catch {
      setMessage({ type: "error", text: t.confirmFailed });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendToDrive() {
    setSending(true);
    setMessage(null);
    try {
      const result = await sendToDrive(inspectionId);
      if ("error" in result && result.error) {
        setMessage({ type: "error", text: result.error });
      } else if ("drive_view_url" in result && result.drive_view_url) {
        setMessage({ type: "success", text: t.sentToDrive });
      } else {
        setMessage({ type: "success", text: t.sentToDriveShort });
      }
    } catch {
      setMessage({ type: "error", text: t.driveFailed });
    } finally {
      setSending(false);
    }
  }

  // Ein aðalaðgerð: „Skoða skýrslu“ þegar skýrsla er til, annars „Búa til skýrslu“.
  // Endurgerð er aldrei aðalhnappur og spyr alltaf fyrst (DESIGN.md §6).
  return (
    <div className="rounded-xl border border-concrete bg-surface p-6">
      <h2 className="mb-3 text-base font-semibold text-ink">{t.title}</h2>

      <div className="flex flex-wrap gap-3">
        {hasReport ? (
          <>
            <Link href={`/dashboard/${inspectionId}/report`} className={btn("primary")}>
              {t.view}
            </Link>
            {/* Breyta texta beint (án AI) — nýtt PDF renderast úr breytta
                textanum, Claude er ekki keyrt aftur. */}
            <Link href={`/dashboard/${inspectionId}/report/edit`} className={btn("secondary")}>
              {t.editText}
            </Link>
            {reportUrl && (
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={btn("secondary")}
              >
                {t.downloadPdf}
              </a>
            )}
            {reportUrl && canSendToDrive && (
              <button
                type="button"
                onClick={handleSendToDrive}
                disabled={sending}
                aria-busy={sending}
                className={btn("secondary")}
              >
                {sending && <span aria-hidden="true" className={spinner} />}
                {sending ? t.sendingToDrive : t.sendToDrive}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDialog("regenerate")}
              disabled={generating}
              aria-busy={generating}
              className={btn("secondary")}
            >
              {generating && <span aria-hidden="true" className={spinner} />}
              {generating ? t.generating : t.regenerate}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={generating || noObservations}
            aria-busy={generating}
            aria-describedby={noObservations ? hintId : undefined}
            className={btn("primary")}
          >
            {generating && <span aria-hidden="true" className={spinner} />}
            {generating ? t.generating : t.create}
          </button>
        )}
      </div>

      {noObservations && !hasReport && (
        <p id={hintId} className="mt-3 text-sm text-fog">
          {copy.actions.noObservations}
        </p>
      )}

      {generating && (
        <div role="status" className="mt-4 rounded-lg border border-line-strong bg-paper-alt px-4 py-3 text-sm text-ink">
          <p className="font-semibold">{t.inProgressTitle}</p>
          <p className="mt-1 text-fog">{t.inProgressBody}</p>
        </div>
      )}

      {reportRequest > 0 && <ReportProgress key={reportRequest} inspectionId={inspectionId} requestKey={reportRequest} locale={locale} />}

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mt-3 text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}
        >
          {message.text}
        </p>
      )}

      <ConfirmDialog
        open={dialog === "regenerate"}
        title={t.regenerateTitle}
        confirmLabel={t.regenerateConfirm}
        cancelLabel={t.cancel}
        onConfirm={() => handleGenerate()}
        onCancel={() => setDialog(null)}
      >
        <p>{t.regenerateBody}</p>
        {dialog === "regenerate" && isRondvaBrand() && <p>{t.regenerateCredit}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "extraCredit"}
        title={t.extraCreditTitle}
        confirmLabel={t.extraCreditConfirm}
        cancelLabel={t.cancel}
        onConfirm={() => handleGenerate(true)}
        onCancel={() => setDialog(null)}
      >
        <p>{t.extraCreditBody}</p>
        <p>
          <Link
            href={`/dashboard/${inspectionId}/report/edit`}
            className="font-semibold text-navy underline underline-offset-4 hover:text-navy-deep"
          >
            {t.editText}
          </Link>
        </p>
      </ConfirmDialog>
    </div>
  );
}

// Skýrsluinneignir eru Rondva-hugtak (Beton er undanþegið) — nefnt aðeins í Rondva-stjórnborðinu.
// Lesið aðeins þegar glugginn er opinn (aldrei í fyrstu birtingu), svo ekkert ósamræmi við server-render.
function isRondvaBrand(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.brand === "rondva";
}
