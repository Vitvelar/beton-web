// Sameiginlegar klasauppskriftir fyrir rondva.com (DESIGN.md §6). Speglar src/lib/ui.ts en með
// litatáknum rondva.css (blue, blue-deep, ink, paper, line, line-strong, muted).

type ButtonVariant = "primary" | "secondary" | "quiet" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
  "transition-[color,background-color,border-color,transform] duration-150 " +
  "active:translate-y-px " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:translate-y-0";

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 text-sm",
  md: "min-h-11 text-sm",
  lg: "min-h-13 text-base",
};

// Vinstra/hægri fylling; „quiet“ er textahnappur og fær minni fyllingu í öllum stærðum.
const BTN_PAD: Record<ButtonSize, string> = { sm: "px-4", md: "px-6", lg: "px-7" };

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-blue text-paper hover:bg-blue-deep active:bg-blue-deep disabled:hover:bg-blue aria-disabled:hover:bg-blue",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-ink hover:bg-paper-alt active:bg-paper-alt " +
    "disabled:hover:border-line-strong disabled:hover:bg-surface",
  quiet: "text-blue underline-offset-4 hover:underline active:text-blue-deep disabled:hover:no-underline",
  inverse:
    "border border-paper/40 bg-transparent text-paper hover:border-paper hover:bg-paper/10 active:bg-paper/15 " +
    "focus-visible:outline-accent-on-inverse",
};

/** Hnappur eða hnappslegur tengill á rondva.com. Einn `primary` á hvert svæði skjás. */
export function rvBtn(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  const pad = variant === "quiet" ? "px-2" : BTN_PAD[size];
  // Löng texti á mjóum skjá: `whitespace-normal` í extra tekur nowrap úr grunninum.
  const base = extra.includes("whitespace-normal") ? BTN_BASE.replace(" whitespace-nowrap", "") : BTN_BASE;
  return `${base} ${BTN_SIZE[size]} ${pad} ${BTN_VARIANT[variant]} ${extra}`.trim();
}

/** Texti-tengill með 44px snertiflöt á símum (fótur, efnisyfirlit, „til baka“). */
export const rvTapLink = "inline-flex min-h-11 items-center underline-offset-4 hover:underline active:opacity-80";

/** Tengill á dökkum fleti (fótur): paper/aukalitur, 44px á símum. */
export const rvDarkLink =
  "inline-flex min-h-11 items-center text-on-inverse-muted underline-offset-4 transition-colors hover:text-paper hover:underline active:opacity-80 sm:min-h-9";
