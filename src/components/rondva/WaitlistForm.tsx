"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { waitlistSchema, type WaitlistFormData } from "@/lib/schemas";
import { trackLead } from "@/lib/rondva-consent";

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/60 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20";

const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  async function onSubmit(data: WaitlistFormData) {
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Something went wrong. Please try again.");
      }
      setSubmitted(true);
      trackLead("waitlist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-card border border-line bg-paper px-6 py-12 text-center">
        <p className="rv-eyebrow">Thank you</p>
        <p className="mt-4 text-lg text-ink rv-balance">
          You&apos;re on the list. We&apos;ll write when Rondva is ready for you to try.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-card border border-line bg-paper p-6 sm:p-8"
      noValidate
    >
      {/* Honeypot — must stay empty. Real visitors never see or fill this in. */}
      <input
        type="text"
        id="website"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        {...register("website")}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            type="email"
            id="email"
            required
            placeholder="you@example.com"
            className={fieldClass}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>
            Country
          </label>
          <input
            type="text"
            id="country"
            placeholder="e.g. Germany"
            className={fieldClass}
            {...register("country")}
          />
          {errors.country && (
            <p className="mt-1.5 text-sm text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-600/30 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-blue px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-blue-deep disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? "Joining…" : "Join the waitlist"}
        </button>
        <p className="mt-3 text-sm text-muted">
          We&apos;ll only use this to contact you about Rondva. Unsubscribe in one click.
        </p>
      </div>
    </form>
  );
}
