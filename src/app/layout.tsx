import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" });

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hydstartupmap.com";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "HydStartupMap — Hyderabad startup map, jobs & events",
  description: "The living map of Hyderabad startups. Real careers pages, sourced news, corridor hiring heat, and events — no invented jobs.",
  alternates: { canonical: site },
  openGraph: {
    title: "HydStartupMap — Hyderabad startup map",
    description: "Pin-point buildings, live careers links, and corridor heat across HITEC City, Gachibowli, and Financial District.",
    url: site,
    siteName: "HydStartupMap",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${manrope.variable} ${spaceMono.variable}`}>{children}</body></html>;
}
