"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { contactSchema, type ContactFormData } from "@/lib/schemas";

const fieldClass =
  "w-full px-0 py-3.5 text-base text-ink bg-transparent border-0 border-b border-concrete-dk focus:border-ink focus:outline-none focus:ring-0 placeholder:text-fog/70";

const labelClass =
  "text-[11px] font-mono tracking-[0.1em] text-fog uppercase mb-1.5 block";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Villa kom upp");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Villa kom upp við sendingu");
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="font-mono text-[11px] tracking-[0.12em] text-copper uppercase mb-4">
          Skilaboð móttekin
        </div>
        <h3 className="text-[28px] font-medium tracking-[-0.02em] text-ink mb-3">
          Takk fyrir!
        </h3>
        <p className="text-[15px] leading-[1.6] text-fog max-w-md mx-auto">
          Skilaboð þín hafa borist. Við svörum innan 24 klst. á virkum dögum.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">
          Ekki fylla út
          <input
            type="text"
            id="website"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nafn" className={labelClass}>
            Nafn *
          </label>
          <input
            type="text"
            id="nafn"
            placeholder="Fullt nafn"
            className={fieldClass}
            {...register("nafn")}
          />
          {errors.nafn && (
            <p className="mt-1 text-xs text-sev-danger">{errors.nafn.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="netfang" className={labelClass}>
            Netfang *
          </label>
          <input
            type="email"
            id="netfang"
            placeholder="nafn@netfang.is"
            className={fieldClass}
            {...register("netfang")}
          />
          {errors.netfang && (
            <p className="mt-1 text-xs text-sev-danger">{errors.netfang.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="simanumer" className={labelClass}>
          Sími
        </label>
        <input
          type="tel"
          id="simanumer"
          placeholder="+354 — — — — — — —"
          className={fieldClass}
          {...register("simanumer")}
        />
      </div>

      <div>
        <label className={labelClass}>Samskipti</label>
        <div className="flex gap-6 py-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-[15px] text-ink">
            <input
              type="radio"
              value="hringja"
              className="accent-ink w-4 h-4"
              {...register("samskipti")}
            />
            Hringja í mig
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-[15px] text-ink">
            <input
              type="radio"
              value="tolvupostur"
              className="accent-ink w-4 h-4"
              {...register("samskipti")}
            />
            Tölvupóstur
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="skilabod" className={labelClass}>
          Skilaboð *
        </label>
        <textarea
          id="skilabod"
          rows={5}
          placeholder="Segðu okkur frá verkefninu — stærð húss, staðsetning, tímarammi..."
          className={`${fieldClass} resize-none`}
          {...register("skilabod")}
        />
        {errors.skilabod && (
          <p className="mt-1 text-xs text-sev-danger">{errors.skilabod.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-sev-danger/10 border-l-2 border-sev-danger px-4 py-3">
          <p className="text-sm text-sev-danger">{error}</p>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-ink text-paper text-sm font-semibold rounded-[2px] hover:bg-navy-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sendir..." : "Senda skilaboð"}
          <span className="opacity-70">→</span>
        </button>
      </div>
    </form>
  );
}
