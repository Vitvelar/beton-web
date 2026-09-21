"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportProgress } from "@/app/(dashboard)/dashboard/[id]/actions";
import { waitForReport } from "@/lib/report/progress";

export function ReportProgress({ inspectionId, requestKey }: { inspectionId: string; requestKey: number }) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ state: string; detail?: string }>({ state: 'pending' });
  useEffect(() => {
    let cancelled = false;
    void waitForReport(() => getReportProgress(inspectionId), { cancelled: () => cancelled })
      .then(next => { if (!cancelled && next.state !== 'cancelled') setResult(next); });
    return () => { cancelled = true; };
  }, [inspectionId, requestKey, retry]);

  const ready = result.state === 'ready';
  const pending = result.state === 'pending';
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 rounded-lg border border-concrete bg-white px-4 py-3 text-sm">
      <p className={ready ? 'font-semibold text-emerald-700' : 'font-semibold text-navy'}>
        {ready ? 'Skýrslan er tilbúin.' : pending ? 'PDF-skýrslan er í vinnslu…' : 'Athuga þarf stöðu skýrslunnar.'}
      </p>
      {pending && <p className="mt-1 text-fog">Þú færð staðfestingu hér þegar hún er tilbúin.</p>}
      {ready ? <a className="mt-2 inline-block font-semibold text-navy underline" href={`/dashboard/${inspectionId}/report/pdf`}>Opna PDF-skýrslu</a> : null}
      {!ready && !pending && <>
        <p className="mt-1 text-fog">{result.detail ?? 'Vinnslan tekur lengri tíma en venjulega. Hún getur enn verið í gangi; þú þarft ekki að hefja nýja AI-keyrslu.'}</p>
        <button type="button" className="mt-2 font-semibold text-navy underline" onClick={() => { setResult({ state: 'pending' }); setRetry(value => value + 1); }}>Athuga stöðu aftur</button>
        <Link className="ml-4 text-navy underline" href={`/dashboard/${inspectionId}`}>Opna skoðun</Link>
      </>}
    </div>
  );
}
