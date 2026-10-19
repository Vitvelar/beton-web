"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ReportProgress } from "@/components/dashboard/ReportProgress";
import { dashboardCopy, fill, type DashboardLocale } from "@/lib/i18n/dashboard";
import { formatReportDateNz } from "@/lib/report/date";
import { generateReport, issueReport, sendToDrive } from "./actions";

/**
 * „Sign & issue“ (aðeins NZS 4306-skýrslur á app.rondva.com; annars er propið ekki sett og
 * skýrsluspjaldið er nákvæmlega eins og áður, líka hjá Beton).
 */
export interface IssueUi {
  /** snapshotToken af skýrslunni sem sást þegar síðan var rendruð; server-aðgerðin ber hann saman. */
  token: string;
  /** yyyy-mm-dd þegar skýrslan er (gild) útgefin, annars null = drög. */
  issuedOn: string | null;
  /** Nafnið sem skýrslan var gefin út undir. */
  issuedBy: string | null;
  /** Nafnið og réttindin sem myndu birtast ef gefin út núna (úr skoðun/prófíl). */
  name: string | null;
  qualifications: string | null;
  /** status = report_ready: PDF-ið er tilbúið til yfirlestrar og útgáfu. */
  ready: boolean;
  /** PDF í vinnslu (generating / rendering_pdf). */
  rendering: boolean;
}

