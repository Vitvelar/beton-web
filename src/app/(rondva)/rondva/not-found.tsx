import Link from "next/link";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";

export default function RondvaNotFound() {
  return (
    <>
      <RondvaHeader />
      <main className="flex-1 flex items-center">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="rv-eyebrow">404</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            There is nothing here yet.
          </h1>
          <p className="mt-4 text-muted">
            Rondva is in development. The page you asked for does not exist.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-blue transition-colors"
          >
            Back to the front page
          </Link>
        </div>
      </main>
      <RondvaFooter />
    </>
  );
}
