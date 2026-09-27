// Sameiginleg sniðföll fyrir textakatalógin (stjórnborð og skýrsla).

/** Fleirtöluform eftir Intl.PluralRules; `other` er alltaf til. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Velur fleirtöluform fyrir `count` á tungumálinu `locale`. */
export function plural(locale: string, count: number, forms: PluralForms): string {
  return forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
}

export type FillValue = string | number | null | undefined;

/**
 * Fyllir {nafn} í sniðmáti og skilar bútunum sem JSX-börnum: "Rými ({count})"
 * → ["Rými (", 3, ")"], nákvæmlega sömu textahnútar og `Rými ({n})` í JSX.
 * Tómir bútar detta út; null/undefined gildi birtast ekki (eins og í JSX).
 */
export function fill(template: string, values: Record<string, FillValue>): FillValue[] {
  return template
    .split(/\{(\w+)\}/)
    .map((part, i) => (i % 2 === 1 ? values[part] : part))
    .filter((part, i) => i % 2 === 1 || part !== "");
}

/** Sama og fill() en skilar einum streng (fyrir props, alt-texta, skráarheiti). */
export function format(template: string, values: Record<string, FillValue>): string {
  return fill(template, values).map((part) => part ?? "").join("");
}
