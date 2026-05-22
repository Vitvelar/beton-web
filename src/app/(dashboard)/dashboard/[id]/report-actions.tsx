"use client";

import { useState } from "react";
import Link from "next/link";
import { generateReport, sendToDrive } from "./actions";

export function ReportActions({
  inspectionId,
  reportUrl,
  hasAiReport,
}: {
  inspectionId: string;
  reportUrl: string | null;
  hasAiReport: boolean;
}) {
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
    const result = await generateReport(inspectionId);
    setGenerating(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setJustGenerated(true);
      setMessage({ type: "success", text: "Skýrsla búin til." });
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
        text: "Skýrsla send í Google Drive.",
      });
    } else {
      setMessage({ type: "success", text: "Sent í Drive." });
    }
  }

  const showViewReport = hasAiReport || justGenerated || reportUrl;

  return (
    <div className="rounded-xl border border-concrete bg-white p-4">
      <h3 className="text-sm font-semibold text-ink mb-3">Skýrsla</h3>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors disabled:opacity-50"
        >
          {generating
            ? "Bý til skýrslu..."
            : showViewReport
              ? "Endurgera skýrslu"
              : "Búa til skýrslu"}
        </button>

        {showViewReport && (
          <Link
            href={`/dashboard/${inspectionId}/report`}
            className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
          >
            Skoða skýrslu
          </Link>
        )}

        {reportUrl && (
          <>
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-concrete px-4 py-2 text-sm font-semibold text-stone hover:bg-stone/5 transition-colors"
            >
              Sækja PDF
            </a>

            <button
              onClick={handleSendToDrive}
              disabled={sending}
              className="rounded-lg border border-copper px-4 py-2 text-sm font-semibold text-copper-dk hover:bg-copper/5 transition-colors disabled:opacity-50"
            >
              {sending ? "Sendi í Drive..." : "Senda í Google Drive"}
            </button>
          </>
        )}
      </div>

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
