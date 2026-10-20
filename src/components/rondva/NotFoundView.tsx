import Link from "next/link";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { AppStoreBadge } from "@/components/rondva/AppStoreBadge";
import { rvBtn } from "@/components/rondva/ui";

// 404-síða rondva.com. Notuð bæði af [...rest]/page.tsx og not-found.tsx.
export function RondvaNotFoundView() {
  return (
    <>
      <RondvaHeader />
      <main id="content" className="flex-1">
        <div className="px-6">
          <div className="mx-auto max-w-[1180px] py-20 md:py-28">
            <div className="max-w-2xl">
              <p className="rv-eyebrow">404</p>
              <h1 className="rv-display rv-balance mt-4 text-[40px] sm:text-[48px] md:text-[56px]">
                There is nothing at <em>this address.</em>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted">The page you asked for does not exist.</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
                <Link href="/" className={rvBtn("primary", "md")}>
                  Back to the front page
                </Link>
                <AppStoreBadge />
              </div>
            </div>
          </div>
        </div>
      </main>
      <RondvaFooter />
    </>
  );
}
