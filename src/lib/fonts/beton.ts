import { Anton, Epilogue, Abel } from "next/font/google";

export const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-epilogue",
});

export const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-anton",
});

export const abel = Abel({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-abel",
});

export const betonFontClassName = `${epilogue.variable} ${anton.variable} ${abel.variable}`;
