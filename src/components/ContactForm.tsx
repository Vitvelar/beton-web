"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { contactSchema, type ContactFormData } from "@/lib/schemas";
import { COMPANY } from "@/lib/constants";
import { btn, field, fieldError, spinner } from "@/lib/ui";
import { metaLabel } from "@/components/Editorial";

const labelClass = `${metaLabel} mb-1 block`;
const linkClass = "text-ink underline underline-offset-4 hover:text-navy";

// GTM er aðeins hlaðið á beton.is í framleiðslu; annars er dataLayer ekki til og
// kallið gerir ekkert. Engar persónuupplýsingar fara í atburðinn.
function trackSubmit() {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer?.push({ event: "contact_form_submit" });
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    if (submitted) thanksRef.current?.focus();
  }, [submitted]);

  async function onSubmit(data: ContactFormData) {
    setError(null);
    let res: Response;
    try {
      res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      setError("Ekki náðist samband við þjónustuna. Athugaðu nettenginguna og reyndu aftur.");
      return;
    }
    if (!res.ok) {
      // Svarið getur verið HTML (t.d. villusíða); þá sýnum við almenn skilaboð.
      const body: { error?: string } | null = await res.json().catch(() => null);
      setError(body?.error || "Ekki tókst að senda skilaboðin.");
      return;
    }
    trackSubmit();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="py-8 text-center">
        <div className={`${metaLabel} mb-4 text-navy`}>Skilaboð móttekin</div>
        <h2
          ref={thanksRef}
          tabIndex={-1}
          className="mb-3 text-h3 font-medium text-ink focus:outline-none"
        >
          Takk fyrir!
        </h2>
        <p className="mx-auto max-w-md text-base text-fog">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="nafn" className={labelClass}>
            Nafn *
          </label>
          <input
            type="text"
            id="nafn"
            placeholder="Fullt nafn"
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.nafn ? true : undefined}
            aria-describedby={errors.nafn ? "nafn-error" : undefined}
            className={field("line")}
            {...register("nafn")}
          />
          {errors.nafn && (
            <p id="nafn-error" className={fieldError}>
              {errors.nafn.message}
            </p>
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
            autoComplete="email"
            aria-required="true"
            aria-invalid={errors.netfang ? true : undefined}
            aria-describedby={errors.netfang ? "netfang-error" : undefined}
            className={field("line")}
            {...register("netfang")}
          />
          {errors.netfang && (
            <p id="netfang-error" className={fieldError}>
              {errors.netfang.message}
            </p>
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
          placeholder="Símanúmer"
          autoComplete="tel"
          aria-invalid={errors.simanumer ? true : undefined}
          aria-describedby={errors.simanumer ? "simanumer-error" : undefined}
          className={field("line")}
          {...register("simanumer")}
        />
        {errors.simanumer && (
          <p id="simanumer-error" className={fieldError}>
            {errors.simanumer.message}
          </p>
        )}
      </div>

      <fieldset
        aria-describedby={errors.samskipti ? "samskipti-error" : undefined}
        className="min-w-0 border-0 p-0"
      >
        <legend className={`${labelClass} p-0`}>Samskipti</legend>
        <div className="flex flex-wrap gap-x-6">
          <label className="flex min-h-11 items-center gap-3 text-base text-ink">
            <input
              type="radio"
              value="hringja"
              className="size-5 accent-navy"
              {...register("samskipti")}
            />
            Hringja í mig
          </label>
          <label className="flex min-h-11 items-center gap-3 text-base text-ink">
            <input
              type="radio"
              value="tolvupostur"
              className="size-5 accent-navy"
              {...register("samskipti")}
            />
            Tölvupóstur
          </label>
        </div>
        {errors.samskipti && (
          <p id="samskipti-error" className={fieldError}>
            {errors.samskipti.message}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="skilabod" className={labelClass}>
          Skilaboð *
        </label>
        <textarea
          id="skilabod"
          rows={5}
          placeholder="Segðu okkur frá verkefninu — stærð húss, staðsetning, tímarammi..."
          aria-required="true"
          aria-invalid={errors.skilabod ? true : undefined}
          aria-describedby={errors.skilabod ? "skilabod-error" : undefined}
          className={`${field("line")} resize-none`}
          {...register("skilabod")}
        />
        {errors.skilabod && (
          <p id="skilabod-error" className={fieldError}>
            {errors.skilabod.message}
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="border-l-2 border-danger bg-danger-tint px-4 py-3 text-sm text-danger">
          <p className="font-semibold">{error}</p>
          <p className="mt-1 text-ink">
            Þú getur sent okkur tölvupóst á{" "}
            <a href={`mailto:${COMPANY.email}`} className={linkClass}>
              {COMPANY.email}
            </a>{" "}
            eða hringt í{" "}
            <a href={COMPANY.phoneHref} className={`${linkClass} whitespace-nowrap`}>
              {COMPANY.phone}
            </a>
            .
          </p>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={btn("primary", "lg")}
        >
          {isSubmitting ? (
            <>
              <span className={spinner} aria-hidden="true" />
              Sendir...
            </>
          ) : (
            <>
              Senda skilaboð <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
