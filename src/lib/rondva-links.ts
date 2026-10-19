// Slóðir og rofar sem kynningarsíðan, /nz og stjórnborðið deila. Ein heimild, svo App Store-slóðin
// og sýnisskýrslan geti aldrei orðið mismunandi á milli síðna.

/** Rondva: Building Inspections á App Store (ASC app 6817769506). */
export const APP_STORE_URL = "https://apps.apple.com/app/id6817769506";

/**
 * Er til alvöru AI-sýnisskýrsla (public/rondva/sample-nzs4306.pdf)? EKKI setja true fyrr en
 * hún er til: hnappurinn „See a sample report“ er þá falinn. Gamla handskrifaða layout-PDF
 * er ekki AI-úttak og má aldrei birtast hér.
 */
export const HAS_SAMPLE = false;
export const SAMPLE_REPORT_URL = "/rondva/sample-nzs4306.pdf";

/** Fyrir fólk sem notar ekki iPhone. */
export const NOT_ON_IPHONE_LINE = "Not on iPhone? Email rondva@rondva.com.";
