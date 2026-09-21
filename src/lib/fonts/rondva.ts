import { Inter, Source_Serif_4 } from "next/font/google";

// Rondva letur (plan/rondva/brand/USAGE.md): Inter fyrir viðmót og meginmál,
// Source Serif 4 fyrir skýrslufyrirsagnir — og hér fyrir stórar fyrirsagnir
// kynningarsíðunnar, svo síðan „hljómi" eins og skýrslan sem varan skilar.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif",
});
