// Símarammi fyrir skjámyndir úr appinu. `src` er ensk skjámynd (1179×2556 eða
// sama hlutfall). Ef engin skjámynd er til ennþá sýnum við ekkert falskt —
// ramminn er þá tómur með merkinu.
export function PhoneFrame({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/19.5] w-[260px] rounded-[44px] bg-ink p-[10px] shadow-[0_40px_90px_-30px_rgba(16,20,24,0.6)] ring-1 ring-white/10 ${className ?? ""}`}
    >
      <div className="absolute left-1/2 top-[14px] z-10 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#0b0e12]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size screenshot
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
            <img src="/rondva/mark-white.svg" alt="" width={48} height={48} className="opacity-60" />
          </div>
        )}
      </div>
    </div>
  );
}