export function ReportActions({
  inspectionId,
  reportUrl,
  hasAiReport,
  canSendToDrive,
  locale,
  issue,
}: {
  inspectionId: string;
  reportUrl: string | null;
  hasAiReport: boolean;
  canSendToDrive: boolean;
  locale: DashboardLocale;
  issue?: IssueUi | null;
}) {
  const t = dashboardCopy(locale).reportActions;
  const [reportRequest, setReportRequest] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleGenerate() {
    // Útgefin skýrsla: ný AI-keyrsla býr til ný drög og útgáfan hverfur — spyrja fyrst.
    if (issue?.issuedOn && !window.confirm(t.regenerateIssuedConfirm)) return;
    setGenerating(true);
    setMessage(null);
    setReportRequest(0);
    try {
      const result = await generateReport(inspectionId);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setJustGenerated(true);
        setReportRequest(Date.now());
      }
    } catch {
      setMessage({ type: "error", text: t.confirmFailed });
    } finally { setGenerating(false); }
  }

  function openIssueDialog() {
    setConfirmed(false);
    setMessage(null);
    dialogRef.current?.showModal();
  }

  async function handleIssue() {
    if (!issue || !confirmed) return;
    setIssuing(true);
    setMessage(null);
    setReportRequest(0);
    try {
      let timeZone: string | undefined;
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        timeZone = undefined;
      }
      const result = await issueReport(inspectionId, issue.token, true, timeZone);
      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setReportRequest(Date.now());
      }
    } catch {
      setMessage({ type: "error", text: t.issueFailed });
    } finally {
      setIssuing(false);
      dialogRef.current?.close();
    }
  }

  async function handleSendToDrive() {
    setSending(true);
    setMessage(null);
    const result = await sendToDrive(inspectionId);
    setSending(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if ("drive_view_url" in result && result.drive_view_url) {
      setMessage({
        type: "success",
        text: t.sentToDrive,
      });
    } else {
      setMessage({ type: "success", text: t.sentToDriveShort });
    }
  }

  const showViewReport = hasAiReport || justGenerated || reportUrl;

  return (
    <div className="rounded-xl border border-concrete bg-white p-4">
      <h3 className="text-sm font-semibold text-ink mb-3">{t.title}</h3>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors disabled:opacity-60"
        >
          {generating && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          <span>
            {generating
              ? t.generating
              : showViewReport
                ? t.regenerate
                : t.create}
          </span>
        </button>

        {showViewReport && (
          <>
            <Link
              href={`/dashboard/${inspectionId}/report`}
              className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
            >
              {t.view}
            </Link>
            {/* Breyta texta beint (án AI) — nýtt PDF renderast úr breytta
                textanum, Claude er ekki keyrt aftur. */}
            <Link
              href={`/dashboard/${inspectionId}/report/edit`}
              className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
            >
              {t.editText}
            </Link>
            {issue && !issue.issuedOn && (
              <button
                type="button"
                onClick={openIssueDialog}
                disabled={!issue.ready || generating || issuing}
                className="rounded-lg bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper-dk transition-colors disabled:opacity-50"
              >
                {t.issueButton}
              </button>
            )}
          </>
        )}

        {reportUrl && !(issue?.issuedOn && issue.rendering) && (
          <>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-concrete px-4 py-2 text-sm font-semibold text-stone hover:bg-stone/5 transition-colors"
            >
              {t.downloadPdf}
            </a>

            {canSendToDrive && (
              <button
                onClick={handleSendToDrive}
                disabled={sending}
                className="rounded-lg border border-copper px-4 py-2 text-sm font-semibold text-copper-dk hover:bg-copper/5 transition-colors disabled:opacity-50"
              >
                {sending ? t.sendingToDrive : t.sendToDrive}
              </button>
            )}
          </>
        )}
      </div>

      {issue && showViewReport && (
        <p className={`mt-3 text-sm ${issue.issuedOn ? "text-emerald-700" : "text-amber-700"}`}>
          {issue.issuedOn
            ? fill(t.issuedStatus, { name: issue.issuedBy ?? "", date: formatReportDateNz(issue.issuedOn) })
            : t.issueDraftStatus}
          {issue.issuedOn && issue.rendering ? ` — ${t.issuePreparing}` : ""}
        </p>
      )}

      {issue && (
        <dialog
          ref={dialogRef}
          aria-labelledby="issue-dialog-title"
          className="m-auto w-full max-w-md rounded-xl border border-concrete bg-white p-0 text-ink shadow-xl backdrop:bg-black/40"
          onClose={() => setConfirmed(false)}
        >
          <div className="p-5">
            <h3 id="issue-dialog-title" className="text-base font-semibold text-ink">
              {t.issueDialogTitle}
            </h3>
            <p className="mt-2 text-sm text-fog">{t.issueDialogIntro}</p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-fog">{t.issuedByLabel}</dt>
                <dd className="text-right font-medium text-ink">{issue.name ?? "—"}</dd>
              </div>
              {issue.qualifications?.trim() ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-fog">{t.qualificationsLabel}</dt>
                  <dd className="text-right font-medium text-ink">{issue.qualifications.trim()}</dd>
                </div>
              ) : null}
            </dl>
            {!issue.qualifications?.trim() ? (
              <p className="mt-2 text-xs text-fog">{t.issueNoQualifications}</p>
            ) : null}
            <p className="mt-3 text-xs text-fog">{t.issueEffects}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link
                href={`/dashboard/${inspectionId}/report`}
                target="_blank"
                className="font-semibold text-navy underline"
              >
                {t.view}
              </Link>
              {reportUrl ? (
                <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline">
                  {t.downloadPdf}
                </a>
              ) : null}
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>{t.issueConfirmLabel}</span>
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                disabled={issuing}
                className="rounded-lg border border-concrete px-4 py-2 text-sm font-semibold text-stone hover:bg-stone/5 transition-colors disabled:opacity-60"
              >
                {t.issueCancel}
              </button>
              <button
                type="button"
                onClick={handleIssue}
                disabled={!confirmed || issuing}
                className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper-dk transition-colors disabled:opacity-50"
              >
                {issuing && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {issuing ? t.issuing : t.issueConfirm}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {generating && (
        <div className="mt-4 rounded-lg border border-navy/15 bg-navy/5 px-4 py-3 text-sm text-navy">
          <p className="font-semibold">{t.inProgressTitle}</p>
          <p className="mt-1 text-navy/75">
            {t.inProgressBody}
          </p>
        </div>
      )}

      {reportRequest > 0 && <ReportProgress key={reportRequest} inspectionId={inspectionId} requestKey={reportRequest} locale={locale} />}

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.type === "error" ? "text-sev-danger" : "text-emerald-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
