"use client";

import { useState } from "react";
import Link from "next/link";
import { ReportProgress } from "@/components/dashboard/ReportProgress";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { generateReport, sendToDrive } from "./actions";

export function ReportActions({
  inspectionId,
  reportUrl,
  hasAiReport,
  canSendToDrive,
  locale,
}: {
  inspectionId: string;
  reportUrl: string | null;
  hasAiReport: boolean;
  canSendToDrive: boolean;
  locale: DashboardLocale;
}) {
  const t = dashboardCopy(locale).reportActions;
  const [reportRequest, setReportRequest] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleGenerate() {
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
          </>
        )}

        {reportUrl && (
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
