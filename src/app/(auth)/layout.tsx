import type { Metadata } from "next";
import { BetonHtml } from "@/components/BetonHtml";
import { betonMetadata } from "@/lib/beton-metadata";

export const metadata: Metadata = betonMetadata;

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BetonHtml>{children}</BetonHtml>;
}
