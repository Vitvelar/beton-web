import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import type { Severity } from "@/lib/supabase/types";

interface ReportData {
  inspection: {
    address: string;
    postal_code: string;
    municipality: string;
    fastanumer: string;
    customer_name: string;
    inspection_date: string;
    weather: string;
    attendees: string[];
    property_data: Record<string, unknown>;
    lookup_failed: boolean;
  };
  ai_summary: {
    introduction: string;
    property_description: string;
    conclusion: string;
  };
  rooms: Array<{
    name: string;
    slug: string;
    sort_order: number;
    ratings: Record<string, string>;
    notes: string;
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

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, address, postal_code, customer_name, inspection_date, ai_report_data, ai_summary, ai_cost_usd, ai_model, report_generated_at")
    .eq("id", id)
    .maybeSingle();

  if (!inspection?.ai_report_data) {
    notFound();
  }

  const report = inspection.ai_report_data as ReportData;

  const totalObs = report.rooms.reduce(
    (n, r) => n + r.observations.length,
    0
  );
  const sevCounts = {
    mjog_alvarleg: 0,
    alvarleg: 0,
    athugasemd: 0,
  };
  for (const room of report.rooms) {
    for (const obs of room.observations) {
      if (obs.severity in sevCounts) {
        sevCounts[obs.severity as keyof typeof sevCounts]++;
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/dashboard/${id}`}
          className="text-sm text-navy hover:underline"
        >
          &larr; Til baka
        </Link>
        <button
          onClick={undefined}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors"
          data-print
        >
          Prenta / Vista PDF
        </button>
      </div>

      {/* Report content */}
      <article className="bg-white rounded-xl border border-concrete overflow-hidden print:border-0 print:rounded-none">
        {/* Header */}
        <div className="bg-navy text-white px-8 py-10 print:py-6">
          <p className="text-xs font-semibold tracking-[0.2em] opacity-70 mb-1">
            BETON EHF.
          </p>
          <h1 className="text-2xl font-bold mb-2">Ástandsskoðun</h1>
          <p className="text-lg opacity-90">{report.inspection.address}</p>
          <p className="text-sm opacity-70 mt-1">
            {report.inspection.postal_code}{" "}
            {report.inspection.municipality}
            {report.inspection.fastanumer &&
              ` — Fnr. ${report.inspection.fastanumer}`}
          </p>
        </div>

        {/* Meta bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 py-5 border-b border-concrete bg-stone-50/30 text-sm">
          <div>
            <span className="text-stone block text-xs">Viðskiptavinur</span>
            <span className="font-medium text-ink">
              {report.inspection.customer_name}
            </span>
          </div>
          <div>
            <span className="text-stone block text-xs">Dagsetning</span>
            <span className="font-medium text-ink">
              {report.inspection.inspection_date}
            </span>
          </div>
          <div>
            <span className="text-stone block text-xs">Athugasemdir</span>
            <span className="font-medium text-ink">{totalObs}</span>
          </div>
          <div>
            <span className="text-stone block text-xs">Veður</span>
            <span className="font-medium text-ink">
              {report.inspection.weather || "—"}
            </span>
          </div>
        </div>

        {/* Severity summary */}
        <div className="flex gap-4 px-8 py-4 border-b border-concrete">
          {sevCounts.mjog_alvarleg > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sev-danger" />
              <span className="text-sm">
                {sevCounts.mjog_alvarleg} mjög alvarleg
              </span>
            </div>
          )}
          {sevCounts.alvarleg > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sev-warn" />
              <span className="text-sm">{sevCounts.alvarleg} alvarleg</span>
            </div>
          )}
          {sevCounts.athugasemd > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sev-calm" />
              <span className="text-sm">
                {sevCounts.athugasemd} athugasemd
              </span>
            </div>
          )}
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">Inngangur</h2>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
              {report.ai_summary.introduction}
            </p>
          </section>

          {/* Property description */}
          {report.ai_summary.property_description && (
            <section>
              <h2 className="text-lg font-semibold text-ink mb-3">
                Eignalýsing
              </h2>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {report.ai_summary.property_description}
              </p>
            </section>
          )}

          {/* Conclusion */}
          <section>
            <h2 className="text-lg font-semibold text-ink mb-3">Niðurstaða</h2>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
              {report.ai_summary.conclusion}
            </p>
          </section>

          {/* Rooms and observations */}
          <section className="print:break-before-page">
            <h2 className="text-lg font-semibold text-ink mb-4">
              Athugasemdir eftir rýmum
            </h2>

            <div className="space-y-6">
              {report.rooms
                .filter((r) => r.observations.length > 0)
                .map((room) => (
                  <div
                    key={room.slug}
                    className="border border-concrete rounded-lg overflow-hidden print:break-inside-avoid"
                  >
                    <div className="bg-stone-50 px-5 py-3 border-b border-concrete">
                      <h3 className="font-semibold text-ink">{room.name}</h3>
                    </div>
                    <div className="divide-y divide-concrete">
                      {room.observations.map((obs, i) => (
                        <div key={obs.id} className="px-5 py-4">
                          <div className="flex items-start gap-3 mb-2">
                            <span className="text-xs font-mono text-stone mt-0.5">
                              {obs.number ?? `${i + 1}`}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-ink text-sm">
                                  {obs.title}
                                </span>
                                <SeverityBadge
                                  severity={obs.severity as Severity}
                                />
                              </div>
                              {obs.category && (
                                <span className="text-xs text-stone">
                                  {obs.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-7 space-y-2">
                            <p className="text-sm text-ink/80 leading-relaxed">
                              {obs.description}
                            </p>
                            {obs.suggestion && (
                              <div className="bg-navy/5 rounded-lg px-3 py-2">
                                <p className="text-xs font-semibold text-navy mb-0.5">
                                  Tillaga
                                </p>
                                <p className="text-sm text-ink/80">
                                  {obs.suggestion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-concrete bg-stone-50/30 text-xs text-stone">
          <div className="flex justify-between">
            <span>
              Skýrsla gerð{" "}
              {inspection.report_generated_at
                ? new Date(inspection.report_generated_at).toLocaleString(
                    "is-IS"
                  )
                : "—"}
            </span>
            <span>
              {inspection.ai_model} &middot; $
              {inspection.ai_cost_usd?.toFixed(4) ?? "—"}
            </span>
          </div>
        </div>
      </article>

      {/* Print script */}
      <PrintButton />
    </div>
  );
}

function PrintButton() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.querySelector('[data-print]')?.addEventListener('click',()=>window.print())`,
      }}
    />
  );
}
