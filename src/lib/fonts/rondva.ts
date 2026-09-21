import { Inter } from "next/font/google";

// Rondva notar Inter (sjá plan/rondva/brand/USAGE.md). Orðmerkið sjálft er ferlar
// í SVG og er óháð þessu letri.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
