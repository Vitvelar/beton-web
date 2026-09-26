"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportProgress } from "@/app/(dashboard)/dashboard/[id]/actions";
import { waitForReport } from "@/lib/report/progress";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";

export function ReportProgress({ inspectionId, requestKey, locale }: { inspectionId: string; requestKey: number; locale: DashboardLocale }) {
  const t = dashboardCopy(locale).reportProgress;
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ state: string; detail?: string }>({ state: 'pending' });
  useEffect(() => {
    let cancelled = false;
    void waitForReport(() => getReportProgress(inspectionId), { cancelled: () => cancelled, unreachableDetail: t.unreachable })
      .then(next => { if (!cancelled && next.state !== 'cancelled') setResult(next); });
    return () => { cancelled = true; };
  }, [inspectionId, requestKey, retry, t.unreachable]);

  const ready = result.state === 'ready';
  const pending = result.state === 'pending';
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 rounded-lg border border-concrete bg-white px-4 py-3 text-sm">
      <p className={ready ? 'font-semibold text-emerald-700' : 'font-semibold text-navy'}>
        {ready ? t.ready : pending ? t.pending : t.attention}
      </p>
      {pending && <p className="mt-1 text-fog">{t.pendingHint}</p>}
      {ready ? <a className="mt-2 inline-block font-semibold text-navy underline" href={`/dashboard/${inspectionId}/report/pdf`}>{t.openPdf}</a> : null}
      {!ready && !pending && <>
        <p className="mt-1 text-fog">{result.detail ?? t.slow}</p>
        <button type="button" className="mt-2 font-semibold text-navy underline" onClick={() => { setResult({ state: 'pending' }); setRetry(value => value + 1); }}>{t.retry}</button>
        <Link className="ml-4 text-navy underline" href={`/dashboard/${inspectionId}`}>{t.openInspection}</Link>
      </>}
    </div>
  );
}
