import { APP_STORE_URL } from "@/lib/rondva-links";

// Opinbert „Download on the App Store“-merki (svart SVG úr Apple marketing guidelines, 119.66 × 40).
// Má ekki breyta, snúa eða endurlita; lágmarkshæð 40 px og tær kantur umhverfis.
export function AppStoreBadge({ className, height = 48 }: { className?: string; height?: number }) {
  return (
    <a
      href={APP_STORE_URL}
      className={`inline-block rounded-[10px] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- opinbert SVG-merki, engin hagræðing */}
      <img
        src="/rondva/app-store-badge.svg"
        alt="Download Rondva on the App Store"
        width={Math.round((119.66407 / 40) * height)}
        height={height}
        style={{ height, width: "auto" }}
      />
    </a>
  );
}

// Fastur QR-kóði (public/rondva/qr-app-store.svg, búinn til einu sinni) af App Store-slóðinni.
// Aðeins á breiðum skjá: sá sem er á tölvu skannar með iPhone; sími hefur merkið.
// tone: "dark" á dökkum bakgrunni (hero), "light" á ljósum (stjórnborð).
export function AppStoreQr({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <div className={`hidden items-center gap-3 lg:flex ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fastur QR-SVG */}
      <img
        src="/rondva/qr-app-store.svg"
        alt="QR code that opens Rondva on the App Store"
        width={96}
        height={96}
        className="h-24 w-24 rounded-lg"
      />
      <p className={`max-w-[7rem] text-sm leading-snug ${tone === "dark" ? "text-paper/70" : "text-fog"}`}>Scan with your iPhone</p>
    </div>
  );
}
