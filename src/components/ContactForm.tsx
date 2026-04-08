"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { contactSchema, type ContactFormData } from "@/lib/schemas";

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
      <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
        <svg
          className="w-16 h-16 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-charcoal mb-2">
          Takk fyrir!
        </h3>
        <p className="text-slate">
          Takk fyrir að hafa samband við Beton ehf. Við munum svara fyrirspurnum
          eins fljótt og auðið er.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Honeypot — hidden from humans */}
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

      <div>
        <label htmlFor="nafn" className="block text-sm font-medium text-charcoal mb-2">
          Nafn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nafn"
          placeholder="Fullt nafn"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-charcoal placeholder:text-gray-400 focus:border-charcoal focus:ring-1 focus:ring-charcoal transition-colors"
          {...register("nafn")}
        />
        {errors.nafn && (
          <p className="mt-1 text-sm text-red-600">{errors.nafn.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="netfang" className="block text-sm font-medium text-charcoal mb-2">
          Netfang <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="netfang"
          placeholder="netfang@dæmi.is"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-charcoal placeholder:text-gray-400 focus:border-charcoal focus:ring-1 focus:ring-charcoal transition-colors"
          {...register("netfang")}
        />
        {errors.netfang && (
          <p className="mt-1 text-sm text-red-600">{errors.netfang.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="simanumer" className="block text-sm font-medium text-charcoal mb-2">
          Símanúmer
        </label>
        <input
          type="tel"
          id="simanumer"
          placeholder="Símanúmer (valkvætt)"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-charcoal placeholder:text-gray-400 focus:border-charcoal focus:ring-1 focus:ring-charcoal transition-colors"
          {...register("simanumer")}
        />
      </div>

      <div>
        <label htmlFor="skilabod" className="block text-sm font-medium text-charcoal mb-2">
          Skilaboð <span className="text-red-500">*</span>
        </label>
        <textarea
          id="skilabod"
          rows={5}
          placeholder="Hvernig getum við aðstoðað þig?"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-charcoal placeholder:text-gray-400 focus:border-charcoal focus:ring-1 focus:ring-charcoal transition-colors resize-vertical"
          {...register("skilabod")}
        />
        {errors.skilabod && (
          <p className="mt-1 text-sm text-red-600">{errors.skilabod.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-charcoal px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-charcoal-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sendir..." : "Senda skilaboð"}
      </button>
    </form>
  );
}
