"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateObservation } from "@/app/(dashboard)/dashboard/[id]/actions";
import { SeverityBadge } from "./SeverityBadge";
import type { Observation, Severity } from "@/lib/supabase/types";

const CATEGORIES = [
  "Veggir",
  "Gólfefni",
  "Loft",
  "Hurðir",
  "Gluggar",
  "Skápar",
  "Rafmagn",
  "Lagnir",
  "Loftræsting",
  "Þak",
  "Einangrun",
  "Raki",
  "Burðarvirki",
  "Annað",
];

const SEVERITIES: Severity[] = ["athugasemd", "alvarleg", "mjog_alvarleg"];

export function ObservationForm({
  observation,
  inspectionId,
}: {
  observation: Observation;
  inspectionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(observation.title);
  const [category, setCategory] = useState(observation.category ?? "");
  const [severity, setSeverity] = useState<Severity>(observation.severity);
  const [description, setDescription] = useState(
    observation.description ?? ""
  );
  const [suggestion, setSuggestion] = useState(observation.suggestion ?? "");

  function handleSave() {
    setSaved(false);
    setError(null);

    startTransition(async () => {
      const result = await updateObservation(observation.id, {
        title,
        category: category || undefined,
        severity,
        description: description || undefined,
        suggestion: suggestion || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="rounded-xl border border-concrete bg-white p-6 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Titill
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-concrete px-3 py-2 text-sm text-ink focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-colors"
        />
      </div>

      {/* Category + Severity row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Flokkur
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-concrete px-3 py-2 text-sm text-ink bg-white focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-colors"
          >
            <option value="">— Veldu flokk —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Alvarleiki
          </label>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  severity === s
                    ? "ring-2 ring-navy ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <SeverityBadge severity={s} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Lýsing
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          placeholder="Ítarleg lýsing á athugasemd..."
          className="w-full rounded-lg border border-concrete px-3 py-2 text-sm text-ink focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-colors resize-y"
        />
      </div>

      {/* Suggestion */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Tillaga
        </label>
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          rows={6}
          placeholder="Tillaga að úrbótum..."
          className="w-full rounded-lg border border-concrete px-3 py-2 text-sm text-ink focus:border-navy focus:ring-1 focus:ring-navy outline-none transition-colors resize-y"
        />
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-deep transition-colors disabled:opacity-50"
        >
          {isPending ? "Vista..." : "Vista breytingar"}
        </button>

        {saved && (
          <span className="text-sm text-emerald-700">Vistað</span>
        )}
        {error && <span className="text-sm text-sev-danger">{error}</span>}
      </div>
    </div>
  );
}
