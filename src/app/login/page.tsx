"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-charcoal mb-2"
        >
          Lykilorð
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-charcoal focus:border-charcoal focus:ring-1 focus:ring-charcoal transition-colors"
          placeholder="Sláðu inn lykilorð"
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">Rangt lykilorð</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-charcoal px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-charcoal-light transition-colors"
      >
        Innskrá
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-light-gray">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-8">
          <div className="text-center mb-8">
            <Image
              src="/images/beton-logo.webp"
              alt="Beton ehf. merki"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto mb-4"
            />
            <p className="text-sm text-slate">
              Þessi síða er aðeins aðgengileg með lykilorði.
            </p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
