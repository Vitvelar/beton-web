// Sameiginlegar klasauppskriftir fyrir hnappa, reiti og merki (DESIGN.md §6).
// Gildir á beton.is og í stjórnborðinu á báðum lénum: litatáknin (navy, ink,
// fog, …) fá Rondva-gildi undir html[data-brand="rondva"], svo sama uppskrift
// lítur rétt út á báðum vörumerkjum. rondva.com notar src/components/rondva/ui.ts.

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
  "transition-[color,background-color,border-color,transform] duration-150 " +
  "active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:translate-y-0";

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-13 px-7 text-base",
};

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-paper hover:bg-navy-deep active:bg-navy-deep " +
    "disabled:hover:bg-navy aria-disabled:hover:bg-navy",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-ink/5 active:bg-ink/10 " +
    "disabled:hover:border-line-strong disabled:hover:bg-transparent",
  quiet:
    "px-2 text-navy underline-offset-4 hover:underline active:text-navy-deep disabled:hover:no-underline",
  danger:
    "border border-danger/40 bg-transparent text-danger hover:bg-danger-tint active:bg-danger-tint " +
    "disabled:hover:bg-transparent",
  inverse:
    "border border-paper/40 bg-transparent text-paper hover:bg-paper/10 active:bg-paper/15 " +
    "focus-visible:outline-accent-on-inverse",
};

/** Hnappur eða hnappslegur tengill. Einn `primary` á hvert svæði skjás. */
export function btn(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `${BTN_BASE} ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${extra}`.trim();
}

/** Lítill snúningsvísir í hnapp meðan aðgerð er í gangi (aria-hidden; hnappurinn fær aria-busy). */
export const spinner =
  "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none";

type FieldShape = "box" | "sharp" | "line";

const FIELD_BASE =
  "w-full text-ink placeholder:text-fog transition-colors duration-150 " +
  "focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger";

const FIELD_SHAPE: Record<FieldShape, string> = {
  // Stjórnborð og innskráning: kassi með ávölum hornum.
  box:
    "min-h-11 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm " +
    "focus:border-navy focus-visible:ring-2 focus-visible:ring-navy/25",
  // Beton-markaðssíða: skörp horn.
  sharp:
    "min-h-11 rounded-sharp border border-line-strong bg-surface px-3.5 py-2.5 text-base " +
    "focus:border-navy focus-visible:ring-2 focus-visible:ring-navy/25",
  // Beton-samskiptaform: aðeins undirlína, 2px áhersla á fókus.
  line:
    "min-h-11 border-0 border-b border-line-strong bg-transparent px-0 py-3 text-base " +
    "focus:border-b-2 focus:border-navy focus:pb-[11px]",
};

/** Texta-, val- og textasvæðisreitur. 16px á símum er tryggt í globals.css. */
export function field(shape: FieldShape = "box", extra = ""): string {
  return `${FIELD_BASE} ${FIELD_SHAPE[shape]} ${extra}`.trim();
}

/** Merki fyrir reit (<label htmlFor>). */
export const fieldLabel = "mb-1.5 block text-sm font-medium text-ink";
/** Hjálpartexti undir reit. */
export const fieldHelp = "mt-1 text-xs text-fog";
/** Villuboð beint undir reit (gefðu id og tengdu með aria-describedby). */
export const fieldError = "mt-1.5 text-sm text-danger";

type BadgeTone = "calm" | "warn" | "danger" | "success" | "neutral";

const BADGE_TONE: Record<BadgeTone, { box: string; dot: string }> = {
  calm: { box: "bg-sev-calm-tint text-sev-calm-text", dot: "bg-sev-calm" },
  warn: { box: "bg-sev-warn-tint text-sev-warn-text", dot: "bg-sev-warn" },
  danger: { box: "bg-sev-danger-tint text-sev-danger-text", dot: "bg-sev-danger" },
  success: { box: "bg-success-tint text-success", dot: "bg-success" },
  neutral: { box: "bg-paper-alt text-ink", dot: "bg-fog" },
};

/** Merki (pilla): litatónn + punktur, aldrei litur einn. Notaðu badgeDot fyrir punktinn. */
export function badge(tone: BadgeTone): string {
  return `inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${BADGE_TONE[tone].box}`;
}
export function badgeDot(tone: BadgeTone): string {
  return `size-1.5 shrink-0 rounded-full ${BADGE_TONE[tone].dot}`;
}

/** Tengill sem lítur út eins og texti en hefur 44px snertiflöt á símum (til baka-tenglar, fótur). */
export const tapLink =
  "inline-flex min-h-11 items-center gap-1 underline-offset-4 hover:underline active:opacity-80";
